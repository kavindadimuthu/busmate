import { useQuery } from "@tanstack/react-query";
import { ApiError, CommunityContributorsService, RouteManagementService } from "@busmate/api-client-core";
import { useAuth } from "@/lib/auth/AuthContext";

const noRetryOn4xx = (count: number, error: unknown) => count < 1 && !(error instanceof ApiError && error.status < 500);

/** The contributor agreement in force: its version, whether it is still a draft, and its text. */
export function useAgreement(enabled = true) {
  return useQuery({
    queryKey: ["contributor-agreement"],
    enabled,
    staleTime: 60_000,
    retry: noRetryOn4xx,
    queryFn: () => CommunityContributorsService.getContributorAgreement(),
  });
}

/** Every corridor (route group), for choosing the ones you know. */
export function useRouteGroups(enabled = true) {
  return useQuery({
    queryKey: ["route-groups-all"],
    enabled,
    staleTime: 5 * 60_000,
    retry: 1,
    queryFn: () => RouteManagementService.getAllRouteGroupsAsList(),
  });
}

/** The signed-in contributor's own proposals, newest first. Keyed by who is signed in. */
export function useMyProposals(size: number, enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-proposals", user?.userId, size],
    enabled: enabled && !!user?.userId,
    staleTime: 0,
    retry: noRetryOn4xx,
    queryFn: () => CommunityContributorsService.listMyChangesets(undefined, 0, size),
  });
}
