// =============================================================================
// Mock Location Tracking — Data Layer Barrel Export
// =============================================================================

export * from './types';
export { ROUTES, getRouteById } from './routes';
export { BUS_FLEET, getBusById, getBusByDeviceId } from './buses';
export { BUS_SCHEDULES, getScheduleForBus } from './schedules';

// Location tracking data services
// Export specific items from location-tracking-simulation to avoid conflicts
export {
  BUS_FLEET as LOCATION_BUS_FLEET,
  ROUTE_PATHS,
  calculateDistance,
  calculateHeading,
  interpolatePositionOnPath,
  getAllSimulatedBusStates,
  getRoutePath,
  getBusDefinition,
  simulateBusState,
  parseTimeToMinutes,
  getCurrentMinutesFromMidnight,
  getCurrentTripForBus,
  type Waypoint as LocationWaypoint,
  type RoutePathDefinition,
  type SimulatedBusState as LocationSimulatedBusState,
} from './location-tracking-simulation';

// Export all location tracking services
export * from './location-tracking';
