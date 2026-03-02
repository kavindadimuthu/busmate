/**
 * Route Workspace Types
 * 
 * These types represent the complete structure for managing route group data
 * in the Route Workspace, including route groups, routes, and stops.
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum DirectionEnum {
  OUTBOUND = 'OUTBOUND',
  INBOUND = 'INBOUND',
}

export enum RoadTypeEnum {
  NORMALWAY = 'NORMALWAY',
  EXPRESSWAY = 'EXPRESSWAY',
}

export enum StopTypeEnum {
  START = 'S',
  END = 'E',
  INTERMEDIATE = 'I',
}

export enum StopExistenceType {
  EXISTING = 'existing',
  NEW = 'new',
}

// ============================================================================
// LOCATION TYPES
// ============================================================================

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  addressSinhala?: string;
  citySinhala?: string;
  stateSinhala?: string;
  countrySinhala?: string;
  addressTamil?: string;
  cityTamil?: string;
  stateTamil?: string;
  countryTamil?: string;
}

// ============================================================================
// STOP TYPES
// ============================================================================

export interface Stop {
  id: string; // UUID or empty string for new stops
  name: string;
  nameSinhala?: string;
  nameTamil?: string;
  description?: string;
  location?: Location;
  isAccessible?: boolean;
  type: StopExistenceType; // 'existing' or 'new'
}

// ============================================================================
// ROUTE STOP TYPES
// ============================================================================

export interface RouteStop {
  id?: string; // Unique identifier for the route stop (for updates)
  orderNumber: number;
  distanceFromStart: number | null; // in kilometers - null if not provided
  stop: Stop;
  // Computed property - determines if this is Start (S), End (E), or Intermediate (I)
  stopType?: StopTypeEnum;
}

// ============================================================================
// ROUTE TYPES
// ============================================================================

export interface Route {
  id?: string; // UUID - optional for new routes
  name: string;
  nameSinhala?: string;
  nameTamil?: string;
  routeNumber?: string;
  description?: string;
  direction: DirectionEnum;
  roadType: RoadTypeEnum;
  routeThrough?: string;
  routeThroughSinhala?: string;
  routeThroughTamil?: string;
  distanceKm?: number;
  estimatedDurationMinutes?: number;
  // Start and end stop IDs are derived from routeStops (first and last)
  startStopId?: string;
  endStopId?: string;
  routeStops: RouteStop[];
}

// ============================================================================
// ROUTE GROUP TYPES
// ============================================================================

export interface RouteGroup {
  id?: string; // UUID - optional for new route groups
  name: string;
  nameSinhala?: string;
  nameTamil?: string;
  description?: string;
  routes: Route[];
}

// ============================================================================
// WORKSPACE DATA TYPES
// ============================================================================

export interface RouteWorkspaceData {
  routeGroup: RouteGroup;
  // Active route being edited (index in routes array)
  activeRouteIndex?: number;
  // Active direction (for outbound/inbound tabs)
  activeDirection?: 'outbound' | 'inbound';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function createEmptyLocation(): Location {
  return {
    latitude: 0,
    longitude: 0,
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Sri Lanka',
  };
}

export function createEmptyStop(): Stop {
  return {
    id: '',
    name: '',
    nameSinhala: '',
    nameTamil: '',
    description: '',
    location: createEmptyLocation(),
    isAccessible: true,
    type: StopExistenceType.NEW,
  };
}

export function createEmptyRouteStop(orderNumber: number): RouteStop {
  return {
    orderNumber,
    distanceFromStart: null,
    stop: createEmptyStop(),
    stopType: StopTypeEnum.INTERMEDIATE,
  };
}

export function createEmptyRoute(): Route {
  return {
    name: '',
    nameSinhala: '',
    nameTamil: '',
    routeNumber: '',
    description: '',
    direction: DirectionEnum.OUTBOUND,
    roadType: RoadTypeEnum.NORMALWAY,
    routeThrough: '',
    routeThroughSinhala: '',
    routeThroughTamil: '',
    distanceKm: 0,
    estimatedDurationMinutes: 0,
    routeStops: [
      createEmptyRouteStop(0), // Start stop
      createEmptyRouteStop(1), // End stop
    ],
  };
}

export function createEmptyRouteGroup(): RouteGroup {
  return {
    name: '',
    nameSinhala: '',
    nameTamil: '',
    description: '',
    routes: [],
  };
}

export function createEmptyRouteWorkspaceData(): RouteWorkspaceData {
  return {
    routeGroup: createEmptyRouteGroup(),
    activeRouteIndex: undefined,
    activeDirection: 'outbound',
  };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isExistingStop(stop: Stop): boolean {
  return stop.type === StopExistenceType.EXISTING && stop.id !== '';
}

export function isNewStop(stop: Stop): boolean {
  return stop.type === StopExistenceType.NEW || stop.id === '';
}

// ============================================================================
// COMPUTED PROPERTIES HELPERS
// ============================================================================

/**
 * Updates stop types based on their position in the array
 * First stop = START, Last stop = END, Others = INTERMEDIATE
 */
export function updateStopTypes(routeStops: RouteStop[]): RouteStop[] {
  return routeStops.map((stop, index) => ({
    ...stop,
    stopType: 
      index === 0 
        ? StopTypeEnum.START 
        : index === routeStops.length - 1 
        ? StopTypeEnum.END 
        : StopTypeEnum.INTERMEDIATE,
  }));
}

/**
 * Calculates the total distance of a route from its stops
 */
export function calculateTotalDistance(routeStops: RouteStop[]): number {
  if (routeStops.length === 0) return 0;
  const distances = routeStops
    .map(stop => stop.distanceFromStart)
    .filter((d): d is number => d !== null);
  if (distances.length === 0) return 0;
  return Math.max(...distances);
}

/**
 * Gets the start stop from route stops
 */
export function getStartStop(routeStops: RouteStop[]): RouteStop | undefined {
  return routeStops.find(stop => stop.stopType === StopTypeEnum.START) || routeStops[0];
}

/**
 * Gets the end stop from route stops
 */
export function getEndStop(routeStops: RouteStop[]): RouteStop | undefined {
  return routeStops.find(stop => stop.stopType === StopTypeEnum.END) || routeStops[routeStops.length - 1];
}

/**
 * Gets intermediate stops (excluding start and end)
 */
export function getIntermediateStops(routeStops: RouteStop[]): RouteStop[] {
  return routeStops.filter(stop => stop.stopType === StopTypeEnum.INTERMEDIATE);
}

/**
 * Re-orders route stops and updates their order numbers
 */
export function reorderRouteStops(routeStops: RouteStop[]): RouteStop[] {
  return routeStops
    .map((stop, index) => ({
      ...stop,
      orderNumber: index,
    }))
    .sort((a, b) => a.orderNumber - b.orderNumber);
}

/**
 * Moves a route stop from one position to another and recalculates all order numbers
 * @param routeStops - Array of route stops
 * @param fromIndex - Current index of the stop to move
 * @param toIndex - Target index where the stop should be moved
 * @returns New array of route stops with updated order numbers and stop types
 */
export function moveRouteStop(
  routeStops: RouteStop[],
  fromIndex: number,
  toIndex: number
): RouteStop[] {
  // Validate indices
  if (
    fromIndex < 0 ||
    fromIndex >= routeStops.length ||
    toIndex < 0 ||
    toIndex >= routeStops.length ||
    fromIndex === toIndex
  ) {
    return routeStops;
  }

  // Create a copy of the array
  const newStops = [...routeStops];
  
  // Remove the item from the old position
  const [movedStop] = newStops.splice(fromIndex, 1);
  
  // Insert it at the new position
  newStops.splice(toIndex, 0, movedStop);
  
  // Recalculate order numbers (0, 1, 2, ...)
  const reorderedStops = newStops.map((stop, index) => ({
    ...stop,
    orderNumber: index,
  }));
  
  // Update stop types based on new positions
  return updateStopTypes(reorderedStops);
}
