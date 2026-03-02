/**
 * Shared Google Maps Directions Service for Route Workspace
 * 
 * This service consolidates all Google Maps API calls for the route workspace,
 * providing efficient direction fetching with proper chunking for routes with many stops.
 * It also provides caching to avoid redundant API calls when both map and distance
 * calculator need the same data.
 */

import { RouteStop } from '@/types/RouteWorkspaceData';

// Maximum waypoints per request (Google allows 25, but we use 23 for safety margin)
const MAX_WAYPOINTS_PER_REQUEST = 23;

// Cache for directions results to avoid redundant API calls
interface CacheEntry {
  result: RouteDirectionsResult;
  timestamp: number;
  stopsHash: string;
}

// Cache with 5 minute expiry
const CACHE_EXPIRY_MS = 5 * 60 * 1000;
const directionsCache = new Map<string, CacheEntry>();

// Types for the service
export interface ValidStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  originalIndex: number;
}

export interface DirectionsChunk {
  directions: google.maps.DirectionsResult;
  startIndex: number;
  endIndex: number;
}

export interface RouteDirectionsResult {
  /** Combined directions results from all chunks */
  directionsChunks: DirectionsChunk[];
  /** Cumulative distances from start for each stop (indexed by originalIndex) */
  distances: Map<number, number>;
  /** Total route distance in km */
  totalDistanceKm: number;
  /** Total route duration in minutes */
  totalDurationMinutes: number;
  /** All valid stops that were processed */
  validStops: ValidStop[];
}

/**
 * Generate a hash for the stops array to use as cache key
 */
function generateStopsHash(validStops: ValidStop[]): string {
  return validStops
    .map(s => `${s.originalIndex}:${s.lat.toFixed(6)},${s.lng.toFixed(6)}`)
    .join('|');
}

/**
 * Clear expired cache entries
 */
function cleanupCache(): void {
  const now = Date.now();
  for (const [key, entry] of directionsCache.entries()) {
    if (now - entry.timestamp > CACHE_EXPIRY_MS) {
      directionsCache.delete(key);
    }
  }
}

/**
 * Clear all cache entries (useful when stops are modified)
 */
export function clearDirectionsCache(): void {
  directionsCache.clear();
}

/**
 * Extract valid stops with coordinates from route stops
 */
export function extractValidStops(routeStops: RouteStop[]): ValidStop[] {
  return routeStops
    .map((rs, index) => ({
      id: rs.stop?.id || `stop-${index}`,
      name: rs.stop?.name || 'Unnamed Stop',
      lat: rs.stop?.location?.latitude,
      lng: rs.stop?.location?.longitude,
      originalIndex: index,
    }))
    .filter((stop): stop is ValidStop => 
      typeof stop.lat === 'number' && 
      typeof stop.lng === 'number' &&
      !isNaN(stop.lat) && 
      !isNaN(stop.lng) &&
      // Filter out 0,0 coordinates which are default/invalid
      !(stop.lat === 0 && stop.lng === 0)
    );
}

/**
 * Calculate the number of chunks needed for a given number of stops
 */
export function calculateChunkCount(stopCount: number): number {
  if (stopCount <= 2) return 1;
  // Each chunk can have: 1 origin + MAX_WAYPOINTS waypoints + 1 destination
  // So each chunk processes MAX_WAYPOINTS + 2 stops, but the last stop of one chunk
  // becomes the first stop of the next chunk
  const stopsPerChunk = MAX_WAYPOINTS_PER_REQUEST + 1; // +1 because origin of next chunk = destination of previous
  return Math.ceil((stopCount - 1) / stopsPerChunk);
}

/**
 * Fetch directions for a single chunk of stops
 */
async function fetchDirectionsChunk(
  directionsService: google.maps.DirectionsService,
  validStops: ValidStop[],
  startIndex: number,
  endIndex: number
): Promise<DirectionsChunk> {
  const originStop = validStops[startIndex];
  const destinationStop = validStops[endIndex];
  
  // Intermediate stops (waypoints) between origin and destination
  const waypointStops = validStops.slice(startIndex + 1, endIndex);
  const waypoints = waypointStops.map(stop => ({
    location: new google.maps.LatLng(stop.lat, stop.lng),
    stopover: true,
  }));

  const request: google.maps.DirectionsRequest = {
    origin: new google.maps.LatLng(originStop.lat, originStop.lng),
    destination: new google.maps.LatLng(destinationStop.lat, destinationStop.lng),
    waypoints,
    travelMode: google.maps.TravelMode.DRIVING,
  };

  return new Promise((resolve, reject) => {
    directionsService.route(request, (response, status) => {
      if (status === google.maps.DirectionsStatus.OK && response) {
        resolve({
          directions: response,
          startIndex,
          endIndex,
        });
      } else {
        reject(new Error(`Directions request failed: ${status}`));
      }
    });
  });
}

/**
 * Fetch all directions for a route, handling chunking for routes with many stops
 * 
 * This is the main function that should be used by components.
 * It handles:
 * - Routes with any number of stops (chunking for large routes)
 * - Cumulative distance calculation
 * - Duration calculation
 * 
 * @param routeStops - Array of route stops from the workspace context
 * @param onProgress - Optional callback for progress updates (chunk index, total chunks)
 * @returns RouteDirectionsResult with all directions data and calculated distances
 */
export async function fetchRouteDirections(
  routeStops: RouteStop[],
  onProgress?: (currentChunk: number, totalChunks: number) => void,
  options?: { skipCache?: boolean }
): Promise<RouteDirectionsResult> {
  // Validate Google Maps is loaded
  if (typeof window === 'undefined' || !window.google || !window.google.maps) {
    throw new Error('Google Maps API not loaded');
  }

  // Extract valid stops
  const validStops = extractValidStops(routeStops);

  if (validStops.length < 2) {
    throw new Error('At least 2 stops with valid coordinates are required');
  }

  // Check cache first (unless explicitly skipped)
  if (!options?.skipCache) {
    const cacheKey = generateStopsHash(validStops);
    const cachedEntry = directionsCache.get(cacheKey);
    
    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_EXPIRY_MS) {
      console.log('[routeWorkspaceMap] Using cached directions result');
      // Report progress as complete for cached results
      if (onProgress) {
        onProgress(1, 1);
      }
      return cachedEntry.result;
    }
    
    // Cleanup old cache entries periodically
    cleanupCache();
  }

  const directionsService = new google.maps.DirectionsService();
  const directionsChunks: DirectionsChunk[] = [];
  const distances = new Map<number, number>();
  
  // Set first stop distance to 0
  distances.set(validStops[0].originalIndex, 0);

  let cumulativeDistance = 0;
  let totalDuration = 0;
  let currentIndex = 0;

  // Calculate total number of chunks for progress reporting
  const totalChunks = calculateChunkCount(validStops.length);
  let currentChunk = 0;

  // Process stops in chunks
  while (currentIndex < validStops.length - 1) {
    // Calculate the end index for this chunk
    // We can process up to MAX_WAYPOINTS_PER_REQUEST + 1 stops per chunk
    // (1 origin + MAX_WAYPOINTS waypoints + 1 destination = MAX_WAYPOINTS + 2 total stops)
    const remainingStops = validStops.length - currentIndex;
    const stopsInThisChunk = Math.min(remainingStops, MAX_WAYPOINTS_PER_REQUEST + 2);
    const endIndex = currentIndex + stopsInThisChunk - 1;

    // Report progress
    currentChunk++;
    if (onProgress) {
      onProgress(currentChunk, totalChunks);
    }

    // Fetch directions for this chunk
    const chunk = await fetchDirectionsChunk(
      directionsService,
      validStops,
      currentIndex,
      endIndex
    );
    directionsChunks.push(chunk);

    // Process legs to calculate cumulative distances
    const legs = chunk.directions.routes[0].legs;
    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i];
      const distanceInKm = (leg.distance?.value || 0) / 1000;
      const durationInMinutes = (leg.duration?.value || 0) / 60;
      
      cumulativeDistance += distanceInKm;
      totalDuration += durationInMinutes;
      
      // The leg ends at validStops[currentIndex + 1 + i]
      const stopIndex = currentIndex + 1 + i;
      const originalIndex = validStops[stopIndex].originalIndex;
      
      distances.set(originalIndex, parseFloat(cumulativeDistance.toFixed(2)));
    }

    // Move to next chunk (destination becomes origin)
    currentIndex = endIndex;

    // Small delay between chunks to avoid rate limiting
    if (currentIndex < validStops.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  const result: RouteDirectionsResult = {
    directionsChunks,
    distances,
    totalDistanceKm: parseFloat(cumulativeDistance.toFixed(2)),
    totalDurationMinutes: Math.round(totalDuration),
    validStops,
  };

  // Cache the result
  if (!options?.skipCache) {
    const cacheKey = generateStopsHash(validStops);
    directionsCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
      stopsHash: cacheKey,
    });
    console.log('[routeWorkspaceMap] Cached directions result');
  }

  return result;
}

/**
 * Fetch directions optimized for map display
 * 
 * For map rendering, we may want to get the first chunk quickly for immediate display
 * and then fetch remaining chunks in the background.
 * 
 * @param routeStops - Array of route stops
 * @param onChunkReady - Callback when a chunk is ready for rendering
 * @param onComplete - Callback when all chunks are fetched
 */
export async function fetchRouteDirectionsForMap(
  routeStops: RouteStop[],
  onChunkReady: (chunk: DirectionsChunk, isFirst: boolean) => void,
  onComplete?: (result: RouteDirectionsResult) => void,
  onError?: (error: Error) => void
): Promise<void> {
  try {
    const result = await fetchRouteDirections(routeStops, (currentChunk, totalChunks) => {
      // Progress is tracked internally
    });

    // Notify for each chunk
    result.directionsChunks.forEach((chunk, index) => {
      onChunkReady(chunk, index === 0);
    });

    if (onComplete) {
      onComplete(result);
    }
  } catch (error) {
    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)));
    } else {
      throw error;
    }
  }
}

/**
 * Apply calculated distances to route stops
 * 
 * Helper function to update route stops with distances from a RouteDirectionsResult
 */
export function applyDistancesToRouteStops(
  routeStops: RouteStop[],
  distances: Map<number, number>
): RouteStop[] {
  return routeStops.map((stop, index) => {
    const distance = distances.get(index);
    if (distance !== undefined) {
      return {
        ...stop,
        distanceFromStart: distance,
      };
    }
    return stop;
  });
}

/**
 * Generate a custom SVG bullet marker for intermediate stops
 * Returns a data URL that can be used directly as a marker icon
 */
function generateBulletMarkerSvg(color: string, size: number = 12): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${color}" stroke="white" stroke-width="1"/>
  </svg>`;
  
  // Convert SVG to base64 data URL
  const encodedSvg = encodeURIComponent(svg);
  return `data:image/svg+xml,${encodedSvg}`;
}

/**
 * Get marker icon URL based on stop type
 * Start and End stops use Google Maps location pins
 * Intermediate stops use custom small bullet markers
 */
export function getMarkerIconUrl(type: 'start' | 'end' | 'intermediate'): string {
  const icons = {
    start: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
    end: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
    intermediate: generateBulletMarkerSvg('#3b82f6', 12), // Blue bullet for intermediate stops
  };
  return icons[type];
}

/**
 * Determine stop type based on index
 */
export function getStopType(index: number, totalStops: number): 'start' | 'end' | 'intermediate' {
  if (index === 0) return 'start';
  if (index === totalStops - 1) return 'end';
  return 'intermediate';
}

/**
 * Calculate center point from an array of stops
 */
export function calculateCenter(validStops: ValidStop[]): { lat: number; lng: number } {
  if (validStops.length === 0) {
    return { lat: 6.9271, lng: 79.8612 }; // Default to Colombo
  }
  
  const avgLat = validStops.reduce((sum, stop) => sum + stop.lat, 0) / validStops.length;
  const avgLng = validStops.reduce((sum, stop) => sum + stop.lng, 0) / validStops.length;
  
  return { lat: avgLat, lng: avgLng };
}

// ============================================================================
// COORDINATE FETCHING FUNCTIONS
// ============================================================================

/**
 * Stop with name for geocoding/directions coordinate extraction
 */
export interface StopForCoordinateFetch {
  index: number;
  name: string;
  hasCoordinates: boolean;
  lat?: number;
  lng?: number;
}

/**
 * Result from coordinate fetching operation
 */
export interface CoordinateFetchResult {
  /** Coordinates indexed by original stop index */
  coordinates: Map<number, { lat: number; lng: number }>;
  /** Stops that failed to get coordinates */
  failedStops: { index: number; name: string; error: string }[];
  /** Total stops processed */
  totalProcessed: number;
  /** Successful coordinate fetches */
  successCount: number;
}

/**
 * Extract stops information for coordinate fetching
 */
export function extractStopsForCoordinateFetch(routeStops: RouteStop[]): StopForCoordinateFetch[] {
  return routeStops.map((rs, index) => ({
    index,
    name: rs.stop?.name || '',
    hasCoordinates: !!(
      rs.stop?.location?.latitude && 
      rs.stop?.location?.longitude &&
      !isNaN(rs.stop.location.latitude) &&
      !isNaN(rs.stop.location.longitude)
    ),
    lat: rs.stop?.location?.latitude,
    lng: rs.stop?.location?.longitude,
  }));
}

/**
 * Fetch coordinates for all stops using Google Maps Directions API
 * 
 * This approach uses stop names as waypoints in a directions request.
 * Google's Directions API will geocode the names and return the route with coordinates.
 * 
 * @param routeStops - Array of route stops
 * @param onProgress - Progress callback (current chunk, total chunks)
 * @returns CoordinateFetchResult with coordinates for each stop
 */
export async function fetchAllStopCoordinates(
  routeStops: RouteStop[],
  onProgress?: (currentChunk: number, totalChunks: number) => void
): Promise<CoordinateFetchResult> {
  if (typeof window === 'undefined' || !window.google || !window.google.maps) {
    throw new Error('Google Maps API not loaded');
  }

  const stopsInfo = extractStopsForCoordinateFetch(routeStops);
  const stopsWithNames = stopsInfo.filter(s => s.name.trim() !== '');

  if (stopsWithNames.length < 2) {
    throw new Error('At least 2 stops with names are required to fetch coordinates');
  }

  const coordinates = new Map<number, { lat: number; lng: number }>();
  const failedStops: { index: number; name: string; error: string }[] = [];
  const directionsService = new google.maps.DirectionsService();

  // Calculate chunks needed
  // Each chunk: 1 origin + up to MAX_WAYPOINTS waypoints + 1 destination
  const totalChunks = Math.ceil((stopsWithNames.length - 1) / (MAX_WAYPOINTS_PER_REQUEST + 1));
  let currentChunk = 0;
  let currentIndex = 0;

  while (currentIndex < stopsWithNames.length - 1) {
    const remainingStops = stopsWithNames.length - currentIndex;
    const stopsInThisChunk = Math.min(remainingStops, MAX_WAYPOINTS_PER_REQUEST + 2);
    const endIndex = currentIndex + stopsInThisChunk - 1;

    currentChunk++;
    if (onProgress) {
      onProgress(currentChunk, totalChunks);
    }

    const originStop = stopsWithNames[currentIndex];
    const destinationStop = stopsWithNames[endIndex];
    const waypointStops = stopsWithNames.slice(currentIndex + 1, endIndex);

    // Build waypoints using stop names - Sri Lanka context for better geocoding
    const waypoints = waypointStops.map(stop => ({
      location: `${stop.name}, Sri Lanka`,
      stopover: true,
    }));

    const request: google.maps.DirectionsRequest = {
      origin: `${originStop.name}, Sri Lanka`,
      destination: `${destinationStop.name}, Sri Lanka`,
      waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
    };

    try {
      const response = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route(request, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            resolve(result);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        });
      });

      // Extract coordinates from the response
      const legs = response.routes[0].legs;
      
      // First stop in this chunk (origin)
      const originLocation = legs[0].start_location;
      coordinates.set(originStop.index, {
        lat: originLocation.lat(),
        lng: originLocation.lng(),
      });

      // Process each leg's end location (waypoints + destination)
      for (let i = 0; i < legs.length; i++) {
        const stopIndex = currentIndex + 1 + i;
        const stop = stopsWithNames[stopIndex];
        const endLocation = legs[i].end_location;
        
        coordinates.set(stop.index, {
          lat: endLocation.lat(),
          lng: endLocation.lng(),
        });
      }
    } catch (error) {
      // Mark all stops in this chunk as failed
      const chunkStops = stopsWithNames.slice(currentIndex, endIndex + 1);
      for (const stop of chunkStops) {
        if (!coordinates.has(stop.index)) {
          failedStops.push({
            index: stop.index,
            name: stop.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    // Move to next chunk
    currentIndex = endIndex;

    // Delay between chunks to avoid rate limiting
    if (currentIndex < stopsWithNames.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  // Clear directions cache since coordinates changed
  clearDirectionsCache();

  return {
    coordinates,
    failedStops,
    totalProcessed: stopsWithNames.length,
    successCount: coordinates.size,
  };
}

/**
 * Fetch coordinates for stops that are missing coordinates
 * 
 * This uses a hybrid approach:
 * - Uses existing coordinates as anchors
 * - Creates directions requests that include stops with names but no coordinates
 * - Extracts coordinates from the directions response
 * 
 * @param routeStops - Array of route stops
 * @param onProgress - Progress callback
 * @returns CoordinateFetchResult with coordinates for missing stops
 */
export async function fetchMissingStopCoordinates(
  routeStops: RouteStop[],
  onProgress?: (currentChunk: number, totalChunks: number) => void
): Promise<CoordinateFetchResult> {
  if (typeof window === 'undefined' || !window.google || !window.google.maps) {
    throw new Error('Google Maps API not loaded');
  }

  const stopsInfo = extractStopsForCoordinateFetch(routeStops);
  const stopsWithCoordinates = stopsInfo.filter(s => s.hasCoordinates);
  const stopsWithoutCoordinates = stopsInfo.filter(s => !s.hasCoordinates && s.name.trim() !== '');

  if (stopsWithoutCoordinates.length === 0) {
    return {
      coordinates: new Map(),
      failedStops: [],
      totalProcessed: 0,
      successCount: 0,
    };
  }

  if (stopsWithCoordinates.length === 0) {
    throw new Error('At least one stop with coordinates is required to fetch missing coordinates. Use "Fetch All Coordinates" instead.');
  }

  const coordinates = new Map<number, { lat: number; lng: number }>();
  const failedStops: { index: number; name: string; error: string }[] = [];
  const directionsService = new google.maps.DirectionsService();

  // Build segments: each segment starts and ends with a stop that has coordinates
  // and includes stops without coordinates in between as waypoints by name
  const segments: {
    startStop: StopForCoordinateFetch;
    endStop: StopForCoordinateFetch;
    missingStops: StopForCoordinateFetch[];
  }[] = [];

  let currentSegmentStart: StopForCoordinateFetch | null = null;
  let currentMissingStops: StopForCoordinateFetch[] = [];

  for (let i = 0; i < stopsInfo.length; i++) {
    const stop = stopsInfo[i];
    
    if (stop.hasCoordinates) {
      if (currentSegmentStart && currentMissingStops.length > 0) {
        // End current segment
        segments.push({
          startStop: currentSegmentStart,
          endStop: stop,
          missingStops: [...currentMissingStops],
        });
        currentMissingStops = [];
      }
      currentSegmentStart = stop;
    } else if (stop.name.trim() !== '') {
      currentMissingStops.push(stop);
    }
  }

  // Handle edge case: missing stops after the last coordinate
  if (currentMissingStops.length > 0 && currentSegmentStart) {
    // Use the last known coordinate stop as both start and try to geocode
    // Or if there's a stop after with coordinates, create a segment
    // For now, we'll try to geocode these individually
    for (const missingStop of currentMissingStops) {
      try {
        const geocoder = new google.maps.Geocoder();
        const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
          geocoder.geocode({ address: `${missingStop.name}, Sri Lanka` }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
              resolve(results);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          });
        });
        
        const location = result[0].geometry.location;
        coordinates.set(missingStop.index, {
          lat: location.lat(),
          lng: location.lng(),
        });
      } catch (error) {
        failedStops.push({
          index: missingStop.index,
          name: missingStop.name,
          error: error instanceof Error ? error.message : 'Geocoding failed',
        });
      }
      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // Calculate total chunks for progress
  const totalChunks = segments.reduce((acc, segment) => {
    return acc + Math.ceil(segment.missingStops.length / MAX_WAYPOINTS_PER_REQUEST);
  }, 0);
  let currentChunk = 0;

  // Process each segment
  for (const segment of segments) {
    const { startStop, endStop, missingStops } = segment;

    // Process missing stops in chunks
    let chunkStart = 0;
    while (chunkStart < missingStops.length) {
      const chunkEnd = Math.min(chunkStart + MAX_WAYPOINTS_PER_REQUEST, missingStops.length);
      const chunkMissingStops = missingStops.slice(chunkStart, chunkEnd);

      currentChunk++;
      if (onProgress) {
        onProgress(currentChunk, totalChunks || 1);
      }

      // Build waypoints from missing stops (by name)
      const waypoints = chunkMissingStops.map(stop => ({
        location: `${stop.name}, Sri Lanka`,
        stopover: true,
      }));

      const request: google.maps.DirectionsRequest = {
        origin: new google.maps.LatLng(startStop.lat!, startStop.lng!),
        destination: new google.maps.LatLng(endStop.lat!, endStop.lng!),
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
      };

      try {
        const response = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          directionsService.route(request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              resolve(result);
            } else {
              reject(new Error(`Directions request failed: ${status}`));
            }
          });
        });

        // Extract coordinates from waypoints in the response
        // The response has legs where each leg ends at a waypoint or destination
        const legs = response.routes[0].legs;
        
        // Each leg (except the last) ends at a waypoint
        for (let i = 0; i < chunkMissingStops.length; i++) {
          const missingStop = chunkMissingStops[i];
          // Leg i ends at waypoint i (0-indexed)
          const endLocation = legs[i].end_location;
          
          coordinates.set(missingStop.index, {
            lat: endLocation.lat(),
            lng: endLocation.lng(),
          });
        }
      } catch (error) {
        // Mark all missing stops in this chunk as failed
        for (const stop of chunkMissingStops) {
          failedStops.push({
            index: stop.index,
            name: stop.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      chunkStart = chunkEnd;

      // Delay between chunks
      if (chunkStart < missingStops.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    // Delay between segments
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Clear directions cache since coordinates changed
  clearDirectionsCache();

  return {
    coordinates,
    failedStops,
    totalProcessed: stopsWithoutCoordinates.length,
    successCount: coordinates.size,
  };
}

/**
 * Apply fetched coordinates to route stops
 */
export function applyCoordinatesToRouteStops(
  routeStops: RouteStop[],
  coordinates: Map<number, { lat: number; lng: number }>
): RouteStop[] {
  return routeStops.map((routeStop, index) => {
    const coord = coordinates.get(index);
    if (coord) {
      return {
        ...routeStop,
        stop: {
          ...routeStop.stop,
          location: {
            ...routeStop.stop.location,
            latitude: coord.lat,
            longitude: coord.lng,
          },
        },
      };
    }
    return routeStop;
  });
}
