import axios, { isAxiosError, type InternalAxiosRequestConfig } from 'axios';

// apps/api wraps every response as { success: true, data } / { success: false, error }
// (see apps/api/src/common/interceptors/response.interceptor.ts and all-exceptions.filter.ts).
export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
}
export interface ApiErrorEnvelope {
  success: false;
  error: { code: string; message: string };
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

declare module 'axios' {
  interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

// Access token lives only in JS memory — never localStorage — so it disappears on reload;
// the refresh token below is what recovers a session after that (see tuan-02-jwt-tokens.md §3).
let accessToken: string | null = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

// The theory doc's ideal is an httpOnly cookie for the refresh token, set by the server.
// apps/api's /auth/login and /auth/refresh currently return refreshToken in the JSON body
// instead (see auth.controller.ts) rather than setting a cookie, so there is nowhere for the
// browser to keep it *except* client-side storage if a reload should survive without a full
// re-login. localStorage is the pragmatic stand-in until the API sets an httpOnly cookie —
// swap this out then, since it's more XSS-exposed than a cookie for a long-lived credential.
const REFRESH_TOKEN_KEY = 'aperto-refresh-token';

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
  else window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function setSession(tokens: { accessToken: string; refreshToken: string }) {
  setAccessToken(tokens.accessToken);
  setRefreshToken(tokens.refreshToken);
}

export function clearSession() {
  setAccessToken(null);
  setRefreshToken(null);
}

export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// Single-flight refresh: every 401 that arrives while a refresh is already in progress queues
// on `pendingQueue` instead of firing its own /auth/refresh — refresh tokens rotate (one-time
// use), so a second concurrent refresh call would fail and falsely look like a real logout.
let isRefreshing = false;
let pendingQueue: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  pendingQueue.push(cb);
}

function onRefreshed(newToken: string) {
  pendingQueue.forEach((cb) => cb(newToken));
  pendingQueue = [];
}

function redirectToLogin() {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

api.interceptors.response.use(
  (response) => {
    // Unwrap { success, data } so callers work with the real payload directly.
    const body = response.data as ApiSuccessEnvelope<unknown> | undefined;
    if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
      response.data = body.data;
    }
    return response;
  },
  async (error: unknown) => {
    if (!isAxiosError(error) || !error.config) {
      return Promise.reject(error);
    }
    const config = error.config as InternalAxiosRequestConfig;

    if (error.response?.status !== 401 || config._retry) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearSession();
      redirectToLogin();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue behind the in-flight refresh instead of firing a second one. If that refresh
      // ultimately fails, the catch branch below redirects to /login and the page unload
      // abandons this pending promise — there is nothing else useful to resolve it to.
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          config.headers.set('Authorization', `Bearer ${newToken}`);
          config._retry = true;
          resolve(api(config));
        });
      });
    }

    config._retry = true;
    isRefreshing = true;
    try {
      // Plain axios, not the `api` instance — calling through `api` would re-enter this same
      // interceptor if the refresh call itself ever 401s, causing unwanted recursion.
      const { data } = await axios.post<ApiSuccessEnvelope<{ accessToken: string; refreshToken: string }>>(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
      );
      setSession(data.data);
      onRefreshed(data.data.accessToken);
      config.headers.set('Authorization', `Bearer ${data.data.accessToken}`);
      return api(config);
    } catch (refreshError) {
      pendingQueue = [];
      clearSession();
      redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Đã có lỗi xảy ra, vui lòng thử lại sau',
): string {
  if (isAxiosError(error)) {
    const body = error.response?.data as ApiErrorEnvelope | undefined;
    return body?.error?.message ?? fallback;
  }
  return fallback;
}
