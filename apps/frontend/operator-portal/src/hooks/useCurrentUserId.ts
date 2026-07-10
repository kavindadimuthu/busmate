import { useAuth } from '@busmate/portal-shared';

/**
 * The signed-in user's own userId. In this SPA the id already comes from the
 * AuthProvider's /me bootstrap, so we read it from context rather than decoding
 * the JWT (as management-portal did). Same public shape: string | null.
 */
export function useCurrentUserId(): string | null {
  const { user } = useAuth();
  return user?.userId ?? null;
}
