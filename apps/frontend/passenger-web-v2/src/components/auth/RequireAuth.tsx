import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";
import type { AuthRouteState } from "@/lib/auth/redirect";

/** Pages only a signed-in passenger can use. A signed-out visitor is sent to log in and brought straight back. */
export default function RequireAuth({ children, notice }: { children: ReactNode; notice?: string }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { pathname, search } = useLocation();

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading" className="grid min-h-screen place-items-center">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
      </div>
    );
  }
  if (!isAuthenticated) {
    const state: AuthRouteState = { from: `${pathname}${search}`, notice };
    return <Navigate to="/login" replace state={state} />;
  }
  return <>{children}</>;
}
