// Pure logic behind the Find My Bus results page (INC-066). No React and no imports, so
// `node --test` runs it directly (see the test file beside it). Keep it that way: erasable
// TypeScript only, no path aliases.

/** The fields of a search result this page reads; the generated BusResult satisfies it. */
export interface BusLike {
  routeId?: string;
  routeNumber?: string;
  routeName?: string;
  roadType?: string;
  distanceKm?: number;
  estimatedDurationMinutes?: number;
  departureAtOrigin?: string;
  arrivalAtDestination?: string;
  actualDepartureTime?: string;
  actualArrivalTime?: string;
  scheduleId?: string;
  tripId?: string;
  tripStatus?: string;
  alreadyDeparted?: boolean;
}

const DAY = 1440;

// ---------- Times ----------

/** Minutes after midnight from "06:00", "06:00:00" or "2026-09-30T06:00:00", else null. */
export function parseTimeOfDay(value?: string | null): number | null {
  if (!value) return null;
  const time = value.includes("T") ? value.split("T")[1] : value;
  const m = /^(\d{1,2}):(\d{2})/.exec(time ?? "");
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
}

/** 360 -> "6:00 AM". Values past midnight wrap (1500 -> "1:00 AM"). */
export function formatClock(minutes: number): string {
  const m = ((Math.round(minutes) % DAY) + DAY) % DAY;
  const h = Math.floor(m / 60);
  return `${h % 12 || 12}:${String(m % 60).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

/** 225 -> "3h 45m", 45 -> "45m", 120 -> "2h". */
export function formatDuration(minutes: number | null | undefined): string | null {
  if (minutes == null || !(minutes > 0)) return null;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function departureMinutes(bus: BusLike): number | null {
  return parseTimeOfDay(bus.actualDepartureTime) ?? parseTimeOfDay(bus.departureAtOrigin);
}

export function arrivalMinutes(bus: BusLike): number | null {
  return parseTimeOfDay(bus.actualArrivalTime) ?? parseTimeOfDay(bus.arrivalAtDestination);
}

/** Journey length: the server's figure when it has one (only for buses with trip data), else worked
 * out from the two times, counting a bus that arrives after midnight. */
export function journeyMinutes(bus: BusLike): number | null {
  if (bus.estimatedDurationMinutes && bus.estimatedDurationMinutes > 0) return bus.estimatedDurationMinutes;
  const dep = departureMinutes(bus);
  const arr = arrivalMinutes(bus);
  if (dep == null || arr == null) return null;
  const diff = arr >= dep ? arr - dep : arr + DAY - dep;
  return diff > 0 ? diff : null;
}

export function arrivesNextDay(bus: BusLike): boolean {
  const dep = departureMinutes(bus);
  const arr = arrivalMinutes(bus);
  return dep != null && arr != null && arr < dep;
}

// ---------- Dates (Sri Lanka time; it has no daylight saving) ----------

export function colomboNow(now: Date = new Date()): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Wed, 30 Sep 2026". Spelled out here, not by the browser, so every phone shows the same thing
 * (en-GB says "Sept" in some browsers and "Sep" in others). */
export function formatLongDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "Wednesday 30 September", for a sentence. */
export function formatDayName(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

/** "Colombo Fort (Central Bus Stand)" -> "Colombo Fort": the town-level name, for tight spots. The full
 * name stays wherever two stops in one town could be confused. */
export function shortStopName(name: string): string {
  const short = name.replace(/\s*\([^)]*\)\s*$/, "").trim();
  return short || name;
}

/** True when today's scheduled departure time has gone. The server sets `alreadyDeparted` only for
 * buses with trip data, so a plain timetable entry is judged here from its scheduled time. */
export function hasPassed(bus: BusLike, searchDate: string, now: Date = new Date()): boolean {
  const today = colomboNow(now);
  if (searchDate !== today.date) return false;
  if (bus.alreadyDeparted) return true;
  const dep = departureMinutes(bus);
  return dep != null && dep < today.minutes;
}

// ---------- Filters and sorting ----------

export type TimeBand = "morning" | "afternoon" | "evening" | "night";

export const TIME_BANDS: { id: TimeBand; label: string; range: string }[] = [
  { id: "morning", label: "Morning", range: "5am – 12pm" },
  { id: "afternoon", label: "Afternoon", range: "12pm – 5pm" },
  { id: "evening", label: "Evening", range: "5pm – 9pm" },
  { id: "night", label: "Night", range: "9pm – 5am" },
];

export function bandOf(minutes: number): TimeBand {
  if (minutes >= 300 && minutes < 720) return "morning";
  if (minutes >= 720 && minutes < 1020) return "afternoon";
  if (minutes >= 1020 && minutes < 1260) return "evening";
  return "night";
}

export type RoadType = "" | "NORMALWAY" | "EXPRESSWAY";

export interface Filters {
  bands: TimeBand[];
  roadType: RoadType;
  /** Route numbers to keep; empty keeps all. */
  routes: string[];
}

export const NO_FILTERS: Filters = { bands: [], roadType: "", routes: [] };

export function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function activeFilterCount(f: Filters): number {
  return f.bands.length + (f.roadType ? 1 : 0) + f.routes.length;
}

export function applyFilters<T extends BusLike>(list: T[], f: Filters): T[] {
  return list.filter((b) => {
    if (f.bands.length) {
      const dep = departureMinutes(b);
      if (dep == null || !f.bands.includes(bandOf(dep))) return false;
    }
    if (f.roadType && b.roadType !== f.roadType) return false;
    if (f.routes.length && !f.routes.includes(b.routeNumber ?? "")) return false;
    return true;
  });
}

export type SortKey = "earliest" | "fastest" | "shortest";

export const SORTS: { id: SortKey; label: string }[] = [
  { id: "earliest", label: "Earliest" },
  { id: "fastest", label: "Fastest" },
  { id: "shortest", label: "Shortest" },
];

/** Values a bus doesn't have sort last, so a missing time never floats to the top. */
const orLast = (n: number | null | undefined) => (n == null || !Number.isFinite(n) || n <= 0 ? Number.POSITIVE_INFINITY : n);

export function sortBuses<T extends BusLike>(list: T[], key: SortKey): T[] {
  const dep = (b: T) => departureMinutes(b) ?? Number.POSITIVE_INFINITY;
  const primary: Record<SortKey, (b: T) => number> = {
    earliest: dep,
    fastest: (b) => orLast(journeyMinutes(b)),
    shortest: (b) => orLast(b.distanceKm),
  };
  const by = primary[key];
  return [...list].sort((a, b) => {
    const d = by(a) - by(b);
    if (d !== 0 && !Number.isNaN(d)) return d;
    const t = dep(a) - dep(b);
    if (t !== 0 && !Number.isNaN(t)) return t;
    return (a.routeNumber ?? "").localeCompare(b.routeNumber ?? "", undefined, { numeric: true });
  });
}

/** Buses still to come first, then those whose scheduled time has passed (only ever non-empty for today). */
export function splitByPassed<T extends BusLike>(list: T[], searchDate: string, now: Date = new Date()) {
  const upcoming: T[] = [];
  const passed: T[] = [];
  for (const b of list) (hasPassed(b, searchDate, now) ? passed : upcoming).push(b);
  return { upcoming, passed };
}

export function isCancelled(b: BusLike): boolean {
  const s = (b.tripStatus ?? "").toLowerCase();
  return s === "cancelled" || s === "canceled";
}

/** A cancelled bus stays in the list, since a passenger should know, but never ahead of one that is
 * running, whatever the sort: "fastest" must not lead with a bus that isn't going. Keeps each group's order. */
export function cancelledLast<T extends BusLike>(list: T[]): T[] {
  return [...list.filter((b) => !isCancelled(b)), ...list.filter(isCancelled)];
}

/** Distinct route numbers in the results, in natural order, with how many buses each has. */
export function routeOptions(list: BusLike[]): { route: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const b of list) if (b.routeNumber) counts.set(b.routeNumber, (counts.get(b.routeNumber) ?? 0) + 1);
  return [...counts.entries()]
    .map(([route, count]) => ({ route, count }))
    .sort((a, b) => a.route.localeCompare(b.route, undefined, { numeric: true }));
}

/** Whether there is anything to filter beyond time of day: both road types, or more than one route. */
export function hasExtraFilters(list: BusLike[]): boolean {
  const roads = roadTypeCounts(list);
  return (roads.NORMALWAY > 0 && roads.EXPRESSWAY > 0) || routeOptions(list).length > 1;
}

export function roadTypeCounts(list: BusLike[]): { NORMALWAY: number; EXPRESSWAY: number } {
  return {
    NORMALWAY: list.filter((b) => b.roadType === "NORMALWAY").length,
    EXPRESSWAY: list.filter((b) => b.roadType === "EXPRESSWAY").length,
  };
}

// ---------- A bus's own status ----------

export type StatusTone = "good" | "warn" | "bad";

/** What a trip's status means to a passenger, in plain words. Not "Live": there are no live positions
 * yet, so "active" is only "in service". Statuses that say nothing useful (pending, completed) return null. */
export function statusLabel(status?: string | null): { text: string; tone: StatusTone } | null {
  switch ((status ?? "").toLowerCase()) {
    case "active":
    case "in_transit":
      return { text: "In service", tone: "good" };
    case "boarding":
      return { text: "Boarding", tone: "good" };
    case "departed":
      return { text: "Departed", tone: "warn" };
    case "delayed":
      return { text: "Delayed", tone: "warn" };
    case "cancelled":
    case "canceled":
      return { text: "Cancelled", tone: "bad" };
    default:
      return null;
  }
}

// ---------- Links ----------

/** Same query passenger-web's cards send, so either app's trip details page reads it. Null when the
 * result has no schedule to look up. */
export function detailPath(bus: BusLike, fromStopId: string, toStopId: string, date?: string): string | null {
  if (!bus.scheduleId || !fromStopId || !toStopId) return null;
  const p = new URLSearchParams({ scheduleId: bus.scheduleId, fromStopId, toStopId });
  if (bus.tripId) p.set("tripId", bus.tripId);
  if (date) p.set("date", date);
  return `/findmybus/detail?${p.toString()}`;
}

// ---------- Search parameters ----------

export interface SearchParams {
  fromStopId: string;
  toStopId: string;
  fromName: string;
  toName: string;
  fromText: string;
  toText: string;
  date: string;
}

/** Reads `/findmybus?...` (the contract in lib/search.ts). A bad or missing date becomes `today`. */
export function readSearchParams(search: string, today: string): SearchParams {
  const q = new URLSearchParams(search);
  const date = q.get("date");
  return {
    fromStopId: q.get("fromStopId") ?? "",
    toStopId: q.get("toStopId") ?? "",
    fromName: q.get("fromName") ?? "",
    toName: q.get("toName") ?? "",
    fromText: q.get("fromText") ?? "",
    toText: q.get("toText") ?? "",
    date: isIsoDate(date) ? date : today,
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isStopId = (v: string) => UUID.test(v);

// ---------- Typed names that weren't picked from the list ----------

export interface StopCandidate {
  id: string;
  name: string;
  city: string;
}

export type StopResolution =
  | { kind: "match"; stop: StopCandidate }
  | { kind: "ambiguous"; options: StopCandidate[] }
  | { kind: "none" };

/** Turn typed text plus the stop search's candidates into one stop when that is safe: a single
 * candidate, an exact name, or exactly one name or town that starts with what was typed. Anything
 * less certain is put back to the passenger rather than guessed. */
export function resolveStopText(text: string, candidates: StopCandidate[]): StopResolution {
  const norm = text.trim().toLowerCase();
  if (!norm || candidates.length === 0) return { kind: "none" };
  if (candidates.length === 1) return { kind: "match", stop: candidates[0] };

  const exact = candidates.filter((c) => c.name.trim().toLowerCase() === norm);
  if (exact.length === 1) return { kind: "match", stop: exact[0] };

  const pool = candidates.filter((c) => c.name.toLowerCase().startsWith(norm) || c.city.trim().toLowerCase() === norm);
  if (pool.length === 1) return { kind: "match", stop: pool[0] };
  return { kind: "ambiguous", options: (pool.length > 1 ? pool : candidates).slice(0, 6) };
}
