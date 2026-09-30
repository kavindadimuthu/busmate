import { useQuery } from "@tanstack/react-query";
import { CommunityContributorsService } from "@busmate/api-client-core";
import { useRouteGroups } from "@/lib/contributionsApi";
import { useAuth } from "@/lib/auth/AuthContext";

/** The signed-in passenger's contributor standing, in one call: status, whether they are an active contributor or
 * steward, whether they could apply, and their record. Keyed by who is signed in, so switching accounts in one tab
 * can't show the last person's standing. `undefined` until known and if it can't be had: callers then show only what
 * every passenger has. */
export function useStanding() {
  const { user, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["my-standing", user?.userId],
    enabled: isAuthenticated && !!user?.userId,
    staleTime: 60_000,
    retry: 1,
    queryFn: () => CommunityContributorsService.getMyContributorStanding(),
  });
}

/** Names for a steward's route groups (corridors), so "you review Colombo - Kandy" can be said in words. */
export function useCorridorNames(ids: readonly string[] | undefined) {
  const wanted = ids ?? [];
  const q = useRouteGroups(wanted.length > 0);
  const byId = new Map((q.data ?? []).map((g) => [g.id, g.name]));
  return wanted.map((id) => byId.get(id)).filter((n): n is string => !!n);
}
