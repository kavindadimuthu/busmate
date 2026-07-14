import { API_GATEWAY_URL } from '@/config/apiConfig';
import { OpenAPI as UserOpenAPI } from './user-management/core/OpenAPI';
import { installUserApiTokenResolver } from '../auth/tokenStore';

/**
 * Initialize the user-service API client with the gateway base URL and
 * the auto-refreshing token resolver. Call this once at app startup.
 */
export const initializeApiClients = () => {
  UserOpenAPI.BASE = API_GATEWAY_URL;
  UserOpenAPI.WITH_CREDENTIALS = false;
  UserOpenAPI.CREDENTIALS = 'include';
  installUserApiTokenResolver();

  console.log('User API client initialized with gateway endpoint:', UserOpenAPI.BASE);
};

export { UserOpenAPI };
