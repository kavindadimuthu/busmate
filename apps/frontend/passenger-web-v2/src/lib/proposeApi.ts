import { useQuery } from "@tanstack/react-query";
import { ApiError, PassengerQueryService, ScheduleManagementService } from "@busmate/api-client-core";

const noRetryOn4xx = (count: number, error: unknown) => count < 1 && !(error instanceof ApiError && error.status < 500);

/** Stops matching what was typed, for finding the one to correct. */
export function useStopSearch(text: string) {
  const t = text.trim();
  return useQuery({
    queryKey: ["stop-search", t],
    enabled: t.length >= 2,
    staleTime: 60_000,
    retry: noRetryOn4xx,
    queryFn: () => PassengerQueryService.searchStops(undefined, undefined, t, undefined, 0, 8),
  });
}

/** The departure a "who runs this bus?" proposal is about, so a contributor can see which one they are describing. */
export function useSchedule(scheduleId: string | null) {
  return useQuery({
    queryKey: ["schedule", scheduleId],
    enabled: !!scheduleId,
    staleTime: 5 * 60_000,
    retry: noRetryOn4xx,
    queryFn: () => ScheduleManagementService.getScheduleById(scheduleId!),
  });
}
