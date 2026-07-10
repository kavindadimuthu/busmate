// Thin client for the api-gateway BFF auth endpoints (/api/bff/auth/*).
// All calls use credentials:'include' so the httpOnly session cookies set by
// the gateway are sent and received. The gateway base URL comes from Vite env
// (VITE_GATEWAY_URL), defaulting to the standard local gateway port.

const GATEWAY_URL =
  (import.meta as any).env?.VITE_GATEWAY_URL?.replace(/\/$/, '') || 'http://localhost:8080';

export interface AuthUser {
  userId: string | null;
  email: string;
  fullName: string;
  username: string;
  userType: string;
  redirectPath: string;
}

export interface LoginResult {
  userType: string;
  redirectPath: string;
}

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data?.error || data?.message || fallback;
  } catch {
    return fallback;
  }
}

export async function bffLogin(email: string, password: string): Promise<LoginResult> {
  const res = await fetch(`${GATEWAY_URL}/api/bff/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(await parseError(res, 'Login failed'));
  }
  return res.json();
}

// Returns the current user, or null if there is no valid session (401/403).
export async function bffMe(): Promise<AuthUser | null> {
  const res = await fetch(`${GATEWAY_URL}/api/bff/auth/me`, {
    credentials: 'include',
  });
  if (!res.ok) return null;
  return res.json();
}

export async function bffLogout(): Promise<void> {
  try {
    await fetch(`${GATEWAY_URL}/api/bff/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Best-effort: the client clears its own state regardless.
  }
}
