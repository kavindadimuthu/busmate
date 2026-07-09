export interface RouteConfig {
  pathPrefix: string;
  target: string;
  requiresAuth: boolean;
}

// Routes are evaluated in order — first match wins
export const routes: RouteConfig[] = [
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
  { pathPrefix: '/api/stops', target: 'CORE_SERVICE', requiresAuth: true },
  { pathPrefix: '/api/routes', target: 'CORE_SERVICE', requiresAuth: true },
  // Ticketing
  { pathPrefix: '/api/tickets', target: 'TICKETING', requiresAuth: true },
  { pathPrefix: '/api/v1/tickets', target: 'TICKETING', requiresAuth: true },
  { pathPrefix: '/api/v1/routeFare', target: 'TICKETING', requiresAuth: true },
  { pathPrefix: '/api/v1/baseFare', target: 'TICKETING', requiresAuth: true },
];
