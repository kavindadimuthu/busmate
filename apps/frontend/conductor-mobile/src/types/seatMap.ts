// Real bus seat layout as returned by core-service (BusResponse.seatLayout) and the merged
// per-seat occupancy the conductor app renders. Layout = static (core-service); occupancy =
// dynamic tickets (ticketing-service); merged client-side.

export interface SeatLayoutRow {
  left?: string[];
  right?: string[];
  /** Back row spanning the full width (e.g. a 5-across rear bench). */
  back?: string[];
}

export interface SeatLayout {
  layoutName?: string;
  rows: SeatLayoutRow[];
  blockedSeats?: string[];
}

export interface BusInfo {
  id: string;
  capacity: number;
  plateNumber?: string;
  model?: string;
  seatLayout?: SeatLayout;
}

export type SeatStatus = 'available' | 'booked' | 'validated' | 'blocked';

/** A seat position merged with its booking (if any). */
export interface SeatCell {
  seatNumber: string;
  status: SeatStatus;
  ticketId?: string;
  passengerId?: string | null;
  issueMethod?: 'CONDUCTOR' | 'ONLINE' | string | null;
  validationStatus?: 'VALID' | 'NOT_VALID' | string | null;
  fareAmount?: number;
  startLocationId?: string;
  endLocationId?: string;
}

export interface SeatMapStats {
  total: number;
  available: number;
  booked: number;
  validated: number;
  blocked: number;
  online: number;
  cash: number;
}
