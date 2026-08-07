import { api, setSession, clearSession, getRefreshToken } from './client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface RegisterResult {
  id: string;
  email: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// Matches AuthService.getProfile() in apps/api/src/auth/auth.service.ts — /auth/me reads the
// current user document from Mongo (not just the JWT payload) so email/phone stay up to date.
export interface MeResult {
  userId: string;
  email: string;
  phone?: string;
  roles: string[];
  status: string;
}

export async function register(payload: RegisterPayload): Promise<RegisterResult> {
  const res = await api.post<RegisterResult>('/auth/register', payload);
  return res.data;
}

export async function login(payload: LoginPayload): Promise<AuthTokens> {
  const res = await api.post<AuthTokens>('/auth/login', payload);
  setSession(res.data);
  return res.data;
}

export async function getMe(): Promise<MeResult> {
  const res = await api.get<MeResult>('/auth/me');
  return res.data;
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken });
    }
  } finally {
    clearSession();
  }
}

export async function resendOtp(userId: string): Promise<void> {
  await api.post('/auth/resend-otp', { userId });
}

export interface VerifyOtpPayload {
  userId: string;
  code: string;
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<AuthTokens> {
  const res = await api.post<AuthTokens>('/auth/verify-otp', payload);
  setSession(res.data);
  return res.data;
}
