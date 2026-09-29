import { OpenAPI as RouteAPI } from '@busmate/api-client-core';
import { OpenAPI as TicketingAPI } from '@busmate/api-client-ticketing';
import { OpenAPI as UserAPI } from '@busmate/api-client-user';

/**
 * Same wiring as passenger-web's lib/api/setup.ts — all three clients point at the gateway,
 * never a backend service directly. Auth-token attachment (installUserApiTokenResolver) is
 * added once the auth screens are ported (INC-063 phase 2); this scaffold only needs
 * unauthenticated public endpoints to prove the wiring.
 */
export function configureApiClients() {
  const gatewayBaseUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';

  RouteAPI.BASE = import.meta.env.VITE_ROUTE_MANAGEMENT_API_URL || gatewayBaseUrl;
  TicketingAPI.BASE = import.meta.env.VITE_TICKETING_API_URL || gatewayBaseUrl;
  UserAPI.BASE = gatewayBaseUrl;
}
