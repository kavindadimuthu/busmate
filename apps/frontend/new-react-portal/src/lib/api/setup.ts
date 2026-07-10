import { OpenAPI as RouteAPI } from '@busmate/api-client-route';
import { OpenAPI as TicketingAPI } from '@busmate/api-client-ticketing';
import { OpenAPI as LocationAPI } from '@busmate/api-client-location';
import { OpenAPI as UserManagementAPI } from '@busmate/api-client-user';
import { ACCESS_TOKEN_STORAGE_KEY, getGatewayUrl } from '@/lib/auth/session';

const gatewayBaseUrl =
  import.meta.env.VITE_API_GATEWAY_URL ||
  import.meta.env.VITE_USER_MANAGEMENT_API_URL ||
  getGatewayUrl();

RouteAPI.BASE = import.meta.env.VITE_ROUTE_MANAGEMENT_API_URL || gatewayBaseUrl;
TicketingAPI.BASE = import.meta.env.VITE_TICKETING_API_URL || gatewayBaseUrl;
LocationAPI.BASE = (import.meta.env.VITE_LOCATION_TRACKING_API_URL || 'http://localhost:4000') + '/api';
// Goes through api-gateway (not straight to user-management) — same as every other
// browser-facing call to this service. See lib/api/adminUsers.ts for the admin CRUD layer.
UserManagementAPI.BASE = gatewayBaseUrl;

// Cache the token to avoid fetching on every API call.
// The token is refreshed when a fetch fails (returns 401) or after expiry.
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function fetchAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  if (!accessToken) {
    cachedToken = null;
    throw new Error('Missing access token');
  }
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

// Set up async token resolver for all generated API clients.
// The generated request.ts resolves this and adds Authorization: Bearer <token>.
const tokenResolver = () => fetchAccessToken();

RouteAPI.TOKEN = tokenResolver;
TicketingAPI.TOKEN = tokenResolver;
LocationAPI.TOKEN = tokenResolver;
UserManagementAPI.TOKEN = tokenResolver;
