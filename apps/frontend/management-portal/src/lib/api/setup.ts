import { OpenAPI as RouteAPI } from '@busmate/api-client-route';
import { OpenAPI as TicketingAPI } from '@busmate/api-client-ticketing';
import { OpenAPI as LocationAPI } from '@busmate/api-client-location';

RouteAPI.BASE = process.env.NEXT_PUBLIC_ROUTE_MANAGEMENT_API_URL || 'http://localhost:8080';
TicketingAPI.BASE = process.env.NEXT_PUBLIC_TICKETING_API_URL || 'http://localhost:8083';
LocationAPI.BASE = (process.env.NEXT_PUBLIC_LOCATION_TRACKING_API_URL || 'http://localhost:4000') + '/api';

// TOKEN is left undefined intentionally. Authentication is handled via
// session cookies (CREDENTIALS: 'include' in the generated request.ts).
// When a server-side token resolver is needed in the future, create a
// separate server-only setup file and import it from a server component.
