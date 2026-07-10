// Route guard shared by both portals. Renders nested routes (via <Outlet/>)
// only for an authenticated user whose role belongs to THIS portal. While the
// initial /me bootstrap is in flight it shows a fallback; unauthenticated users
// are redirected to /login; a valid staff account that belongs to the *other*
// portal is sent to a not-authorized screen rather than silently blanked.
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { isRoleAllowedForPortal } from './roles';

interface ProtectedRouteProps {
  portal: 'government' | 'operator';
  loadingFallback?: ReactNode;
}

export function ProtectedRoute({ portal, loadingFallback }: ProtectedRouteProps) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <>{loadingFallback ?? <div style={{ padding: 24 }}>Loading…</div>}</>;
  }

  if (status === 'unauthenticated' || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isRoleAllowedForPortal(user.userType, portal)) {
    return <Navigate to="/not-authorized" replace />;
  }

  return <Outlet />;
}
