import { useQuery } from "@tanstack/react-query";
import { PassengerQueryService, RouteManagementService, type RouteResponse } from "@busmate/api-client-core";

export function useAllRoutes() {
  return useQuery({
    queryKey: ["routes", "all"],
    queryFn: () => RouteManagementService.getAllRoutesAsList(),
    staleTime: 5 * 60_000,
  });
}

export function useStopCount() {
  return useQuery({
    queryKey: ["stops", "count"],
    queryFn: async () => (await PassengerQueryService.searchStops(undefined, undefined, undefined, undefined, 0, 1)).totalElements ?? 0,
    staleTime: 5 * 60_000,
  });
}

/** Distinct towns any published route calls at — from the routes' own stop lists, so it counts
 * only places a bus on BusMate actually serves, not every stop in the registry. */
export function townsServed(routes: RouteResponse[]): number {
  const towns = new Set<string>();
  for (const r of routes) {
    for (const rs of r.routeStops ?? []) {
      const city = rs.location?.city?.trim();
      if (city) towns.add(city.toLowerCase());
    }
  }
  return towns.size;
}

export function formatDuration(minutes: number | undefined): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}
