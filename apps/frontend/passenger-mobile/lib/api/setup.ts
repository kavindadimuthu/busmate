import { OpenAPI as UserAPI } from '@busmate/api-client-user';
import { OpenAPI as RouteAPI } from '@busmate/api-client-core';
import { OpenAPI as TicketingAPI } from '@busmate/api-client-ticketing';
import ENV from '@/config/env';
import { installUserApiTokenResolver } from '@/lib/auth/tokenStore';

/**
 * Configure the shared generated API clients with their base URLs and the
 * auto-refreshing token resolver. Call once at app startup.
 *
 * Auth/user/profile calls are routed through the API gateway (not straight to
 * user-service) so JWT verification, CORS and rate limiting are enforced
 * centrally. The token resolver auto-refreshes the access token from
 * AsyncStorage before it expires — see lib/auth/tokenStore.ts.
 */
export function configureApiClients(): void {
  UserAPI.BASE = ENV.API_ENDPOINTS.API_GATEWAY;
  UserAPI.WITH_CREDENTIALS = false;
  UserAPI.CREDENTIALS = 'include';
  // Installs resolveAccessToken() as the TOKEN resolver on all three clients.
  installUserApiTokenResolver();

  RouteAPI.BASE = ENV.API_ENDPOINTS.ROUTE_SERVICE;
  RouteAPI.WITH_CREDENTIALS = false;
  RouteAPI.CREDENTIALS = 'include';

  TicketingAPI.BASE = ENV.API_ENDPOINTS.TICKETING_SERVICE;
  TicketingAPI.WITH_CREDENTIALS = false;
  TicketingAPI.CREDENTIALS = 'include';
}

/**
 * No-op kept for the sign-out flow: all three clients share the
 * resolveAccessToken() resolver, which returns '' once the stored session is
 * cleared via tokenStore.clearSession() — nothing to null out here.
 */
export function clearAuthTokens(): void {}
