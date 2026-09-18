export interface RouteConfig {
  pathPrefix: string;
  target: string;
  requiresAuth: boolean;
  /** Methods exempt from requiresAuth on this prefix (e.g. public reads, protected writes). Only
   * meaningful when requiresAuth is true; core-service still enforces its own auth on every other
   * method regardless (INC-014). */
  publicMethods?: string[];
}

// Routes are evaluated in order — first match wins
export const routes: RouteConfig[] = [
  // JWKS document (auth migration Phase 2b) — lets the management portal (which only knows this
  // gateway's URL, never user-service's) fetch the RSA public key to verify access tokens itself.
  { pathPrefix: '/public/jwks.json', target: 'USER_SERVICE', requiresAuth: false },
  // Public auth routes
  { pathPrefix: '/api/auth/login', target: 'USER_SERVICE', requiresAuth: false },
  { pathPrefix: '/api/auth/register', target: 'USER_SERVICE', requiresAuth: false },
  { pathPrefix: '/api/auth/refresh', target: 'USER_SERVICE', requiresAuth: false },
  { pathPrefix: '/api/auth/forgot-password', target: 'USER_SERVICE', requiresAuth: false },
  { pathPrefix: '/api/auth/reset-password', target: 'USER_SERVICE', requiresAuth: false },
  { pathPrefix: '/api/auth/verify-email', target: 'USER_SERVICE', requiresAuth: false },
  // Protected auth routes
  { pathPrefix: '/api/auth', target: 'USER_SERVICE', requiresAuth: true },
  // User management
  { pathPrefix: '/api/users', target: 'USER_SERVICE', requiresAuth: true },
  { pathPrefix: '/api/user-types', target: 'USER_SERVICE', requiresAuth: true },
  { pathPrefix: '/api/permissions', target: 'USER_SERVICE', requiresAuth: true },
  // Public core-service routes used by passenger-facing search flows and service checks
  { pathPrefix: '/api/passenger', target: 'CORE_SERVICE', requiresAuth: false },
  { pathPrefix: '/api/health', target: 'CORE_SERVICE', requiresAuth: false },
  // Protected core-service route/schedule/fleet/licensing/operations routes
  { pathPrefix: '/api/bus-permit-assignments', target: 'CORE_SERVICE', requiresAuth: true },
  { pathPrefix: '/api/permits', target: 'CORE_SERVICE', requiresAuth: true },
  { pathPrefix: '/api/dashboard', target: 'CORE_SERVICE', requiresAuth: true },
  { pathPrefix: '/api/operators', target: 'CORE_SERVICE', requiresAuth: true },
  { pathPrefix: '/api/trips', target: 'CORE_SERVICE', requiresAuth: true },
  { pathPrefix: '/api/schedules', target: 'CORE_SERVICE', requiresAuth: true },
  { pathPrefix: '/api/buses', target: 'CORE_SERVICE', requiresAuth: true },
  { pathPrefix: '/api/v1/bus-operator', target: 'CORE_SERVICE', requiresAuth: true },
  { pathPrefix: '/api/v1/conductor', target: 'CORE_SERVICE', requiresAuth: true },
  // Reads are public (core-service's own SecurityConfig already permits GET /api/** anonymously;
  // this just stops the gateway being stricter than the service it fronts). Writes still require a
  // token, and core-service's @PreAuthorize(ADMIN/MOT) still gates them independently (INC-014).
  { pathPrefix: '/api/stops', target: 'CORE_SERVICE', requiresAuth: true, publicMethods: ['GET'] },
  { pathPrefix: '/api/routes', target: 'CORE_SERVICE', requiresAuth: true, publicMethods: ['GET'] },
  // Telemetry / IoT device registry (IoT Platform Layer plan, Phase 1) — staff-only admin API;
  // the service itself enforces ADMIN/MOT roles from the forwarded x-user-type header.
  { pathPrefix: '/api/devices', target: 'TELEMETRY', requiresAuth: true },
  { pathPrefix: '/api/device-types', target: 'TELEMETRY', requiresAuth: true },
  // Device telemetry ingestion (IoT Platform Layer plan, Phase 2) — NOT staff auth. A device
  // authenticates with its own bearer token, checked by telemetry-service itself
  // (DeviceTokenAuthenticationFilter), so this route must skip the gateway's JWT authMiddleware
  // (which expects a user-service-issued token) and forward the Authorization header as-is.
  { pathPrefix: '/ingest', target: 'TELEMETRY', requiresAuth: false },
  // Ticketing
  { pathPrefix: '/api/tickets', target: 'TICKETING', requiresAuth: true },
  { pathPrefix: '/api/v1/tickets', target: 'TICKETING', requiresAuth: true },
  { pathPrefix: '/api/v1/routeFare', target: 'TICKETING', requiresAuth: true },
  { pathPrefix: '/api/v1/baseFare', target: 'TICKETING', requiresAuth: true },
  // PayHere (INC-008, conductor-collected card payments). notify is PayHere's own server
  // calling us directly - it cannot present a BusMate JWT, so it must come before (and thus
  // win over) the broader authenticated /hash prefix, exactly like /api/auth/login above.
  // Its own md5sig is the authentication (verified in PayHereController).
  { pathPrefix: '/api/v1/payments/payhere/notify', target: 'TICKETING', requiresAuth: false },
  { pathPrefix: '/api/v1/payments/payhere/hash', target: 'TICKETING', requiresAuth: true },
];
