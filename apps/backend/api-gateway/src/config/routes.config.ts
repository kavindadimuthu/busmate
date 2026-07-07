export interface RouteConfig {
  pathPrefix: string;
  target: string;
  requiresAuth: boolean;
}

// Routes are evaluated in order — first match wins
export const routes: RouteConfig[] = [
  // Public auth routes
  { pathPrefix: '/api/auth/login', target: 'USER_MANAGEMENT', requiresAuth: false },
  { pathPrefix: '/api/auth/register', target: 'USER_MANAGEMENT', requiresAuth: false },
  { pathPrefix: '/api/auth/refresh', target: 'USER_MANAGEMENT', requiresAuth: false },
  { pathPrefix: '/api/auth/forgot-password', target: 'USER_MANAGEMENT', requiresAuth: false },
  { pathPrefix: '/api/auth/reset-password', target: 'USER_MANAGEMENT', requiresAuth: false },
  { pathPrefix: '/api/auth/verify-email', target: 'USER_MANAGEMENT', requiresAuth: false },
  // Protected auth routes
  { pathPrefix: '/api/auth', target: 'USER_MANAGEMENT', requiresAuth: true },
  // User management
  { pathPrefix: '/api/users', target: 'USER_MANAGEMENT', requiresAuth: true },
  { pathPrefix: '/api/user-types', target: 'USER_MANAGEMENT', requiresAuth: true },
  { pathPrefix: '/api/permissions', target: 'USER_MANAGEMENT', requiresAuth: true },
  // Ticketing
  { pathPrefix: '/api/tickets', target: 'TICKETING', requiresAuth: true },
];
