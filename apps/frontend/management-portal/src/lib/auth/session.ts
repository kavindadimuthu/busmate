import 'server-only';

export const ACCESS_TOKEN_COOKIE = 'bm_access_token';
export const REFRESH_TOKEN_COOKIE = 'bm_refresh_token';

// Sliding window: reset on every successful refresh (see setSessionCookies),
// so an active user stays signed in indefinitely and an idle one is signed
// out after 7 days.
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 3600;

// Staff-only roles served by this portal, per the `user_types` seed data
// (admin, mot, timekeeper, operator, conductor, passenger). Conductor and
// passenger accounts belong to the mobile apps, not the management portal.
const PORTAL_ROLES = ['admin', 'mot', 'timekeeper', 'operator'] as const;
export type PortalRole = (typeof PORTAL_ROLES)[number];

export function isPortalRole(userType: string | null | undefined): userType is PortalRole {
  return !!userType && (PORTAL_ROLES as readonly string[]).includes(userType.toLowerCase());
}

export function getGatewayUrl(): string {
  return process.env.API_GATEWAY_URL || 'http://localhost:8080';
}

// Matches user-management's own fallback (application.yml's supabase.jwt.secret),
// so a fresh checkout with no secrets configured on either side still works together.
export function getJwtSecret(): string {
  return process.env.SUPABASE_JWT_SECRET || 'dev-only-placeholder-jwt-secret-change-me';
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
  }
  return fallback;
}

async function gatewayAuthRequest(path: string, body: unknown): Promise<GatewaySession> {
  let res: Response;
  try {
    res = await fetch(`${getGatewayUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch {
    throw new GatewayAuthError(502, 'Unable to reach the authentication service');
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new GatewayAuthError(res.status, extractErrorMessage(data, 'Authentication request failed'));
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
  return gatewayAuthRequest('/api/auth/login', { email, password });
}

export function refreshSession(refreshToken: string): Promise<GatewaySession> {
  return gatewayAuthRequest('/api/auth/refresh', { refreshToken });
}

// Best-effort: the caller always clears its local cookies regardless of
// whether the upstream revoke call actually succeeds.
export async function logoutSession(accessToken: string): Promise<void> {
  try {
    await fetch(`${getGatewayUrl()}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Backend logout call failed:', error);
  }
}

interface CookieJar {
  set(name: string, value: string, options: Record<string, unknown>): void;
  delete(name: string): void;
}

export function setSessionCookies(
  target: { cookies: CookieJar },
  session: Pick<GatewaySession, 'accessToken' | 'refreshToken' | 'expiresIn'>,
): void {
  const baseOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
  target.cookies.set(ACCESS_TOKEN_COOKIE, session.accessToken, { ...baseOptions, maxAge: session.expiresIn });
  target.cookies.set(REFRESH_TOKEN_COOKIE, session.refreshToken, {
    ...baseOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookies(target: { cookies: CookieJar }): void {
  target.cookies.delete(ACCESS_TOKEN_COOKIE);
  target.cookies.delete(REFRESH_TOKEN_COOKIE);
}
