import { queryOptions, useQuery } from "@tanstack/react-query";
import { ApiError as CoreApiError, TripManagementService } from "@busmate/api-client-core";
import { ApiError as TicketingApiError, TicketControllerService } from "@busmate/api-client-ticketing";

const noRetryOn4xx = (count: number, error: unknown) => {
  const status = error instanceof CoreApiError || error instanceof TicketingApiError ? error.status : 0;
  return count < 1 && !(status >= 400 && status < 500);
};

/** The signed-in passenger's own tickets, one per seat. The server only ever returns their own. */
export function useMyTickets(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-tickets", userId],
    enabled: !!userId,
    staleTime: 0,
    retry: noRetryOn4xx,
    // The server answers 404 "No tickets found" for a passenger who hasn't booked yet. That is an empty list, not a failure.
    queryFn: () =>
      TicketControllerService.getTicketsByPassengerId(userId!).catch((e: unknown) => {
        if (e instanceof TicketingApiError && e.status === 404) return [];
        throw e;
      }),
  });
}

export function useTicket(id: number | null) {
  return useQuery({
    queryKey: ["ticket", id],
    enabled: id !== null,
    staleTime: 0,
    retry: noRetryOn4xx,
    queryFn: () => TicketControllerService.getTicketById(id!),
  });
}

/** The trip a ticket is for: its date, departure time, route, operator, bus and whether it has been cancelled.
 * A ticket only carries ids, so this is where the human-readable part comes from. One definition, shared by the
 * list (which needs every trip's date to sort) and each card, so they are the same query. A failed lookup is not
 * retried each time a card mounts: that would flip the list back to "loading" and unmount the cards, in a loop. */
export function tripRecordQuery(tripId: string) {
  return queryOptions({
    queryKey: ["trip-record", tripId],
    staleTime: 60_000,
    retry: noRetryOn4xx,
    retryOnMount: false,
    queryFn: () => TripManagementService.getTripById(tripId),
  });
}

export function useTripRecord(tripId: string | undefined) {
  return useQuery({ ...tripRecordQuery(tripId ?? ""), enabled: !!tripId });
}

export type TicketProblem = { title: string; body: string; retryable: boolean };

/** For an address that isn't a ticket number at all. */
export const NOT_A_TICKET: TicketProblem = { title: "We couldn't find that ticket", body: "That address isn't a ticket. Your tickets list shows every booking you've made.", retryable: false };

/** What to tell the passenger when tickets couldn't be loaded. */
export function ticketsProblem(error: unknown): TicketProblem {
  if (error instanceof TicketingApiError && (error.status === 403 || error.status === 404)) {
    return { title: "We couldn't find that ticket", body: "It may not be yours, or it may have been removed. Your tickets list shows every booking you've made.", retryable: false };
  }
  if (error instanceof TicketingApiError && error.status === 401) {
    return { title: "Please log in again", body: "Your session has ended.", retryable: false };
  }
  return { title: "We couldn't load your tickets", body: "Check your connection and try again.", retryable: true };
}
