// Configures the generated OpenAPI clients for the operator portal. Ported from
// management-portal's lib/api/setup.ts, adapted for a static Vite SPA talking to
// a cross-origin gateway: the token comes from the BFF's /api/bff/auth/token
// (which reads the httpOnly cookie), so fetchAccessToken uses credentials:'include'
// and the absolute gateway URL instead of a same-origin relative path.
import { OpenAPI as RouteAPI } from '@busmate/api-client-route';
import { OpenAPI as TicketingAPI } from '@busmate/api-client-ticketing';
import { OpenAPI as UserManagementAPI } from '@busmate/api-client-user';

const GATEWAY_URL =
  (import.meta as any).env?.VITE_GATEWAY_URL?.replace(/\/$/, '') || 'http://localhost:8080';

// Cache the token to avoid a round-trip on every API call; refresh 60s before expiry.
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function fetchAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const res = await fetch(`${GATEWAY_URL}/api/bff/auth/token`, { credentials: 'include' });
  if (!res.ok) {
    cachedToken = null;
    throw new Error('Failed to retrieve access token');
  }

  const { accessToken } = await res.json();
  cachedToken = accessToken;

  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    tokenExpiresAt = payload.exp * 1000 - 60_000;
  } catch {
    tokenExpiresAt = now + 5 * 60_000;
  }

  return accessToken;
}

// Called by an expired cached token / a 401 elsewhere to force a re-fetch.
export function clearCachedToken(): void {
  cachedToken = null;
  tokenExpiresAt = 0;
}

const tokenResolver = () => fetchAccessToken();

export function configureApiClients(): void {
  RouteAPI.BASE = GATEWAY_URL;
  TicketingAPI.BASE = GATEWAY_URL;
  UserManagementAPI.BASE = GATEWAY_URL;

  RouteAPI.TOKEN = tokenResolver;
  TicketingAPI.TOKEN = tokenResolver;
  UserManagementAPI.TOKEN = tokenResolver;
}
