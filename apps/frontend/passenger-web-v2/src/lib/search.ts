export interface TripSearch {
  fromStopId: string;
  toStopId: string;
  fromText: string;
  toText: string;
  date: string;
}

/** Today as YYYY-MM-DD in the passenger's own timezone. `toISOString()` would give the UTC date,
 * which in Sri Lanka (UTC+5:30) is still yesterday until 05:30. */
export function localIsoDate(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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
