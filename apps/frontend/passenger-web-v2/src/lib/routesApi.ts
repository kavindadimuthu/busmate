import { useQuery } from "@tanstack/react-query";
import { ApiError, BusStopManagementService, RouteManagementService } from "@busmate/api-client-core";

const noRetryOn4xx = (count: number, error: unknown) => count < 1 && !(error instanceof ApiError && error.status < 500);

/** Every published route, with its stops. Routes change rarely, so this is kept for a few minutes. */
export function useRoutes() {
  return useQuery({
    queryKey: ["routes-all"],
    staleTime: 5 * 60_000,
    retry: noRetryOn4xx,
    queryFn: () => RouteManagementService.getAllRoutesAsList(),
  });
}

export function useRoute(id: string | undefined) {
  return useQuery({
    queryKey: ["route", id],
    enabled: !!id,
    staleTime: 5 * 60_000,
    retry: noRetryOn4xx,
    queryFn: () => RouteManagementService.getRouteById(id!),
  });
}

/** A route's stops with their order, distance from the start and accessibility. */
export function useRouteStops(id: string | undefined) {
  return useQuery({
    queryKey: ["route-stops", id],
    enabled: !!id,
    staleTime: 5 * 60_000,
    retry: noRetryOn4xx,
    queryFn: () => BusStopManagementService.getStopsByRoute(id!),
  });
}

/** True when the server said the route doesn't exist or the address wasn't a route id. */
export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status >= 400 && error.status < 500;
}
