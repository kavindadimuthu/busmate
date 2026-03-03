import { OpenAPI as RouteAPI } from '@busmate/api-client-route';
import { OpenAPI as TicketingAPI } from '@busmate/api-client-ticketing';
import { OpenAPI as LocationAPI } from '@busmate/api-client-location';

RouteAPI.BASE = process.env.NEXT_PUBLIC_ROUTE_MANAGEMENT_API_URL || 'http://localhost:8080';
TicketingAPI.BASE = process.env.NEXT_PUBLIC_TICKETING_API_URL || 'http://localhost:8083';
LocationAPI.BASE = (process.env.NEXT_PUBLIC_LOCATION_TRACKING_API_URL || 'http://localhost:4000') + '/api';

// Cache the token to avoid fetching on every API call.
// The token is refreshed when a fetch fails (returns 401) or after expiry.
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function fetchAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const res = await fetch('/api/auth/token');
  if (!res.ok) {
    cachedToken = null;
    throw new Error('Failed to retrieve access token');
  }

  const { accessToken } = await res.json();
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
