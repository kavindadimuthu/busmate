// Pure logic behind the trip details page (INC-067). No React; `node --test` runs it directly.
import { parseTimeOfDay, isIsoDate, isStopId } from "./findMyBus.ts";

// ---------- Query ----------

export interface DetailParams {
  scheduleId: string;
  fromStopId: string;
  toStopId: string;
  tripId: string;
  date: string;
}

/** Reads `/findmybus/detail?scheduleId=&fromStopId=&toStopId=[&tripId=&date=]` (the contract from
 * lib/findMyBus.ts detailPath). A missing or invalid date becomes `today`. */
export function readDetailParams(search: string, today: string): DetailParams {
  const q = new URLSearchParams(search);
  const date = q.get("date");
  return {
    scheduleId: q.get("scheduleId") ?? "",
    fromStopId: q.get("fromStopId") ?? "",
    toStopId: q.get("toStopId") ?? "",
    tripId: q.get("tripId") ?? "",
    date: isIsoDate(date) ? date : today,
  };
}

/** Whether the link has what the details request needs: a schedule and two real stops. */
export function hasRequiredParams(p: DetailParams): boolean {
  return !!p.scheduleId && isStopId(p.fromStopId) && isStopId(p.toStopId);
}

// ---------- Stops ----------

export interface StopLike {
  stopOrder?: number;
  isOrigin?: boolean;
  isDestination?: boolean;
  stop?: { id?: string; name?: string };
  resolvedArrivalTime?: string;
  resolvedDepartureTime?: string;
  distanceFromStartKm?: number;
  distanceFromStartKmVerified?: number;
  distanceFromStartKmUnverified?: number;
  distanceFromStartKmCalculated?: number;
}

export type StopRole = "origin" | "destination" | "between" | "outside";

export interface StopRow<T extends StopLike> {
  stop: T;
  role: StopRole;
  arrive: number | null;
  depart: number | null;
  /** The time to show for the stop: when the bus leaves, else when it arrives. */
  main: number | null;
  /** How long the bus waits here, when both times are known and differ. */
  haltMinutes: number | null;
  km: number | null;
}

const firstNumber = (...values: (number | undefined | null)[]): number | null => {
  for (const v of values) if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
};

/** The route's stops in order, each marked as the passenger's boarding stop, alighting stop, a stop between
 * them, or outside their journey. Boarding and alighting come from the flags the server sets, falling back to
 * the journey summary's stop orders, then to the stop ids from the link. */
export function stopRows<T extends StopLike>(
  stops: T[] | undefined,
  hint: { originOrder?: number; destinationOrder?: number; fromStopId?: string; toStopId?: string } = {},
): StopRow<T>[] {
  const sorted = [...(stops ?? [])].sort((a, b) => (a.stopOrder ?? 0) - (b.stopOrder ?? 0));
  const flagged = (pick: (s: T) => boolean | undefined) => sorted.find((s) => pick(s))?.stopOrder;
  const originOrder =
    flagged((s) => s.isOrigin) ?? hint.originOrder ?? sorted.find((s) => hint.fromStopId && s.stop?.id === hint.fromStopId)?.stopOrder;
  const destOrder =
    flagged((s) => s.isDestination) ?? hint.destinationOrder ?? sorted.find((s) => hint.toStopId && s.stop?.id === hint.toStopId)?.stopOrder;

  return sorted.map((s) => {
    const order = s.stopOrder ?? 0;
    let role: StopRole = "between";
    if (originOrder == null || destOrder == null) role = "between";
    else if (order === originOrder) role = "origin";
    else if (order === destOrder) role = "destination";
    else if (order < originOrder || order > destOrder) role = "outside";

    const arrive = parseTimeOfDay(s.resolvedArrivalTime);
    const depart = parseTimeOfDay(s.resolvedDepartureTime);
    const halt = arrive != null && depart != null && depart > arrive ? depart - arrive : null;
    return {
      stop: s,
      role,
      arrive,
      depart,
      main: depart ?? arrive,
      haltMinutes: halt,
      km: firstNumber(s.distanceFromStartKm, s.distanceFromStartKmVerified, s.distanceFromStartKmUnverified, s.distanceFromStartKmCalculated),
    };
  });
}

/** Just the passenger's own journey by default; the whole route when asked (or when nothing marks a journey). */
export function visibleRows<T extends StopLike>(rows: StopRow<T>[], showAll: boolean): StopRow<T>[] {
  if (showAll) return rows;
  const mine = rows.filter((r) => r.role !== "outside");
  return mine.length >= 2 ? mine : rows;
}

// ---------- The timetable's calendar ----------

export interface CalendarLike {
  monday?: boolean;
  tuesday?: boolean;
  wednesday?: boolean;
  thursday?: boolean;
  friday?: boolean;
  saturday?: boolean;
  sunday?: boolean;
}

const DAYS: [keyof CalendarLike, string][] = [
  ["monday", "Mon"],
  ["tuesday", "Tue"],
  ["wednesday", "Wed"],
  ["thursday", "Thu"],
  ["friday", "Fri"],
  ["saturday", "Sat"],
  ["sunday", "Sun"],
];

export function operatingDays(calendar?: CalendarLike | null): string[] {
  if (!calendar) return [];
  return DAYS.filter(([k]) => calendar[k]).map(([, label]) => label);
}

/** "Every day", "Weekdays", "Weekends", or the days listed; empty when none are recorded. */
export function daysPhrase(days: string[]): string {
  if (days.length === 0) return "";
  if (days.length === 7) return "Every day";
  const set = new Set(days);
  if (days.length === 5 && ["Mon", "Tue", "Wed", "Thu", "Fri"].every((d) => set.has(d))) return "Weekdays";
  if (days.length === 2 && set.has("Sat") && set.has("Sun")) return "Weekends";
  return days.join(", ");
}

export type DateStatus = "runs" | "no" | "unstated";

/** Whether the departure runs on the searched date. `null`/`undefined` means the server found no calendar and no
 * exception for it, so nobody has said which days it runs (INC-055, ADR-023): never guessed as yes or no. */
export function dateStatus(isActiveOnDate?: boolean | null): DateStatus {
  if (isActiveOnDate == null) return "unstated";
  return isActiveOnDate ? "runs" : "no";
}

export interface ExceptionLike {
  id?: string;
  exceptionDate?: string;
  exceptionType?: string;
  reason?: string;
  affectsQueryDate?: boolean;
}

/** Exceptions that touch the searched date first, then by date. */
export function sortExceptions<T extends ExceptionLike>(list: T[] | undefined): T[] {
  return [...(list ?? [])].sort((a, b) => {
    if (!!a.affectsQueryDate !== !!b.affectsQueryDate) return a.affectsQueryDate ? -1 : 1;
    return (a.exceptionDate ?? "").localeCompare(b.exceptionDate ?? "");
  });
}

// ---------- Can it be booked? ----------

export type BookingState =
  | { kind: "open"; tripId: string; busId: string }
  | { kind: "no-bus" }
  | { kind: "cancelled" }
  | { kind: "left" }
  | { kind: "past-date" };

export interface BookableLike {
  trip?: { tripId?: string; status?: string; bus?: { busId?: string } } | null;
}

/** Whether "Choose seats" should be offered. The server has the final say at booking time; this only avoids
 * offering a button that can't work. */
export function bookingState(details: BookableLike, date: string, today: string): BookingState {
  if (date < today) return { kind: "past-date" };
  const trip = details.trip;
  const tripId = trip?.tripId;
  const busId = trip?.bus?.busId;
  if (!tripId || !busId) return { kind: "no-bus" };
  const status = (trip?.status ?? "").toLowerCase();
  if (status === "cancelled" || status === "canceled") return { kind: "cancelled" };
  if (status === "completed" || status === "departed" || status === "in_transit") return { kind: "left" };
  return { kind: "open", tripId, busId };
}

export interface SeatsLinkInput {
  tripId: string;
  busId: string;
  fromStopId: string;
  toStopId: string;
  fromStopName?: string;
  toStopName?: string;
  routeName?: string;
  operatorName?: string;
  tripDate?: string;
  departureTime?: string;
  /** The trust label key of the departure time, so the booking pages can keep saying how far to trust it. */
  departureTrust?: string;
  arrivalTime?: string;
}

/** The link seat selection reads: the same parameter names passenger-web's "Book This Bus" sends. */
export function seatsPath(i: SeatsLinkInput): string {
  const q = new URLSearchParams({ tripId: i.tripId, busId: i.busId, fromStopId: i.fromStopId, toStopId: i.toStopId });
  const optional: [string, string | undefined][] = [
    ["fromStopName", i.fromStopName],
    ["toStopName", i.toStopName],
    ["routeName", i.routeName],
    ["operatorName", i.operatorName],
    ["tripDate", i.tripDate],
    ["departureTime", i.departureTime],
    ["departureTrust", i.departureTrust],
    ["arrivalTime", i.arrivalTime],
  ];
  for (const [k, v] of optional) if (v) q.set(k, v);
  return `/booking/seats?${q.toString()}`;
}

/** Back to the results this departure came from. */
export function resultsPath(p: { fromStopId: string; toStopId: string; fromName?: string; toName?: string; date: string }): string {
  const q = new URLSearchParams({ fromStopId: p.fromStopId, toStopId: p.toStopId });
  if (p.fromName) q.set("fromName", p.fromName);
  if (p.toName) q.set("toName", p.toName);
  q.set("date", p.date);
  return `/findmybus?${q.toString()}`;
}
