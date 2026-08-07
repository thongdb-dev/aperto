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

// Matches AuthenticatedUser in apps/api/src/auth/decorators/current-user.decorator.ts —
// what the JwtStrategy attaches to request.user from the access token payload.
export interface MeResult {
  userId: string;
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
