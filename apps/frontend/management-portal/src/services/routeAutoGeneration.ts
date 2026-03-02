/**
 * Route Auto-Generation Service
 * 
 * This service provides functionality to auto-generate route data from a corresponding
 * route in the opposite direction. When building a route group with outbound and inbound
 * routes, users can auto-generate one route from the other to speed up the process.
 * 
 * Key Logic:
 * - Route stops are reversed (last becomes first, first becomes last)
 * - Stop names with direction words are swapped (e.g., "North" -> "South")
 * - Distance from start is recalculated based on reversed order
 * - Direction is swapped (OUTBOUND <-> INBOUND)
 * - Start/End stop IDs are swapped
 * - Route name is modified to reflect the new direction
 */

import {
  Route,
  RouteStop,
  DirectionEnum,
  Stop,
  StopTypeEnum,
  createEmptyRoute,
  updateStopTypes,
} from '@/types/RouteWorkspaceData';

// ============================================================================
// TYPES
// ============================================================================

export interface RouteAutoGenerationResult {
  success: boolean;
  route: Route;
  message: string;
  warnings: string[];
}

export interface AutoGenerationOptions {
  /** Whether to swap direction-related words in names (e.g., "to Kandy" -> "to Colombo") */
  swapDirectionWords?: boolean;
  /** Whether to preserve route metadata (routeNumber, roadType, etc.) */
  preserveMetadata?: boolean;
  /** Custom suffix to add to the generated route name */
  nameSuffix?: string;
}

// ============================================================================
// DIRECTION WORD PAIRS
// ============================================================================

/** Direction word pairs for English */
const DIRECTION_PAIRS_EN: [string, string][] = [
  ['to', 'from'],
  ['To', 'From'],
  ['TO', 'FROM'],
  ['North', 'South'],
  ['north', 'south'],
  ['East', 'West'],
  ['east', 'west'],
  ['Up', 'Down'],
  ['up', 'down'],
  ['Outbound', 'Inbound'],
  ['outbound', 'inbound'],
];

/** Direction word pairs for Sinhala (common transit terms) */
const DIRECTION_PAIRS_SI: [string, string][] = [
  ['සිට', 'දක්වා'], // from / to
  ['දක්වා', 'සිට'], // to / from
  ['උඩු', 'යටි'], // up / down
  ['උතුරු', 'දකුණු'], // north / south
];

/** Direction word pairs for Tamil (common transit terms) */
const DIRECTION_PAIRS_TA: [string, string][] = [
  ['இருந்து', 'வரை'], // from / to
  ['வரை', 'இருந்து'], // to / from
  ['மேல்', 'கீழ்'], // up / down
  ['வடக்கு', 'தெற்கு'], // north / south
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Swap direction-related words in a string based on language
 */
function swapDirectionWords(
  text: string | undefined,
  language: 'en' | 'si' | 'ta'
): string | undefined {
  if (!text) return text;

  let pairs: [string, string][];
  switch (language) {
    case 'si':
      pairs = DIRECTION_PAIRS_SI;
      break;
    case 'ta':
      pairs = DIRECTION_PAIRS_TA;
      break;
    default:
      pairs = DIRECTION_PAIRS_EN;
  }

  let result = text;
  for (const [word1, word2] of pairs) {
    // Use a placeholder to avoid double-swapping
    const placeholder = `__TEMP_PLACEHOLDER_${Math.random().toString(36)}__`;
    result = result.replace(new RegExp(word1, 'g'), placeholder);
    result = result.replace(new RegExp(word2, 'g'), word1);
    result = result.replace(new RegExp(placeholder, 'g'), word2);
  }

  return result;
}

/**
 * Deep clone a stop object
 */
function cloneStop(stop: Stop): Stop {
  return {
    ...stop,
    location: stop.location ? { ...stop.location } : undefined,
  };
}

/**
 * Deep clone a route stop object
 */
function cloneRouteStop(routeStop: RouteStop): RouteStop {
  return {
    ...routeStop,
    stop: cloneStop(routeStop.stop),
  };
}

/**
 * Calculate reversed distance from start
 * When reversing stops, the distance from start needs to be recalculated.
 * The last stop's distance becomes 0, and the first stop's distance becomes the total.
 */
function calculateReversedDistances(
  routeStops: RouteStop[],
  totalDistance: number
): RouteStop[] {
  return routeStops.map(stop => ({
    ...stop,
    distanceFromStart: stop.distanceFromStart !== null ? Math.max(0, totalDistance - stop.distanceFromStart) : null,
  }));
}

/**
 * Swap the direction enum
 */
function swapDirection(direction: DirectionEnum): DirectionEnum {
  return direction === DirectionEnum.OUTBOUND
    ? DirectionEnum.INBOUND
    : DirectionEnum.OUTBOUND;
}

/**
 * Generate a new route name based on the opposite direction
 */
function generateRouteName(
  originalName: string | undefined,
  newDirection: DirectionEnum,
  swapWords: boolean
): string {
  if (!originalName) {
    return newDirection === DirectionEnum.OUTBOUND
      ? 'Outbound Route'
      : 'Inbound Route';
  }

  let newName = originalName;

  // Swap direction words if enabled
  if (swapWords) {
    newName = swapDirectionWords(newName, 'en') || newName;
  }

  // If the name contains direction indicators, try to swap them
  if (newName.includes('Outbound')) {
    newName = newName.replace(/Outbound/g, 'Inbound');
  } else if (newName.includes('Inbound')) {
    newName = newName.replace(/Inbound/g, 'Outbound');
  } else if (newName.includes('(Up)')) {
    newName = newName.replace('(Up)', '(Down)');
  } else if (newName.includes('(Down)')) {
    newName = newName.replace('(Down)', '(Up)');
  }

  return newName;
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Generate a route from a corresponding route in the opposite direction.
 * 
 * This function takes an existing route (e.g., OUTBOUND) and generates
 * the corresponding route in the opposite direction (e.g., INBOUND).
 * 
 * The generated route will have:
 * - Reversed route stops (last stop becomes first, etc.)
 * - Swapped direction (OUTBOUND <-> INBOUND)
 * - Recalculated distances from start
 * - Swapped start/end stop IDs
 * - Modified route name to reflect new direction
 * 
 * @param sourceRoute - The source route to generate from
 * @param options - Optional configuration for the generation
 * @returns The generated route with the opposite direction
 */
export function generateRouteFromCorresponding(
  sourceRoute: Route,
  options: AutoGenerationOptions = {}
): RouteAutoGenerationResult {
  const {
    swapDirectionWords: swapWords = true,
    preserveMetadata = true,
    nameSuffix,
  } = options;

  const warnings: string[] = [];

  // Validate source route
  if (!sourceRoute) {
    return {
      success: false,
      route: createEmptyRoute(),
      message: 'Source route is required',
      warnings: [],
    };
  }

  if (!sourceRoute.routeStops || sourceRoute.routeStops.length === 0) {
    return {
      success: false,
      route: createEmptyRoute(),
      message: 'Source route has no stops. Please add stops to the source route first.',
      warnings: [],
    };
  }

  // Check for minimum stops
  if (sourceRoute.routeStops.length < 2) {
    warnings.push('Source route has less than 2 stops. Generated route may be incomplete.');
  }

  // Calculate total distance for reversing distances
  const distances = sourceRoute.routeStops
    .map(s => s.distanceFromStart)
    .filter((d): d is number => d !== null);
  const totalDistance = sourceRoute.distanceKm ||
    (distances.length > 0 ? Math.max(...distances) : 0);

  // Clone and reverse the route stops
  const reversedStops = [...sourceRoute.routeStops]
    .map(cloneRouteStop)
    .reverse();

  // Calculate reversed distances
  const stopsWithReversedDistances = calculateReversedDistances(reversedStops, totalDistance);

  // Update order numbers
  const stopsWithUpdatedOrder = stopsWithReversedDistances.map((stop, index) => ({
    ...stop,
    orderNumber: index,
    // Clear the route stop ID since this is a new route stop
    id: undefined,
  }));

  // Update stop types (first = START, last = END, others = INTERMEDIATE)
  const stopsWithUpdatedTypes = updateStopTypes(stopsWithUpdatedOrder);

  // Determine the new direction
  const newDirection = swapDirection(sourceRoute.direction);

  // Generate the new route
  const generatedRoute: Route = {
    // Clear the ID since this is a new route
    id: undefined,
    // Generate new name
    name: generateRouteName(sourceRoute.name, newDirection, swapWords) + (nameSuffix ? ` ${nameSuffix}` : ''),
    nameSinhala: swapWords
      ? swapDirectionWords(sourceRoute.nameSinhala, 'si')
      : sourceRoute.nameSinhala,
    nameTamil: swapWords
      ? swapDirectionWords(sourceRoute.nameTamil, 'ta')
      : sourceRoute.nameTamil,
    // Set the new direction
    direction: newDirection,
    // Preserve or copy metadata
    routeNumber: preserveMetadata ? sourceRoute.routeNumber : undefined,
    description: sourceRoute.description,
    roadType: preserveMetadata ? sourceRoute.roadType : sourceRoute.roadType,
    routeThrough: swapWords
      ? swapDirectionWords(sourceRoute.routeThrough, 'en')
      : sourceRoute.routeThrough,
    routeThroughSinhala: swapWords
      ? swapDirectionWords(sourceRoute.routeThroughSinhala, 'si')
      : sourceRoute.routeThroughSinhala,
    routeThroughTamil: swapWords
      ? swapDirectionWords(sourceRoute.routeThroughTamil, 'ta')
      : sourceRoute.routeThroughTamil,
    // Preserve distance and duration (same for both directions)
    distanceKm: sourceRoute.distanceKm,
    estimatedDurationMinutes: sourceRoute.estimatedDurationMinutes,
    // Swap start and end stop IDs
    startStopId: sourceRoute.endStopId,
    endStopId: sourceRoute.startStopId,
    // Use the reversed and updated stops
    routeStops: stopsWithUpdatedTypes,
  };

  // Add warning if no coordinates are present
  const stopsWithCoordinates = stopsWithUpdatedTypes.filter(
    s => s.stop.location?.latitude && s.stop.location?.longitude
  );
  if (stopsWithCoordinates.length < stopsWithUpdatedTypes.length) {
    warnings.push(
      `${stopsWithUpdatedTypes.length - stopsWithCoordinates.length} stop(s) are missing coordinates.`
    );
  }

  return {
    success: true,
    route: generatedRoute,
    message: `Successfully generated ${newDirection} route from ${sourceRoute.direction} route with ${stopsWithUpdatedTypes.length} stops.`,
    warnings,
  };
}

/**
 * Check if a corresponding route can be generated from the source route.
 * This is useful for enabling/disabling the auto-generate button.
 */
export function canGenerateRouteFromCorresponding(sourceRoute: Route | undefined): boolean {
  if (!sourceRoute) return false;
  if (!sourceRoute.routeStops || sourceRoute.routeStops.length === 0) return false;
  return true;
}

/**
 * Get the target direction for auto-generation based on current active tab
 */
export function getTargetDirection(activeTab: 'outbound' | 'inbound'): DirectionEnum {
  return activeTab === 'outbound' ? DirectionEnum.OUTBOUND : DirectionEnum.INBOUND;
}

/**
 * Get the source direction for auto-generation based on current active tab
 */
export function getSourceDirection(activeTab: 'outbound' | 'inbound'): DirectionEnum {
  return activeTab === 'outbound' ? DirectionEnum.INBOUND : DirectionEnum.OUTBOUND;
}

/**
 * Find a route by direction from an array of routes
 */
export function findRouteByDirection(
  routes: Route[],
  direction: DirectionEnum
): Route | undefined {
  return routes.find(route => route.direction === direction);
}

/**
 * Find the index of a route by direction from an array of routes
 */
export function findRouteIndexByDirection(
  routes: Route[],
  direction: DirectionEnum
): number {
  return routes.findIndex(route => route.direction === direction);
}
