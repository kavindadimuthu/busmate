// Pure route-browsing logic, no React: searching, filtering and sorting the route list, wording road types, and
// finding a route's other direction. Erasable TypeScript only so `node --test` can run it.

export interface RouteLike {
  id?: string;
  name?: string;
  routeNumber?: string;
  roadType?: string;
  routeThrough?: string;
  routeGroupId?: string;
  routeGroupName?: string;
  startStopName?: string;
  endStopName?: string;
  distanceKm?: number;
  estimatedDurationMinutes?: number;
  routeStops?: { stopName?: string }[];
}

export type RoadTypeId = "NORMALWAY" | "EXPRESSWAY";

/** How a road type reads to a passenger. An unknown type is shown as the server wrote it, never guessed at. */
export function roadTypeLabel(type: string | undefined): string | null {
  if (!type) return null;
  if (type === "NORMALWAY") return "Normal road";
  if (type === "EXPRESSWAY") return "Expressway";
  return type;
}

/** Everything a passenger might type to find a route: its number, name, group, the towns it goes through, and every stop. */
export function searchText(r: RouteLike): string {
  return [r.routeNumber, r.name, r.routeGroupName, r.routeThrough, r.startStopName, r.endStopName, ...(r.routeStops ?? []).map((s) => s.stopName)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export interface RouteFilters {
  query: string;
  roadType: string;
}

/** Every word typed must start a word in the route ("kandy 01" finds route 01 to Kandy; "gal" finds Galle but "galle"
 * doesn't find Kegalle: passengers type the start of a name, not the middle). A road type narrows further. */
export function filterRoutes<R extends RouteLike>(routes: readonly R[], f: RouteFilters): R[] {
  const words = f.query.toLowerCase().split(/\s+/).filter(Boolean);
  return routes.filter((r) => {
    if (f.roadType && r.roadType !== f.roadType) return false;
    if (words.length === 0) return true;
    const found = searchText(r).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    return words.every((w) => found.some((t) => t.startsWith(w)));
  });
}

export type RouteSort = "number" | "shortest" | "longest";

const byNumber = (a: RouteLike, b: RouteLike) =>
  (a.routeNumber ?? "").localeCompare(b.routeNumber ?? "", undefined, { numeric: true }) || (a.name ?? "").localeCompare(b.name ?? "");

/** Routes with no recorded distance go last under either distance sort: an unknown length is neither short nor long. */
export function sortRoutes<R extends RouteLike>(routes: readonly R[], sort: RouteSort): R[] {
  const list = [...routes];
  if (sort === "number") return list.sort(byNumber);
  const dir = sort === "shortest" ? 1 : -1;
  return list.sort((a, b) => {
    const da = a.distanceKm;
    const db = b.distanceKm;
    if (da == null && db == null) return byNumber(a, b);
    if (da == null) return 1;
    if (db == null) return -1;
    return da === db ? byNumber(a, b) : (da - db) * dir;
  });
}

/** The road types actually present, with how many routes each has, so a filter never offers an empty choice. */
export function roadTypeOptions(routes: readonly RouteLike[]): { id: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of routes) if (r.roadType) counts.set(r.roadType, (counts.get(r.roadType) ?? 0) + 1);
  const order = ["NORMALWAY", "EXPRESSWAY"];
  return [...counts.entries()]
    .sort(([a], [b]) => (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b)) || a.localeCompare(b))
    .map(([id, count]) => ({ id, label: roadTypeLabel(id) ?? id, count }));
}

/** The same route going the other way: routes in the same group, other than this one. */
export function otherDirections<R extends RouteLike>(routes: readonly R[], route: RouteLike): R[] {
  if (!route.routeGroupId) return [];
  return routes.filter((r) => r.routeGroupId === route.routeGroupId && r.id !== route.id);
}

export function stopCount(r: RouteLike): number {
  return r.routeStops?.length ?? 0;
}

export function countLabel(n: number): string {
  return `${n} route${n === 1 ? "" : "s"}`;
}

/** "115 km", or "37.5 km" when it isn't whole. Null when the length isn't recorded. */
export function formatKm(km: number | null | undefined): string | null {
  if (km == null || !Number.isFinite(km) || km < 0) return null;
  return `${Number.isInteger(km) ? km : km.toFixed(1)} km`;
}

export interface StopLike {
  stopId?: string;
  stopName?: string;
  stopOrder?: number;
  distanceFromStartKm?: number;
  isAccessible?: boolean;
}

/** A route's stops in running order, each with its distance from the start. Stops with no order go last, in the order given. */
export function orderedStops<S extends StopLike>(stops: readonly S[]): S[] {
  return stops
    .map((s, i) => ({ s, i }))
    .sort((a, b) => (a.s.stopOrder ?? Number.MAX_SAFE_INTEGER) - (b.s.stopOrder ?? Number.MAX_SAFE_INTEGER) || a.i - b.i)
    .map((x) => x.s);
}
