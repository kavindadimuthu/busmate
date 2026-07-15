import { OpenAPI as UserAPI } from '@busmate/api-client-user';
import { API_GATEWAY_URL } from '@/config/apiConfig';
import { installUserApiTokenResolver } from '@/lib/auth/tokenStore';

/**
 * Configure the shared generated API clients with the gateway base URL and the
 * auto-refreshing token resolver. Call once at app startup.
 *
 * Auth/user/profile calls go through the API gateway (not straight to
 * user-service) so JWT verification, CORS and rate limiting are enforced
 * centrally.
 */
export function configureApiClients(): void {
  UserAPI.BASE = API_GATEWAY_URL;
  UserAPI.WITH_CREDENTIALS = false;
  UserAPI.CREDENTIALS = 'include';
  installUserApiTokenResolver();
}
