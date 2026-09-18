import { OpenAPI as RouteAPI } from '@busmate/api-client-core';
import { OpenAPI as TicketingAPI } from '@busmate/api-client-ticketing';
import { OpenAPI as UserAPI } from '@busmate/api-client-user';
import { installUserApiTokenResolver } from '@/lib/auth/tokenStore';

export function configureApiClients() {
  const gatewayBaseUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';

  RouteAPI.BASE = import.meta.env.VITE_ROUTE_MANAGEMENT_API_URL || gatewayBaseUrl;
  TicketingAPI.BASE = import.meta.env.VITE_TICKETING_API_URL || gatewayBaseUrl;

  // Auth/user/profile calls are routed through the API gateway (not straight to
  // user-management) so JWT verification, CORS and rate limiting are enforced centrally.
  UserAPI.BASE = gatewayBaseUrl;
  // Installs the same auto-refreshing token resolver on all three clients (INC-013) - booking
  // needs the passenger's real identity forwarded as x-user-id, which only happens with a real
  // bearer token attached.
  installUserApiTokenResolver();
}
