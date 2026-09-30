import { colomboNow } from "./findMyBus";

export interface TripSearch {
  fromStopId: string;
  toStopId: string;
  fromText: string;
  toText: string;
  date: string;
}

/** Today as YYYY-MM-DD in Sri Lanka. BusMate's timetables are Sri Lankan, so "today" is theirs even
 * when the phone is elsewhere; `toISOString()` would give the UTC date, still yesterday until 05:30. */
export function todayInSriLanka(): string {
  return colomboNow().date;
}

/** Same query contract as passenger-web's SearchForm, so either app's Find My Bus page reads it:
 * picked stops travel as ids + display names, free text as fromText/toText. Null when there is
 * nothing to search for. */
export function findMyBusPath(s: TripSearch): string | null {
  const params = new URLSearchParams();
  if (s.fromStopId && s.toStopId) {
    params.set("fromStopId", s.fromStopId);
    params.set("toStopId", s.toStopId);
    params.set("fromName", s.fromText);
    params.set("toName", s.toText);
  } else if (s.fromText.trim() || s.toText.trim()) {
    params.set("fromText", s.fromText);
    params.set("toText", s.toText);
  } else {
    return null;
  }
  params.set("date", s.date);
  return `/findmybus?${params.toString()}`;
}
