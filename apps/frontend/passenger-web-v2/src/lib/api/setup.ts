import { OpenAPI as RouteAPI } from '@busmate/api-client-core';
import { OpenAPI as TicketingAPI } from '@busmate/api-client-ticketing';
import { OpenAPI as UserAPI } from '@busmate/api-client-user';
import { installApiTokenResolver } from '@/lib/auth/tokenStore';

/** Same wiring as passenger-web's lib/api/setup.ts: all three clients point at the gateway, never a
 * backend service directly, and each request carries the signed-in passenger's token. */
export function configureApiClients() {
  const gatewayBaseUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';

  RouteAPI.BASE = import.meta.env.VITE_ROUTE_MANAGEMENT_API_URL || gatewayBaseUrl;
  TicketingAPI.BASE = import.meta.env.VITE_TICKETING_API_URL || gatewayBaseUrl;
  UserAPI.BASE = gatewayBaseUrl;
  installApiTokenResolver();
}
