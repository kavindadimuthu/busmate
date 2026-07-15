import ENV from './config/env';

export const routeServiceUrl = ENV.API_ENDPOINTS.ROUTE_SERVICE;
export const ticketingServiceUrl = ENV.API_ENDPOINTS.TICKETING_SERVICE;

export const apiKey = "your_api_key";
export const timeout = ENV.API_TIMEOUT;

export const routeServiceEndpoints = {
    getRoutes: `${routeServiceUrl}/api/routes`,
    getRouteById: (id: string) => `${routeServiceUrl}/api/routes/${id}`,
};
