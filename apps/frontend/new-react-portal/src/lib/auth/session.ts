// Talks to the api-gateway BFF (apps/backend/api-gateway/src/bff), which
// holds the real tokens in httpOnly cookies. This client only ever sees a
// short-lived access token via /token, handed back on demand for the
// generated OpenAPI clients — the refresh token never reaches the browser.

export function getGatewayUrl(): string {
  return import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';
}

export interface LoginResult {
  userType: string;
  redirectPath: string;
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

async function bffRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${getGatewayUrl()}${path}`, {
      credentials: 'include',
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
  } catch {
    throw new GatewayAuthError(502, 'Unable to reach the authentication service');
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new GatewayAuthError(res.status, extractErrorMessage(data, 'Authentication request failed'));
  }

  return data as T;
}

export function loginWithPassword(email: string, password: string): Promise<LoginResult> {
  return bffRequest<LoginResult>('/api/bff/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logoutSession(): Promise<void> {
  try {
    await bffRequest('/api/bff/auth/logout', { method: 'POST' });
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

export function fetchCurrentUser(): Promise<CurrentUser> {
  return bffRequest<CurrentUser>('/api/bff/auth/me');
}

export async function fetchBffAccessToken(): Promise<string> {
  const { accessToken } = await bffRequest<{ accessToken: string }>('/api/bff/auth/token');
  return accessToken;
}
