// Framework-agnostic session logic for the BFF module, ported almost verbatim
// from management-portal's src/lib/auth/session.ts. The only change: it calls
// user-service directly (env.USER_SERVICE_URL) instead of looping back through
// the gateway's own /api/auth proxy.
import { env } from '../config/env';

export const ACCESS_TOKEN_COOKIE = 'bm_access_token';
export const REFRESH_TOKEN_COOKIE = 'bm_refresh_token';

// Sliding window: reset on every successful refresh (see setSessionCookies in
// cookies.ts), so an active user stays signed in and an idle one is signed out
// after 7 days.
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 3600;

export function getJwtSecret(): string {
  return env.SUPABASE_JWT_SECRET;
}

export interface GatewaySession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
  userType: string;
}

export class GatewayAuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'GatewayAuthError';
    this.status = status;
  }
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const err = (body as Record<string, unknown>).error;
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object' && typeof (err as Record<string, unknown>).message === 'string') {
      return (err as Record<string, unknown>).message as string;
    }
    const msg = (body as Record<string, unknown>).message;
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

async function userServiceAuthRequest(path: string, body: unknown): Promise<GatewaySession> {
  let res: Response;
  try {
    res = await fetch(`${env.USER_SERVICE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new GatewayAuthError(502, 'Unable to reach the authentication service');
  }

  const data = (await res.json().catch(() => null)) as Record<string, any> | null;

  if (!res.ok || !data) {
    throw new GatewayAuthError(res.status || 502, extractErrorMessage(data, 'Authentication request failed'));
  }

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: Number(data.expiresIn) || DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
    userId: data.userId,
    userType: data.userType,
  };
}

export function loginWithPassword(email: string, password: string): Promise<GatewaySession> {
  return userServiceAuthRequest('/api/auth/login', { email, password });
}

export function refreshSession(refreshToken: string): Promise<GatewaySession> {
  return userServiceAuthRequest('/api/auth/refresh', { refreshToken });
}

// Best-effort: the caller always clears its local cookies regardless of whether
// the upstream revoke call actually succeeds.
export async function logoutSession(accessToken: string): Promise<void> {
  try {
    await fetch(`${env.USER_SERVICE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (error) {
    console.error('[BFF] Backend logout call failed:', error);
  }
}

// Fetch the authenticated user's profile from user-service using a valid access
// token. Returns null on any failure so callers can fall through to refresh.
export async function fetchMe(accessToken: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${env.USER_SERVICE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}
