/**
 * Route Workspace Validation Service
 * 
 * This service provides modular functionality for validating stops and routes
 * in the Route Workspace, including stop existence checks against the backend.
 */

import { BusStopManagementService } from "../../generated/api-clients/route-management";
import { Stop, RouteStop, Location, StopExistenceType } from "@/types/RouteWorkspaceData";

// ============================================================================
// TYPES
// ============================================================================

export interface StopExistenceSearchResult {
    found: boolean;
    stop?: Stop;
    searchedBy: 'id' | 'name';
    searchValue: string;
    error?: string;
}

export interface BulkStopExistenceSearchResult {
    results: Array<{
        stopIndex: number;
        orderNumber: number;
        originalStop: Stop;
        result: StopExistenceSearchResult;
    }>;
    successCount: number;
    notFoundCount: number;
    errorCount: number;
    totalProcessed: number;
}

export interface StopExistenceUpdateData {
    stop: Stop;
    clearIdIfNotFound: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert API location response to frontend Location type
 */
function mapApiLocationToLocation(apiLocation?: {
    latitude?: number;
    longitude?: number;
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
}): Location {
    return {
        latitude: apiLocation?.latitude ?? 0,
        longitude: apiLocation?.longitude ?? 0,
        address: apiLocation?.address,
        city: apiLocation?.city,
        state: apiLocation?.state,
        zipCode: apiLocation?.zipCode,
        country: apiLocation?.country,
        addressSinhala: apiLocation?.addressSinhala,
        citySinhala: apiLocation?.citySinhala,
        stateSinhala: apiLocation?.stateSinhala,
        countrySinhala: apiLocation?.countrySinhala,
        addressTamil: apiLocation?.addressTamil,
        cityTamil: apiLocation?.cityTamil,
        stateTamil: apiLocation?.stateTamil,
        countryTamil: apiLocation?.countryTamil,
    };
}

/**
 * Check if a stop has a valid ID for searching
 */
export function hasValidIdForSearch(stop: Stop): boolean {
    return !!(stop.id && stop.id.trim() !== '');
}

/**
 * Check if a stop has a valid name for searching
 */
export function hasValidNameForSearch(stop: Stop): boolean {
    return !!(stop.name && stop.name.trim() !== '');
}

/**
 * Check if a stop can be searched (has either ID or name)
 */
export function canSearchStop(stop: Stop): boolean {
    return hasValidIdForSearch(stop) || hasValidNameForSearch(stop);
}

// ============================================================================
// SINGLE STOP EXISTENCE SEARCH
// ============================================================================

/**
 * Search for the existence of a single stop by ID or name.
 * ID search takes precedence over name search.
 * 
 * @param stop - The stop to search for
 * @returns Promise<StopExistenceSearchResult> - The search result with stop data if found
 */
export async function searchStopExistence(stop: Stop): Promise<StopExistenceSearchResult> {
    // Determine search criteria: ID takes precedence, then name
    const searchId = hasValidIdForSearch(stop) ? stop.id : undefined;
    const searchName = !searchId && hasValidNameForSearch(stop) ? stop.name : undefined;

    if (!searchId && !searchName) {
        return {
            found: false,
            searchedBy: 'name',
            searchValue: '',
            error: 'No valid search criteria (ID or name) provided'
        };
    }

    try {
        const response = await BusStopManagementService.checkStopExists(searchId, searchName);

        if (response.exists && response.stop) {
            // Stop found - map the API response to frontend Stop type
            const fetchedStop = response.stop;
            
            const mappedStop: Stop = {
                id: fetchedStop.id ?? '',
                name: fetchedStop.name ?? '',
                nameSinhala: fetchedStop.nameSinhala,
                nameTamil: fetchedStop.nameTamil,
                description: fetchedStop.description,
                location: mapApiLocationToLocation(fetchedStop.location),
                isAccessible: fetchedStop.isAccessible,
                type: StopExistenceType.EXISTING
            };

            return {
                found: true,
                stop: mappedStop,
                searchedBy: searchId ? 'id' : 'name',
                searchValue: searchId || searchName || ''
            };
        } else {
            // Stop not found
            return {
                found: false,
                searchedBy: searchId ? 'id' : 'name',
                searchValue: response.searchValue || searchId || searchName || ''
            };
        }
    } catch (error: any) {
        console.error('Error searching for stop existence:', error);
        return {
            found: false,
            searchedBy: searchId ? 'id' : 'name',
            searchValue: searchId || searchName || '',
            error: error.message || 'Failed to search for stop'
        };
    }
}

/**
 * Process the stop existence search result and return updated stop data.
 * If searched by ID and not found, clears the invalid ID.
 * 
 * @param originalStop - The original stop data before search
 * @param result - The search result
 * @returns StopExistenceUpdateData - Updated stop data with existence status
 */
export function processStopExistenceResult(
    originalStop: Stop,
    result: StopExistenceSearchResult
): StopExistenceUpdateData {
    if (result.found && result.stop) {
        // Stop found - return the fetched stop data
        return {
            stop: result.stop,
            clearIdIfNotFound: false
        };
    } else {
        // Stop not found
        // If searched by ID and not found, clear the invalid ID
        const shouldClearId = result.searchedBy === 'id' && !result.found;
        
        return {
            stop: {
                ...originalStop,
                id: shouldClearId ? '' : originalStop.id,
                type: StopExistenceType.NEW // Mark as new since not found in system
            },
            clearIdIfNotFound: shouldClearId
        };
    }
}

// ============================================================================
// BULK STOP EXISTENCE SEARCH
// ============================================================================

/**
 * Search for the existence of multiple stops.
 * This function processes stops sequentially to avoid overwhelming the API.
 * 
 * @param routeStops - Array of route stops to search
 * @param onProgress - Optional callback for progress updates
 * @returns Promise<BulkStopExistenceSearchResult> - Results for all stops
 */
export async function searchAllStopsExistence(
    routeStops: RouteStop[],
    onProgress?: (current: number, total: number, currentStopName: string) => void
): Promise<BulkStopExistenceSearchResult> {
    const results: BulkStopExistenceSearchResult['results'] = [];
    let successCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;

    // Filter stops that can be searched
    const searchableStops = routeStops.filter((rs, index) => {
        const canSearch = canSearchStop(rs.stop);
        if (!canSearch) {
            // Add to results as not searchable
            results.push({
                stopIndex: index,
                orderNumber: rs.orderNumber,
                originalStop: rs.stop,
                result: {
                    found: false,
                    searchedBy: 'name',
                    searchValue: '',
                    error: 'Stop has no ID or name to search'
                }
            });
            errorCount++;
        }
        return canSearch;
    });

    const total = searchableStops.length;

    // Process each searchable stop
    for (let i = 0; i < searchableStops.length; i++) {
        const routeStop = searchableStops[i];
        const actualIndex = routeStops.findIndex(rs => rs.orderNumber === routeStop.orderNumber);
        
        if (onProgress) {
            onProgress(i + 1, total, routeStop.stop.name || `Stop ${routeStop.orderNumber}`);
        }

        const result = await searchStopExistence(routeStop.stop);

        results.push({
            stopIndex: actualIndex,
            orderNumber: routeStop.orderNumber,
            originalStop: routeStop.stop,
            result
        });

        if (result.error) {
            errorCount++;
        } else if (result.found) {
            successCount++;
        } else {
            notFoundCount++;
        }

        // Small delay to avoid overwhelming the API
        if (i < searchableStops.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    // Sort results by stopIndex for consistent ordering
    results.sort((a, b) => a.stopIndex - b.stopIndex);

    return {
        results,
        successCount,
        notFoundCount,
        errorCount,
        totalProcessed: total + errorCount
    };
}

/**
 * Apply bulk search results to route stops.
 * Returns updated route stops array with existence status and data.
 * 
 * @param routeStops - Original route stops array
 * @param searchResults - Bulk search results
 * @returns RouteStop[] - Updated route stops with existence data
 */
export function applyBulkSearchResultsToRouteStops(
    routeStops: RouteStop[],
    searchResults: BulkStopExistenceSearchResult
): RouteStop[] {
    const updatedStops = [...routeStops];

    for (const resultItem of searchResults.results) {
        const { stopIndex, result, originalStop } = resultItem;
        
        if (stopIndex >= 0 && stopIndex < updatedStops.length) {
            const processedResult = processStopExistenceResult(originalStop, result);
            updatedStops[stopIndex] = {
                ...updatedStops[stopIndex],
                stop: processedResult.stop
            };
        }
    }

    return updatedStops;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Get statistics about stop existence in a route
 */
export function getStopExistenceStats(routeStops: RouteStop[]): {
    total: number;
    existing: number;
    new: number;
    withId: number;
    withoutId: number;
} {
    const total = routeStops.length;
    const existing = routeStops.filter(rs => rs.stop.type === StopExistenceType.EXISTING).length;
    const newStops = routeStops.filter(rs => rs.stop.type === StopExistenceType.NEW).length;
    const withId = routeStops.filter(rs => hasValidIdForSearch(rs.stop)).length;
    const withoutId = routeStops.filter(rs => !hasValidIdForSearch(rs.stop)).length;

    return { total, existing, new: newStops, withId, withoutId };
}
