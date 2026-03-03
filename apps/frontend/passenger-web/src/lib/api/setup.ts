import { OpenAPI as RouteAPI } from '@busmate/api-client-route';
import { OpenAPI as UserAPI } from '@busmate/api-client-user';
import { OpenAPI as TicketingAPI } from '@busmate/api-client-ticketing';
import { OpenAPI as LocationAPI } from '@busmate/api-client-location';

export function configureApiClients() {
  RouteAPI.BASE = import.meta.env.VITE_ROUTE_MANAGEMENT_API_URL || 'http://localhost:8080';
  UserAPI.BASE = import.meta.env.VITE_USER_MANAGEMENT_API_URL || 'http://localhost:8081';
  TicketingAPI.BASE = import.meta.env.VITE_TICKETING_API_URL || 'http://localhost:8083';
  LocationAPI.BASE = (import.meta.env.VITE_LOCATION_TRACKING_API_URL || 'http://localhost:4000') + '/api';

  // TOKEN resolvers will be added when Asgardeo auth is implemented.
  // Example:
  // const getToken = async () => sessionStorage.getItem('access_token') || '';
  // RouteAPI.TOKEN = getToken;
  // UserAPI.TOKEN = getToken;
  // TicketingAPI.TOKEN = getToken;
  // LocationAPI.TOKEN = getToken;
}
