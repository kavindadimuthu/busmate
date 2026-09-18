import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * Carries a booking in progress between /booking/* pages (INC-013). Session-only, mirrors
 * passenger-mobile's proven BookingContext shape: flat, real-data fields populated from the
 * FindMyBusDetailPage response, not a fictional nested trip/bus pair.
 *
 * A page refresh loses this on purpose - a seat selection is a live decision about a live seat
 * map, and re-fetching on refresh (starting the flow over from the trip's booking button) is
 * safer than resurrecting a stale one.
 */
export interface BookingTripContext {
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
  arrivalTime?: string;
}

export interface BookingResult {
  ticketIds: number[];
  farePerSeat: number;
  fareAmount: number;
  paymentReference: string;
  /** Present only once PayHere is enabled (ADR-014); null means the booking is already paid
   * (dummy gateway) or awaiting a client-side confirm step. */
  redirectUrl?: string;
  checkoutFields?: Record<string, string>;
}

interface BookingContextValue {
  trip: BookingTripContext | null;
  setTrip: (trip: BookingTripContext) => void;
  selectedSeats: string[];
  setSelectedSeats: (seats: string[]) => void;
  bookingResult: BookingResult | null;
  setBookingResult: (result: BookingResult | null) => void;
  clear: () => void;
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [trip, setTrip] = useState<BookingTripContext | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  const clear = () => {
    setTrip(null);
    setSelectedSeats([]);
    setBookingResult(null);
  };

  return (
    <BookingContext.Provider
      value={{ trip, setTrip, selectedSeats, setSelectedSeats, bookingResult, setBookingResult, clear }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return ctx;
}
