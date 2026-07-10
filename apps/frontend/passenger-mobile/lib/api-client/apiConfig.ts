import ENV from '../../config/env';
import { OpenAPI as UserOpenAPI } from './user-management/core/OpenAPI';
import { OpenAPI as RouteOpenAPI } from './route-management/core/OpenAPI';
import { OpenAPI as TicketingOpenAPI } from './ticketing-management/core/OpenAPI';
import { installUserApiTokenResolver } from '../auth/tokenStore';

/**
 * Initialize all API clients with proper base URLs
 * Call this function at app startup
 */
export const initializeApiClients = () => {
  // Auth/user/profile calls are routed through the API gateway (not straight
  // to user-service) so JWT verification, CORS and rate limiting are
  // enforced centrally. The token resolver auto-refreshes the access token
  // from AsyncStorage before it expires — see lib/auth/tokenStore.ts.
  UserOpenAPI.BASE = ENV.API_ENDPOINTS.API_GATEWAY;
  UserOpenAPI.WITH_CREDENTIALS = false;
  UserOpenAPI.CREDENTIALS = 'include';
  installUserApiTokenResolver();

  // Configure Route Management API (token resolver installed above, shared with UserOpenAPI)
  RouteOpenAPI.BASE = ENV.API_ENDPOINTS.ROUTE_SERVICE;
  RouteOpenAPI.WITH_CREDENTIALS = false;
  RouteOpenAPI.CREDENTIALS = 'include';

  // Configure Ticketing API (token resolver installed above, shared with UserOpenAPI)
  TicketingOpenAPI.BASE = ENV.API_ENDPOINTS.TICKETING_SERVICE;
  TicketingOpenAPI.WITH_CREDENTIALS = false;
  TicketingOpenAPI.CREDENTIALS = 'include';

  console.log('API Clients initialized with endpoints:', {
    apiGateway: UserOpenAPI.BASE,
    routeService: RouteOpenAPI.BASE,
    ticketingService: TicketingOpenAPI.BASE,
  });
};

/**
 * No-op: all three clients' TOKEN is the resolveAccessToken() resolver installed by
 * installUserApiTokenResolver(), which naturally returns '' once the stored session is
 * cleared via tokenStore.clearSession() - nothing to null out here. Kept as a named export
 * (called from the sign-out flow) so callers don't need to change.
 */
export const clearAuthTokens = () => {};

export { UserOpenAPI, RouteOpenAPI, TicketingOpenAPI };
