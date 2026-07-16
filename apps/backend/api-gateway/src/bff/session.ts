import { env } from '../config/env';
import { verifyAccessToken } from '../auth/tokenVerifier';

// Talks to user-service directly rather than looping back through this same
// gateway's own /api/auth/* proxy routes.

export interface GatewaySession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
  userType: string;
}

export interface CurrentUser {
  userId: string;
  email: string;
  fullName?: string;
  username?: string;
  phoneNumber?: string;
  userType: string;
  accountStatus?: string;
}

export class UpstreamAuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'UpstreamAuthError';
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

async function userServiceRequest<T>(path: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${env.USER_SERVICE_URL}${path}`, init);
  } catch {
    throw new UpstreamAuthError(502, 'Unable to reach the authentication service');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new UpstreamAuthError(res.status, extractErrorMessage(data, 'Authentication request failed'));
  }
  return data as T;
}

export function loginWithPassword(email: string, password: string): Promise<GatewaySession> {
  return userServiceRequest('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

export function refreshSession(refreshToken: string): Promise<GatewaySession> {
  return userServiceRequest('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
}

export function fetchCurrentUser(accessToken: string): Promise<CurrentUser> {
  return userServiceRequest('/api/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Best-effort: callers clear cookies regardless of whether this succeeds.
export async function logoutUpstream(accessToken: string): Promise<void> {
  try {
    await fetch(`${env.USER_SERVICE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (error) {
    console.error('[BFF] Upstream logout call failed:', error);
  }
}

export async function isAccessTokenValid(token: string): Promise<boolean> {
  try {
    await verifyAccessToken(token);
    return true;
  } catch {
    return false;
  }
}
