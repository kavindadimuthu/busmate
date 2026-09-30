import { useQuery } from "@tanstack/react-query";
import { ApiError, PassengerQueryService, type FindMyBusDetailsResponse } from "@busmate/api-client-core";
import type { DetailParams } from "./tripDetails.ts";

export function useTripDetails(p: DetailParams, enabled: boolean) {
  return useQuery({
    queryKey: ["trip-details", p.scheduleId, p.fromStopId, p.toStopId, p.tripId, p.date],
    enabled,
    staleTime: 60_000,
    // A 4xx is our request being wrong, not the network being flaky: retrying can't help.
    retry: (count, error) => count < 1 && !(error instanceof ApiError && error.status < 500),
    queryFn: () => PassengerQueryService.findMyBusDetails(p.scheduleId, p.fromStopId, p.toStopId, p.tripId || undefined, p.date, "DEFAULT"),
  });
}

export interface Problem {
  title: string;
  body: string;
  retryable: boolean;
}

/** The server reports "not found" and "stops in the wrong order" as a normal 200 with `success: false`, so a
 * response can be a success as far as HTTP goes and still have nothing on it. Returns null when it has content. */
export function responseProblem(data: FindMyBusDetailsResponse | undefined): Problem | null {
  if (!data) return null;
  if (data.success !== false && data.journeySummary && data.route) return null;
  const message = (data.message ?? "").toLowerCase();
  if (message.includes("invalid stop sequence")) {
    return {
      title: "Those stops don't fit this bus",
      body: "This bus doesn't run from your first stop to your second in that order. Search again to see the buses that do.",
      retryable: false,
    };
  }
  return {
    title: "We couldn't find this departure",
    body: "It may have been changed or removed. Search again to see today's buses.",
    retryable: false,
  };
}

/** What to tell the passenger when the request itself failed. */
export function requestProblem(error: unknown): Problem {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return { title: "That link isn't valid", body: "Go back to your search and open the bus again.", retryable: false };
  }
  return { title: "We couldn't load this bus", body: "Check your connection and try again.", retryable: true };
}
