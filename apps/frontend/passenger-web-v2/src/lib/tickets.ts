// Pure ticket logic, no React: grouping a passenger's tickets by trip, sorting them into upcoming and past,
// wording each status, and the QR payload the conductor's scanner reads. Erasable TypeScript only so
// `node --test` can run it.

export interface TicketLike {
  ticketId?: number;
  tripId?: string;
  startLocationId?: string;
  endLocationId?: string;
  seatNumber?: string;
  bookingStatus?: string;
  issuedAt?: string;
}

/** One trip between two stops, and the passenger's seats on it. A booking of several seats is one ticket per seat. */
export interface TicketGroup<T extends TicketLike = TicketLike> {
  key: string;
  tripId: string;
  startLocationId: string;
  endLocationId: string;
  tickets: T[];
}

const bySeat = (a: TicketLike, b: TicketLike) => (a.seatNumber ?? "").localeCompare(b.seatNumber ?? "", undefined, { numeric: true });

/** Tickets for the same trip and stops belong together on screen. Tickets with no trip stay on their own. */
export function groupTickets<T extends TicketLike>(tickets: readonly T[]): TicketGroup<T>[] {
  const groups = new Map<string, TicketGroup<T>>();
  for (const t of tickets) {
    const key = t.tripId ? `${t.tripId}|${t.startLocationId ?? ""}|${t.endLocationId ?? ""}` : `ticket-${t.ticketId}`;
    const g = groups.get(key) ?? { key, tripId: t.tripId ?? "", startLocationId: t.startLocationId ?? "", endLocationId: t.endLocationId ?? "", tickets: [] };
    g.tickets.push(t);
    groups.set(key, g);
  }
  return [...groups.values()].map((g) => ({ ...g, tickets: [...g.tickets].sort(bySeat) }));
}

export type TicketTone = "good" | "info" | "warn" | "bad" | "quiet";
export interface StatusInfo {
  label: string;
  tone: TicketTone;
  /** What it means for the passenger, in one sentence. */
  meaning: string;
  /** Still a live booking: the seat is theirs, or held for them. */
  active: boolean;
}

/** BusMate's own booking status, worded for a passenger. Unknown statuses are shown as they are, never guessed at. */
export function statusInfo(status: string | undefined): StatusInfo {
  switch (status) {
    case "CONFIRMED":
      return { label: "Confirmed", tone: "good", meaning: "Your seat is booked. Show the QR code to the conductor when you board.", active: true };
    case "BOARDED":
      return { label: "Boarded", tone: "info", meaning: "You've boarded this bus.", active: true };
    case "PENDING_PAYMENT":
      return { label: "Awaiting payment", tone: "warn", meaning: "This seat is held for you for a short time. If the booking isn't completed it is released and you'll need to book again.", active: true };
    case "PAYMENT_FAILED":
      return { label: "Payment failed", tone: "bad", meaning: "The payment didn't go through. The seat will be released.", active: false };
    case "CANCELLED":
      return { label: "Cancelled", tone: "quiet", meaning: "This booking was cancelled and the seat released.", active: false };
    default:
      return { label: status ? status : "Unknown", tone: "quiet", meaning: "", active: false };
  }
}

/** A passenger may withdraw a booking that isn't complete. A confirmed one is not theirs to cancel here: it
 * needs the operator, because BusMate doesn't handle refunds. */
export function canCancel(status: string | undefined): boolean {
  return status === "PENDING_PAYMENT" || status === "PAYMENT_FAILED";
}

export type Section = "upcoming" | "past";

/** Upcoming while any seat is still live and the day hasn't passed; otherwise past. A trip whose date isn't known
 * yet stays upcoming, so a ticket is never hidden away because a lookup was slow. */
export function sectionOf(group: TicketGroup, trip: { tripDate?: string; status?: string } | undefined, today: string): Section {
  const live = group.tickets.some((t) => statusInfo(t.bookingStatus).active);
  if (!live) return "past";
  const status = trip?.status?.toLowerCase();
  if (status === "cancelled" || status === "completed") return "past";
  if (trip?.tripDate && trip.tripDate < today) return "past";
  return "upcoming";
}

/** Soonest first for upcoming, most recent first for past. Groups with no date sort last within their section. */
export function sortGroups<G extends TicketGroup>(groups: readonly G[], dateOf: (g: G) => string | undefined, section: Section): G[] {
  const dir = section === "upcoming" ? 1 : -1;
  return [...groups].sort((a, b) => {
    const da = dateOf(a);
    const db = dateOf(b);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da < db ? -dir : da > db ? dir : 0;
  });
}

export interface QrInput {
  ticketId?: number;
  passengerName?: string;
  startStation?: string;
  endStation?: string;
  seatNumber?: string;
  passengerCount?: number;
  fareAmount?: number;
  bookingStatus?: string;
  tripDate?: string;
  departureTime?: string;
  busPlateNumber?: string;
}

/** What the conductor's scanner reads. The same keys passenger-web writes, so a v2 ticket scans like any other.
 * Only what the server already vouches for goes in: the scanner checks the ticket number against the backend. */
export function qrPayload(i: QrInput): string {
  return JSON.stringify({
    ticketId: i.ticketId,
    passengerName: i.passengerName ?? "Passenger",
    startStation: i.startStation,
    endStation: i.endStation,
    seatNumber: i.seatNumber,
    passengerCount: i.passengerCount ?? 1,
    ticketFee: i.fareAmount,
    paymentStatus: i.bookingStatus,
    tripDate: i.tripDate,
    departureTime: i.departureTime,
    busPlateNumber: i.busPlateNumber,
  });
}

/** Whether the boarding QR is worth showing: only for a ticket that is booked, or already used. */
export function showsQr(status: string | undefined): boolean {
  return status === "CONFIRMED" || status === "BOARDED";
}
