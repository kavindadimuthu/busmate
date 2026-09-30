import { useQuery } from "@tanstack/react-query";
import { ApiError, CommunityContributorsService } from "@busmate/api-client-core";
import { useAuth } from "@/lib/auth/AuthContext";

const noRetryOn4xx = (count: number, error: unknown) => count < 1 && !(error instanceof ApiError && error.status < 500);

export type QueueStatus = "PENDING" | "APPROVED" | "REJECTED";
export type QueueKind = "STOP" | "SCHEDULE_WORKING" | undefined;

/** The proposals in this steward's corridors, oldest first. core-service leaves out their own and hides who proposed. */
export function useReviewQueue(status: QueueStatus, kind: QueueKind, size: number, enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["review-queue", user?.userId, status, kind, size],
    enabled: enabled && !!user?.userId,
    staleTime: 0,
    retry: noRetryOn4xx,
    queryFn: () => CommunityContributorsService.listChangesetsForReview(kind, status, undefined, undefined, 0, size),
  });
}

/** One proposal with what it targets, the distance, and the proposer's record. */
export function useReviewItem(id: string | undefined, enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["review-item", user?.userId, id],
    enabled: enabled && !!id && !!user?.userId,
    staleTime: 0,
    retry: noRetryOn4xx,
    queryFn: () => CommunityContributorsService.getChangesetForReview(id!),
  });
}
