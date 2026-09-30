import { useQuery } from "@tanstack/react-query";
import { ApiError, PassengerQueryService } from "@busmate/api-client-core";
import type { StopCandidate } from "./findMyBus";

/** One request per search (stops and date): sorting and filtering happen in the browser. */
export function useFindMyBus(fromStopId: string, toStopId: string, date: string, enabled: boolean) {
  return useQuery({
    queryKey: ["find-my-bus", fromStopId, toStopId, date],
    enabled,
    staleTime: 60_000,
    // A 4xx is our request being wrong, not the network being flaky: retrying can't help.
    retry: (count, error) => count < 1 && !(error instanceof ApiError && error.status < 500),
    queryFn: () => PassengerQueryService.findMyBus(fromStopId, toStopId, date),
  });
}

/** Stops matching what the passenger typed, for names that weren't picked from the suggestion list. */
export function useStopCandidates(text: string, enabled: boolean) {
  return useQuery({
    queryKey: ["stop-candidates", text.trim().toLowerCase()],
    enabled: enabled && text.trim().length >= 2,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<StopCandidate[]> => {
      const res = await PassengerQueryService.searchStops(undefined, undefined, text.trim(), undefined, 0, 8);
      return (res.content ?? [])
        .filter((s) => s.stopId && s.name)
        .map((s) => ({ id: s.stopId!, name: s.name!, city: s.city ?? "" }));
    },
  });
}

/** What to tell the passenger when the search itself failed. */
export function searchFailure(error: unknown): { title: string; body: string; retryable: boolean } {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return {
      title: "That search link isn't valid",
      body: "Choose your stops again and we'll find your buses.",
      retryable: false,
    };
  }
  return {
    title: "We couldn't load the buses",
    body: "Check your connection and try again.",
    retryable: true,
  };
}
