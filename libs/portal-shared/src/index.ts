// Shared auth/routing layer for government-portal and operator-portal.
// Referenced by source path alias (@busmate/portal-shared) — no build step,
// matching how the apps alias libs/api-clients.
export * from './auth/roles';
export * from './auth/api';
export { AuthProvider, useAuth } from './auth/AuthContext';
export { ProtectedRoute } from './auth/ProtectedRoute';
