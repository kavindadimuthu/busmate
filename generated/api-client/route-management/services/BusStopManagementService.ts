/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PageStopResponse } from '../models/PageStopResponse';
import type { RouteGroupStopDetailResponse } from '../models/RouteGroupStopDetailResponse';
import type { RouteStopDetailResponse } from '../models/RouteStopDetailResponse';
import type { ScheduleStopDetailResponse } from '../models/ScheduleStopDetailResponse';
import type { StopBulkUpdateResponse } from '../models/StopBulkUpdateResponse';
import type { StopExistsResponse } from '../models/StopExistsResponse';
import type { StopFilterOptionsResponse } from '../models/StopFilterOptionsResponse';
import type { StopImportResponse } from '../models/StopImportResponse';
import type { StopRequest } from '../models/StopRequest';
import type { StopResponse } from '../models/StopResponse';
import type { StopStatisticsResponse } from '../models/StopStatisticsResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BusStopManagementService {
    /**
     * Get all stops with pagination, sorting, and search
     * Retrieve all stops with optional pagination, sorting, and multi-column search. Search is performed across name, address, city, and state columns. Default: page=0, size=10, sort=name
     * @param page Page number (0-based)
     * @param size Page size (max 100)
     * @param sortBy Sort by field name (name, createdAt, updatedAt, city, state)
     * @param sortDir Sort direction (asc or desc)
     * @param search Search text to filter stops by name, address, city, or state
     * @returns PageStopResponse Stops retrieved successfully
     * @throws ApiError
     */
    public static getAllStops(
        page?: number,
        size: number = 10,
        sortBy: string = 'name',
        sortDir: string = 'asc',
        search?: string,
    ): CancelablePromise<PageStopResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/stops',
            query: {
                'page': page,
                'size': size,
                'sortBy': sortBy,
                'sortDir': sortDir,
                'search': search,
            },
            errors: {
                400: `Invalid pagination or sorting parameters`,
            },
        });
    }
    /**
     * Create a new bus stop
     * Creates a new bus stop with the provided details. Requires authentication.
     * @param requestBody
     * @returns StopResponse Stop created successfully
     * @throws ApiError
     */
    public static createStop(
        requestBody: StopRequest,
    ): CancelablePromise<StopResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/stops',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid input data`,
                401: `Unauthorized`,
                409: `Stop already exists in the same city`,
            },
        });
    }
    /**
     * Get all stops without pagination
     * Retrieve all stops as a simple list without pagination. Use this endpoint carefully as it returns all stops at once.
     * @returns StopResponse All stops retrieved successfully
     * @throws ApiError
     */
    public static getAllStopsAsList(): CancelablePromise<Array<StopResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/stops/all',
        });
    }
    /**
     * Check if a stop exists by ID or name
     * Check if a bus stop exists in the system by providing either an ID or a name. If the stop is found, its full data is returned. Priority: ID takes precedence over name if both are provided. Name search matches against English, Sinhala, and Tamil name variants (case-insensitive). Note: In a future implementation, this will support checking by both name and city for more precise matching.
     * @param id Stop ID (UUID format)
     * @param name Stop name (English, Sinhala, or Tamil)
     * @returns StopExistsResponse Check completed - exists field indicates if stop was found
     * @throws ApiError
     */
    public static checkStopExists(
        id?: string,
        name?: string,
    ): CancelablePromise<StopExistsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/stops/exists',
            query: {
                'id': id,
                'name': name,
            },
            errors: {
                400: `Neither ID nor name provided`,
            },
        });
    }
    /**
     * Export stops with flexible filtering and format options
     * Export stops to CSV or JSON format with highly flexible filtering options. Supports exporting all stops, filtering by city/state/country, specific IDs, accessibility, and custom field selection. Perfect for bulk operations like route imports where you need stop IDs to replace in external datasets. The exported file includes comprehensive metadata about applied filters and export options for audit purposes.
     * @param exportAll Export all stops (ignores other filters if true)
     * @param stopIds Specific stop IDs to export (comma-separated)
     * @param cities Filter by cities (comma-separated)
     * @param states Filter by states (comma-separated)
     * @param countries Filter by countries (comma-separated)
     * @param isAccessible Filter by accessibility status
     * @param searchText Search text to filter stops by name, address, city, or state in all languages
     * @param format Export format
     * @param includeMultiLanguageFields Include multi-language fields (name_sinhala, name_tamil, etc.)
     * @param includeLocationDetails Include detailed location information (address, coordinates, etc.)
     * @param includeTimestamps Include timestamp information (createdAt, updatedAt)
     * @param includeUserInfo Include user information (createdBy, updatedBy)
     * @param customFields Custom field selection (comma-separated, if specified only these fields will be exported)
     * @returns string Export completed successfully - returns file content with metadata
     * @throws ApiError
     */
    public static exportStops(
        exportAll: boolean = false,
        stopIds?: Array<string>,
        cities?: Array<string>,
        states?: Array<string>,
        countries?: Array<string>,
        isAccessible?: boolean,
        searchText?: string,
        format: 'CSV' | 'JSON' = 'CSV',
        includeMultiLanguageFields: boolean = true,
        includeLocationDetails: boolean = true,
        includeTimestamps: boolean = false,
        includeUserInfo: boolean = false,
        customFields?: Array<string>,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/stops/export',
            query: {
                'exportAll': exportAll,
                'stopIds': stopIds,
                'cities': cities,
                'states': states,
                'countries': countries,
                'isAccessible': isAccessible,
                'searchText': searchText,
                'format': format,
                'includeMultiLanguageFields': includeMultiLanguageFields,
                'includeLocationDetails': includeLocationDetails,
                'includeTimestamps': includeTimestamps,
                'includeUserInfo': includeUserInfo,
                'customFields': customFields,
            },
            errors: {
                400: `Invalid export request parameters`,
                401: `Unauthorized - authentication required`,
                500: `Internal server error during export processing`,
            },
        });
    }
    /**
     * Get all filter options for stops
     * Retrieve all available filter options including states, cities, countries, and accessibility statuses. This consolidated endpoint provides all filter data needed by the UI in a single call, improving performance and user experience. Also includes metadata about the available options.
     * @returns StopFilterOptionsResponse Filter options retrieved successfully
     * @throws ApiError
     */
    public static getFilterOptions1(): CancelablePromise<StopFilterOptionsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/stops/filters/options',
        });
    }
    /**
     * Import stops from CSV file
     * Dynamically import stops from CSV files with flexible field combinations. The system automatically detects available fields and processes any combination: Required: At least one name field (name, name_sinhala, or name_tamil). Optional: description, coordinates (lat/lng), address fields (all languages), city/state/country (all languages), zipCode, isAccessible. Mixed data supported - different rows can have different field combinations. Requires authentication.
     * @param defaultCountry Default country for stops when not specified in CSV
     * @param formData
     * @returns StopImportResponse Import completed (check response for detailed results including imported stop IDs)
     * @throws ApiError
     */
    public static importStops(
        defaultCountry: string = 'Sri Lanka',
        formData?: {
            /**
             * CSV file containing stop data (supports multiple formats)
             */
            file: Blob;
        },
    ): CancelablePromise<StopImportResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/stops/import',
            query: {
                'defaultCountry': defaultCountry,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Invalid file format or content`,
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Download CSV import template
     * Download flexible CSV template examples showing various field combinations supported. The system dynamically processes any combination of available fields.
     * @param format Template type: 'minimal' (name only), 'multilingual' (name variants), 'location' (with coordinates), 'full' (all fields)
     * @returns string Template downloaded successfully
     * @throws ApiError
     */
    public static downloadStopImportTemplate(
        format: string = 'full',
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/stops/import/template',
            query: {
                'format': format,
            },
        });
    }
    /**
     * Bulk update stops from CSV file
     * Update multiple bus stops at once using a CSV file. Supports flexible matching strategies (ID, name+city, or auto), partial updates, conflict resolution, and creation of missing stops. The CSV should contain the same fields as the export format. Returns detailed results including success/failure counts and specific error information.
     * @param updateStrategy Update strategy for handling conflicts
     * @param matchingStrategy Strategy for matching existing stops
     * @param createMissing Whether to create new stops if they don't exist
     * @param partialUpdate Whether to perform partial updates (only non-empty CSV fields)
     * @param defaultCountry Default country to use if not specified in CSV
     * @param validateCoordinates Whether to validate geographical coordinates
     * @param formData
     * @returns StopBulkUpdateResponse Bulk update completed (check response for individual results)
     * @throws ApiError
     */
    public static bulkUpdateStops(
        updateStrategy: 'SKIP_CONFLICTS' | 'UPDATE_ALL' | 'UPDATE_IF_NEWER' = 'UPDATE_ALL',
        matchingStrategy: 'ID' | 'NAME_AND_CITY' | 'AUTO' = 'AUTO',
        createMissing: boolean = false,
        partialUpdate: boolean = false,
        defaultCountry?: string,
        validateCoordinates: boolean = true,
        formData?: {
            /**
             * CSV file containing stops to update
             */
            file: Blob;
        },
    ): CancelablePromise<StopBulkUpdateResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/stops/import/upsert',
            query: {
                'updateStrategy': updateStrategy,
                'matchingStrategy': matchingStrategy,
                'createMissing': createMissing,
                'partialUpdate': partialUpdate,
                'defaultCountry': defaultCountry,
                'validateCoordinates': validateCoordinates,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Invalid file format or request parameters`,
                401: `Unauthorized`,
                413: `File too large`,
                415: `Unsupported file type`,
            },
        });
    }
    /**
     * Get stops for all routes in a route group
     * Retrieve all stops for all routes within a specific route group, ordered by route name and stop order. Each stop includes both stop details and route information to distinguish stops across different routes.
     * @param routeGroupId Route Group ID
     * @returns RouteGroupStopDetailResponse Route group stops retrieved successfully
     * @throws ApiError
     */
    public static getStopsByRouteGroup(
        routeGroupId: string,
    ): CancelablePromise<Array<RouteGroupStopDetailResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/stops/route-group/{routeGroupId}',
            path: {
                'routeGroupId': routeGroupId,
            },
            errors: {
                400: `Invalid route group ID format`,
                404: `Route group not found`,
            },
        });
    }
    /**
     * Get stops along a route
     * Retrieve all stops in correct order for a specific route with details including distances.
     * @param routeId Route ID
     * @returns RouteStopDetailResponse Route stops retrieved successfully
     * @throws ApiError
     */
    public static getStopsByRoute(
        routeId: string,
    ): CancelablePromise<Array<RouteStopDetailResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/stops/route/{routeId}',
            path: {
                'routeId': routeId,
            },
            errors: {
                400: `Invalid route ID format`,
                404: `Route not found`,
            },
        });
    }
    /**
     * Get stops with schedule timings
     * Retrieve all stops in correct order for a specific schedule with arrival/departure times and details.
     * @param scheduleId Schedule ID
     * @returns ScheduleStopDetailResponse Schedule stops retrieved successfully
     * @throws ApiError
     */
    public static getStopsWithScheduleBySchedule(
        scheduleId: string,
    ): CancelablePromise<Array<ScheduleStopDetailResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/stops/schedule/{scheduleId}',
            path: {
                'scheduleId': scheduleId,
            },
            errors: {
                400: `Invalid schedule ID format`,
                404: `Schedule not found`,
            },
        });
    }
    /**
     * Get stop statistics
     * Retrieve comprehensive stop statistics for dashboard KPI cards including counts, distributions, accessibility metrics, and geographical information.
     * @returns StopStatisticsResponse Statistics retrieved successfully
     * @throws ApiError
     */
    public static getStopStatistics(): CancelablePromise<StopStatisticsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/stops/statistics',
        });
    }
    /**
     * Get stop by ID
     * Retrieve a specific bus stop by its unique identifier.
     * @param id Stop ID
     * @returns StopResponse Stop found and retrieved successfully
     * @throws ApiError
     */
    public static getStopById(
        id: string,
    ): CancelablePromise<StopResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/stops/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Invalid UUID format`,
                404: `Stop not found`,
            },
        });
    }
    /**
     * Update an existing stop
     * Update an existing bus stop with new details. Requires authentication.
     * @param id Stop ID
     * @param requestBody
     * @returns StopResponse Stop updated successfully
     * @throws ApiError
     */
    public static updateStop(
        id: string,
        requestBody: StopRequest,
    ): CancelablePromise<StopResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/stops/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid input data`,
                401: `Unauthorized`,
                404: `Stop not found`,
                409: `Stop name already exists in the same city`,
            },
        });
    }
    /**
     * Delete a stop
     * Permanently delete a bus stop. This action cannot be undone. Requires authentication.
     * @param id Stop ID
     * @returns void
     * @throws ApiError
     */
    public static deleteStop(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/stops/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Invalid UUID format`,
                401: `Unauthorized`,
                404: `Stop not found`,
            },
        });
    }
}
