import ENV from './config/env';

export const userServiceUrl = ENV.API_ENDPOINTS.USER_SERVICE;
export const routeServiceUrl = ENV.API_ENDPOINTS.ROUTE_SERVICE;
export const ticketingServiceUrl = ENV.API_ENDPOINTS.TICKETING_SERVICE;
export const locationServiceUrl = ENV.API_ENDPOINTS.LOCATION_SERVICE;

export const apiKey = "your_api_key";
export const timeout = ENV.API_TIMEOUT;

export const userServiceEndpoints = {
    login: `${userServiceUrl}/api/auth/login`,
};

export const routeServiceEndpoints = {
    getRoutes: `${routeServiceUrl}/api/routes`,
    getRouteById: (id: string) => `${routeServiceUrl}/api/routes/${id}`,
};
