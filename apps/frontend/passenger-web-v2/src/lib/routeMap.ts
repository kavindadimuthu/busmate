// Pure logic for the route and trip maps, no React: which stops can be drawn, in what role, and what to say about the
// ones that can't. Erasable TypeScript, so `node --test` can run it.
import { inSriLanka } from "./propose.ts";

export type PointRole = "origin" | "destination" | "between" | "outside";

export interface MapPoint {
  lat: number;
  lng: number;
  name: string;
  role: PointRole;
}

interface Located {
  latitude?: number;
  longitude?: number;
}

const usable = (loc: Located | undefined | null): loc is { latitude: number; longitude: number } =>
  !!loc && typeof loc.latitude === "number" && typeof loc.longitude === "number" && inSriLanka(loc.latitude, loc.longitude);

export interface MapPoints {
  points: MapPoint[];
  /** Stops in the list that have no usable position (missing, or outside Sri Lanka, which is a data error). */
  missing: number;
  total: number;
}

/** A route's stops, already in running order: the first is the start, the last the end, the rest between. */
export function routePoints(stops: readonly { stopName?: string; location?: Located }[]): MapPoints {
  const points: MapPoint[] = [];
  stops.forEach((s, i) => {
    if (!usable(s.location)) return;
    const role: PointRole = i === 0 ? "origin" : i === stops.length - 1 ? "destination" : "between";
    points.push({ lat: s.location.latitude, lng: s.location.longitude, name: s.stopName ?? "Stop", role });
  });
  return { points, missing: stops.length - points.length, total: stops.length };
}

/** A trip's stops (the rows the trip page already builds, each holding the schedule stop, which holds the stop): a passenger's boarding and getting-off stops, the ones
 * between, and the rest of the route outside their journey. */
export function tripPoints(rows: readonly { role: PointRole; stop?: { stop?: { name?: string; location?: Located } } }[]): MapPoints {
  const points: MapPoint[] = [];
  for (const r of rows) {
    const loc = r.stop?.stop?.location;
    if (!usable(loc)) continue;
    points.push({ lat: loc.latitude, lng: loc.longitude, name: r.stop?.stop?.name ?? "Stop", role: r.role });
  }
  return { points, missing: rows.length - points.length, total: rows.length };
}

/** The part of the path a passenger rides: everything from boarding to getting off. */
export const journeyOf = (points: readonly MapPoint[]): MapPoint[] => points.filter((p) => p.role !== "outside");

/** A line needs two points; one point is a dot, not a route. */
export const canDraw = (m: MapPoints): boolean => m.points.length >= 2;

/** Says so when the map leaves stops out, so it isn't taken for the whole route. Null when nothing is missing. */
export function missingNote(m: MapPoints): string | null {
  if (m.missing <= 0) return null;
  return `${m.points.length} of ${m.total} stops have a known position, so only those are shown.`;
}

export const ROLE_TEXT: Record<PointRole, string> = {
  origin: "Start",
  destination: "End",
  between: "Stop",
  outside: "Stop on the route",
};

/** The south-west and north-east corners around the points, for fitting the map to them. */
export function boundsOf(points: readonly { lat: number; lng: number }[]): { south: number; west: number; north: number; east: number } | null {
  if (points.length === 0) return null;
  let south = Infinity, west = Infinity, north = -Infinity, east = -Infinity;
  for (const p of points) {
    south = Math.min(south, p.lat);
    north = Math.max(north, p.lat);
    west = Math.min(west, p.lng);
    east = Math.max(east, p.lng);
  }
  return { south, west, north, east };
}
