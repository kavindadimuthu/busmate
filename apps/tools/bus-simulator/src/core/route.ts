import { bearingDeg, haversineM, interpolate, type LatLng } from './geo.ts';

export interface RouteStop extends LatLng {
  stopId: string;
  name: string;
}

export interface SimRoute {
  id: string;
  name: string;
  /** core-service's roadType — sets how fast a driver cruises. */
  roadType: string;
  stops: RouteStop[];
}

/**
 * A route as a drivable line. Core-service holds ordered stops but no road polyline, so each leg is
 * a straight line between consecutive stops (INC-022 open question) and the bus cuts corners.
 */
export interface RoutePath {
  route: SimRoute;
  /** Distance from the first stop to each stop, metres. Same indices as route.stops. */
  stopDistancesM: number[];
  totalM: number;
}

export function buildPath(route: SimRoute): RoutePath {
  if (route.stops.length < 2) {
    throw new Error(`Route ${route.id} has ${route.stops.length} located stops; at least 2 are needed to drive it`);
  }
  const stopDistancesM = [0];
  for (let i = 1; i < route.stops.length; i++) {
    stopDistancesM.push(stopDistancesM[i - 1] + haversineM(route.stops[i - 1], route.stops[i]));
  }
  return { route, stopDistancesM, totalM: stopDistancesM[stopDistancesM.length - 1] };
}

export function reversePath(path: RoutePath): RoutePath {
  return buildPath({ ...path.route, stops: [...path.route.stops].reverse() });
}

export function pointAt(path: RoutePath, distanceM: number): LatLng & { headingDeg: number } {
  const { stops } = path.route;
  const d = Math.min(Math.max(distanceM, 0), path.totalM);
  let leg = 0;
  while (leg < stops.length - 2 && path.stopDistancesM[leg + 1] <= d) leg++;
  const legStart = path.stopDistancesM[leg];
  const legLength = path.stopDistancesM[leg + 1] - legStart;
  const fraction = legLength > 0 ? (d - legStart) / legLength : 0;
  return { ...interpolate(stops[leg], stops[leg + 1], fraction), headingDeg: bearingDeg(stops[leg], stops[leg + 1]) };
}

/** The subset of core-service's RouteResponse this simulator reads. */
export interface CoreServiceRoute {
  id: string;
  name: string;
  roadType?: string | null;
  routeStops?: Array<{
    stopId: string;
    stopName: string;
    stopOrder: number;
    location?: { latitude?: number | null; longitude?: number | null } | null;
  }> | null;
}

/** Stops without coordinates are skipped: a bus cannot drive to a place the network does not locate. */
export function fromCoreServiceRoute(route: CoreServiceRoute): SimRoute {
  const stops = [...(route.routeStops ?? [])]
    .sort((a, b) => a.stopOrder - b.stopOrder)
    .filter((s) => s.location?.latitude != null && s.location?.longitude != null)
    .map((s) => ({
      stopId: s.stopId,
      name: s.stopName,
      lat: s.location!.latitude as number,
      lng: s.location!.longitude as number,
    }));
  return { id: route.id, name: route.name, roadType: route.roadType ?? 'NORMALWAY', stops };
}
