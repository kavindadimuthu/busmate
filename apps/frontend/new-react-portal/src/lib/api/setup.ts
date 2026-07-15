import { OpenAPI as RouteAPI } from '@busmate/api-client-core';
import { OpenAPI as TicketingAPI } from '@busmate/api-client-ticketing';
import { OpenAPI as UserManagementAPI } from '@busmate/api-client-user';
import { fetchBffAccessToken, getGatewayUrl } from '@/lib/auth/session';

const gatewayBaseUrl =
  import.meta.env.VITE_API_GATEWAY_URL ||
  import.meta.env.VITE_USER_MANAGEMENT_API_URL ||
  getGatewayUrl();

RouteAPI.BASE = import.meta.env.VITE_ROUTE_MANAGEMENT_API_URL || gatewayBaseUrl;
TicketingAPI.BASE = import.meta.env.VITE_TICKETING_API_URL || gatewayBaseUrl;
// Goes through api-gateway (not straight to user-management) — same as every other
// browser-facing call to this service. See lib/api/adminUsers.ts for the admin CRUD layer.
UserManagementAPI.BASE = gatewayBaseUrl;

// Cache the token in memory to avoid a round trip to the BFF on every API
// call. The token itself lives server-side in an httpOnly cookie — this is
// just a short-lived copy fetched via GET /api/bff/auth/token.
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function fetchAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const accessToken = await fetchBffAccessToken();
  cachedToken = accessToken;

  // Decode the JWT payload to extract expiry, refresh 60s before it expires
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    tokenExpiresAt = (payload.exp * 1000) - 60_000;
  } catch {
    // If we can't parse expiry, cache for 5 minutes
    tokenExpiresAt = now + 5 * 60_000;
  }

  return accessToken;
}

export function clearCachedAccessToken(): void {
  cachedToken = null;
  tokenExpiresAt = 0;
}

// Set up async token resolver for all generated API clients.
// The generated request.ts resolves this and adds Authorization: Bearer <token>.
const tokenResolver = () => fetchAccessToken();

RouteAPI.TOKEN = tokenResolver;
TicketingAPI.TOKEN = tokenResolver;
UserManagementAPI.TOKEN = tokenResolver;
