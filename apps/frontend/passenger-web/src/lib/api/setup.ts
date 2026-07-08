import { OpenAPI as RouteAPI } from '@busmate/api-client-route';
import { OpenAPI as TicketingAPI } from '@busmate/api-client-ticketing';
import { OpenAPI as LocationAPI } from '@busmate/api-client-location';
import { OpenAPI as UserAPI } from '@busmate/api-client-user';
import { installUserApiTokenResolver } from '@/lib/auth/tokenStore';

export function configureApiClients() {
  const gatewayBaseUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';

  RouteAPI.BASE = import.meta.env.VITE_ROUTE_MANAGEMENT_API_URL || gatewayBaseUrl;
  TicketingAPI.BASE = import.meta.env.VITE_TICKETING_API_URL || gatewayBaseUrl;
  LocationAPI.BASE = (import.meta.env.VITE_LOCATION_TRACKING_API_URL || 'http://localhost:4000') + '/api';

  // Auth/user/profile calls are routed through the API gateway (not straight to
  // user-management) so JWT verification, CORS and rate limiting are enforced centrally.
  UserAPI.BASE = gatewayBaseUrl;
  installUserApiTokenResolver();

  // TOKEN resolvers for the other clients will be added when their auth is implemented.
  // Example:
  // const getToken = async () => sessionStorage.getItem('access_token') || '';
  // RouteAPI.TOKEN = getToken;
  // TicketingAPI.TOKEN = getToken;
  // LocationAPI.TOKEN = getToken;
}
