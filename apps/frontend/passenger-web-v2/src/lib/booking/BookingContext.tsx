import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * A booking in progress, carried between the /booking/* pages. Kept in sessionStorage as well as memory so a
 * refresh on the review or payment step doesn't lose a booking that already holds seats. It is per tab and gone
 * when the tab closes. A restored seat choice is never trusted: the server re-checks every seat when it books.
 */
export interface BookingTrip {
  tripId: string;
  busId: string;
  busPlateNumber?: string;
  fromStopId: string;
  toStopId: string;
  fromStopName: string;
  toStopName: string;
  routeName?: string;
  operatorName?: string;
  tripDate?: string;
  departureTime?: string;
  /** Trust label key of the departure time, so a time never appears here without how far to trust it. */
  departureTrust?: string;
  arrivalTime?: string;
}

export interface BookingResult {
  ticketIds: number[];
  farePerSeat: number;
  fareAmount: number;
  paymentReference: string;
  /** Present only when a hosted checkout is switched on (ADR-014). */
  redirectUrl?: string;
  checkoutFields?: Record<string, string>;
}

interface State {
  trip: BookingTrip | null;
  seats: string[];
  result: BookingResult | null;
}

const EMPTY: State = { trip: null, seats: [], result: null };
const KEY = "busmate.v2.booking";

function load(): State {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<State>;
    return { trip: p.trip ?? null, seats: Array.isArray(p.seats) ? p.seats : [], result: p.result ?? null };
  } catch {
    return EMPTY;
  }
}

function save(s: State) {
  try {
    if (!s.trip && !s.result) sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode or blocked storage: the booking still works, it just won't survive a refresh */
  }
}

interface BookingContextValue {
  trip: BookingTrip | null;
  seats: string[];
  result: BookingResult | null;
  /** Start (or restart) a booking for a trip with these seats. Any earlier booking result is dropped. */
  start: (trip: BookingTrip, seats: string[]) => void;
  setResult: (result: BookingResult | null) => void;
  clear: () => void;
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load);

  const update = useCallback((next: State) => {
    save(next);
    setState(next);
  }, []);

  const value = useMemo<BookingContextValue>(
    () => ({
      ...state,
      start: (trip, seats) => update({ trip, seats, result: null }),
      setResult: (result) => update({ ...state, result }),
      clear: () => update(EMPTY),
    }),
    [state, update],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within a BookingProvider");
  return ctx;
}
