import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiError as CoreApiError, BusManagementService } from "@busmate/api-client-core";
import { ApiError as TicketingApiError, TicketControllerService } from "@busmate/api-client-ticketing";
import { layoutSeats, resolveLayout } from "./seatMap.ts";

const noRetryOn4xx = (count: number, error: unknown) => {
  const status = error instanceof CoreApiError || error instanceof TicketingApiError ? error.status : 0;
  return count < 1 && !(status >= 400 && status < 500);
};

/** The bus's seat layout: rarely changes, so it is cached for a while. */
export function useBus(busId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["bus", busId],
    enabled,
    staleTime: 5 * 60_000,
    retry: noRetryOn4xx,
    queryFn: () => BusManagementService.getBusById(busId),
  });
}

/** Seats already taken on this trip. Refreshed while the passenger is choosing, since others are booking too. */
export function useOccupiedSeats(tripId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["occupied-seats", tripId],
    enabled,
    // Never show a remembered seat map: coming back to choose again must show what is taken now.
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 20_000,
    retry: noRetryOn4xx,
    queryFn: () => TicketControllerService.getOccupiedSeats(tripId),
  });
}

/** Whether online booking is open (INC-072). `undefined` until known, and when the answer can't be had: a page then
 * behaves as before and lets the server, which enforces the switch itself, have the final word. */
export function useOnlineBookingOpen(): boolean | undefined {
  const q = useQuery({
    queryKey: ["online-booking-open"],
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: true,
    queryFn: () => TicketControllerService.getBookingStatus(),
  });
  return q.data?.onlineBookingOpen;
}

/** Everything the seat map needs, or why it can't be drawn. */
export function useSeatMapData(tripId: string, busId: string, enabled: boolean) {
  const bus = useBus(busId, enabled);
  const occupied = useOccupiedSeats(tripId, enabled);
  const layout = useMemo(() => (bus.data ? resolveLayout(bus.data.seatLayout, bus.data.capacity) : null), [bus.data]);
  const taken = useMemo(() => new Set((occupied.data?.occupiedSeats ?? []).map(String)), [occupied.data]);
  return {
    bus: bus.data,
    layout,
    seatCount: layout ? layoutSeats(layout).length : 0,
    taken,
    isPending: bus.isPending || occupied.isPending,
    error: bus.error ?? occupied.error,
    /** The bus record loaded but has neither a layout nor a capacity to draw one from. */
    noLayout: !!bus.data && !layout,
    refetch: () => Promise.all([bus.refetch(), occupied.refetch()]),
  };
}

/** What to tell the passenger when booking failed. The server's own reason is used when it sends one: it says
 * things like "Seat 3 is already booked" that nothing here could guess. */
export function bookingProblem(error: unknown): { message: string; signedOut: boolean } {
  if (error instanceof TicketingApiError) {
    if (error.status === 401) return { message: "Your session has ended. Log in again to book.", signedOut: true };
    const closed = error.body as { code?: unknown; message?: unknown } | null | undefined;
    if (error.status === 503 && closed?.code === "BOOKING_CLOSED") {
      return { message: typeof closed.message === "string" ? closed.message : "Online booking isn't open yet.", signedOut: false };
    }
    if (error.status === 429) return { message: "Too many attempts. Please wait a minute and try again.", signedOut: false };
    const body = error.body as { message?: unknown; error?: unknown } | null | undefined;
    const raw = body?.message ?? body?.error;
    const text = typeof raw === "string" ? raw : raw && typeof raw === "object" ? (raw as { message?: unknown }).message : undefined;
    if (typeof text === "string" && text.trim() && error.status < 500) return { message: text, signedOut: false };
    return { message: "We couldn't complete this booking. Please try again.", signedOut: false };
  }
  return { message: "We couldn't reach BusMate. Check your connection and try again.", signedOut: false };
}
