import ENV from '../../config/env';
import { OpenAPI as UserOpenAPI } from './user-management/core/OpenAPI';
import { OpenAPI as RouteOpenAPI } from './route-management/core/OpenAPI';
import { OpenAPI as TicketingOpenAPI } from './ticketing-management/core/OpenAPI';

/**
 * Initialize all API clients with proper base URLs
 * Call this function at app startup
 */
export const initializeApiClients = () => {
  // Configure User Management API
  UserOpenAPI.BASE = ENV.API_ENDPOINTS.USER_SERVICE;
  UserOpenAPI.TIMEOUT = ENV.API_TIMEOUT;
  UserOpenAPI.WITH_CREDENTIALS = false;
  UserOpenAPI.CREDENTIALS = 'include';
  
  // Configure Route Management API  
  RouteOpenAPI.BASE = ENV.API_ENDPOINTS.ROUTE_SERVICE;
  RouteOpenAPI.WITH_CREDENTIALS = false;
  RouteOpenAPI.CREDENTIALS = 'include';
  
  // Configure Ticketing API
  TicketingOpenAPI.BASE = ENV.API_ENDPOINTS.TICKETING_SERVICE;
  TicketingOpenAPI.WITH_CREDENTIALS = false;
  TicketingOpenAPI.CREDENTIALS = 'include';
  
  console.log('API Clients initialized with endpoints:', {
    userService: UserOpenAPI.BASE,
    routeService: RouteOpenAPI.BASE,
    ticketingService: TicketingOpenAPI.BASE,
  });
};

/**
 * Set authorization token for all API clients
 */
export const setAuthToken = (token: string) => {
  const authHeader = `Bearer ${token}`;
  
  UserOpenAPI.TOKEN = authHeader;
  RouteOpenAPI.TOKEN = authHeader;
  TicketingOpenAPI.TOKEN = authHeader;
};

/**
 * Clear authorization tokens from all API clients
 */
export const clearAuthTokens = () => {
  UserOpenAPI.TOKEN = undefined;
  RouteOpenAPI.TOKEN = undefined;
  TicketingOpenAPI.TOKEN = undefined;
};

export { UserOpenAPI, RouteOpenAPI, TicketingOpenAPI };
