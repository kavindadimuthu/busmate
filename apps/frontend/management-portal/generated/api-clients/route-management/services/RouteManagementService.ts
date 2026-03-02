/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PageRouteGroupResponse } from '../models/PageRouteGroupResponse';
import type { PageRouteResponse } from '../models/PageRouteResponse';
import type { RouteFilterOptionsResponse } from '../models/RouteFilterOptionsResponse';
import type { RouteGroupRequest } from '../models/RouteGroupRequest';
import type { RouteGroupResponse } from '../models/RouteGroupResponse';
import type { RouteResponse } from '../models/RouteResponse';
import type { RouteStatisticsResponse } from '../models/RouteStatisticsResponse';
import type { RouteUnifiedImportResponse } from '../models/RouteUnifiedImportResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RouteManagementService {
    /**
     * Get all routes with pagination, sorting, filtering, and search
     * Retrieve all routes with optional pagination, sorting, multi-column search, and advanced filtering. Search is performed across route name, description, route group name, start stop name, and end stop name. Default: page=0, size=10, sort=name
     * @param page Page number (0-based)
     * @param size Page size (max 100)
     * @param sortBy Sort by field name (name, createdAt, updatedAt, distanceKm, estimatedDurationMinutes)
     * @param sortDir Sort direction (asc or desc)
     * @param search Search text to filter routes by name, description, route group name, start/end stop names
     * @param routeGroupId Filter by route group ID
     * @param direction Filter by direction (INBOUND or OUTBOUND)
     * @param roadType Filter by road type (NORMALWAY or EXPRESSWAY)
     * @param minDistance Minimum distance in kilometers
     * @param maxDistance Maximum distance in kilometers
     * @param minDuration Minimum estimated duration in minutes
     * @param maxDuration Maximum estimated duration in minutes
     * @returns PageRouteResponse Routes retrieved successfully
     * @throws ApiError
     */
    public static getAllRoutes(
        page?: number,
        size: number = 10,
        sortBy: string = 'name',
        sortDir: string = 'asc',
        search?: string,
        routeGroupId?: string,
        direction?: 'OUTBOUND' | 'INBOUND',
        roadType?: 'NORMALWAY' | 'EXPRESSWAY',
        minDistance?: number,
        maxDistance?: number,
        minDuration?: number,
        maxDuration?: number,
    ): CancelablePromise<PageRouteResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/routes',
            query: {
                'page': page,
                'size': size,
                'sortBy': sortBy,
                'sortDir': sortDir,
                'search': search,
                'routeGroupId': routeGroupId,
                'direction': direction,
                'roadType': roadType,
                'minDistance': minDistance,
                'maxDistance': maxDistance,
                'minDuration': minDuration,
                'maxDuration': maxDuration,
            },
            errors: {
                400: `Invalid pagination, sorting, or filtering parameters`,
            },
        });
    }
    /**
     * Get all routes without pagination
     * Retrieve all routes as a simple list without pagination. Use this endpoint carefully as it returns all routes at once.
     * @returns RouteResponse All routes retrieved successfully
     * @throws ApiError
     */
    public static getAllRoutesAsList(): CancelablePromise<Array<RouteResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/routes/all',
        });
    }
    /**
     * Export routes in CSV format with rich filtering and two distinct modes
     * Export routes data exclusively in CSV format with comprehensive filtering options and two distinct export modes:
     *
     * **MODE 1 - ROUTE_ONLY**: One row per route containing only start and end stop information.
     * **MODE 2 - ROUTE_WITH_ALL_STOPS**: One row per stop (multiple rows per route) including all intermediate stops.
     *
     * Supports extensive filtering by route attributes, stop criteria, text search, and customizable field inclusion. Perfect for system integrations, BI dashboards, schedule imports, and route database migrations. All exports include UUIDs for efficient data integration.
     * @param exportAll Export all routes (ignores other filters if true)
     * @param routeIds Specific route IDs to export (comma-separated)
     * @param routeGroupIds Filter by route group IDs (comma-separated)
     * @param travelsThroughStopIds Filter by stops that routes travel through (comma-separated)
     * @param startStopIds Filter by start stop IDs (comma-separated)
     * @param endStopIds Filter by end stop IDs (comma-separated)
     * @param directions Filter by direction (UP, DOWN) - comma-separated
     * @param roadTypes Filter by road type (NORMALWAY, EXPRESSWAY) - comma-separated
     * @param minDistanceKm Filter by minimum distance in kilometers
     * @param maxDistanceKm Filter by maximum distance in kilometers
     * @param minDurationMinutes Filter by minimum estimated duration in minutes
     * @param maxDurationMinutes Filter by maximum estimated duration in minutes
     * @param searchText Search text to filter routes by name, route number, or description in all languages
     * @param exportMode Export mode - determines CSV structure
     * @param format Export format
     * @param includeMultiLanguageFields Include multi-language fields (name_sinhala, name_tamil, etc.)
     * @param includeRouteGroupInfo Include route group information
     * @param includeAuditFields Include audit fields (created_at, updated_at, created_by, updated_by)
     * @param customFields Custom fields to include in export (comma-separated, if specified only these fields will be exported)
     * @returns string CSV export completed successfully with comprehensive metadata
     * @throws ApiError
     */
    public static exportRoutes(
        exportAll: boolean = false,
        routeIds?: Array<string>,
        routeGroupIds?: Array<string>,
        travelsThroughStopIds?: Array<string>,
        startStopIds?: Array<string>,
        endStopIds?: Array<string>,
        directions?: Array<string>,
        roadTypes?: Array<string>,
        minDistanceKm?: number,
        maxDistanceKm?: number,
        minDurationMinutes?: number,
        maxDurationMinutes?: number,
        searchText?: string,
        exportMode: 'ROUTE_ONLY' | 'ROUTE_WITH_ALL_STOPS' = 'ROUTE_ONLY',
        format: 'CSV' | 'JSON' = 'CSV',
        includeMultiLanguageFields: boolean = true,
        includeRouteGroupInfo: boolean = true,
        includeAuditFields: boolean = false,
        customFields?: Array<string>,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/routes/export',
            query: {
                'exportAll': exportAll,
                'routeIds': routeIds,
                'routeGroupIds': routeGroupIds,
                'travelsThroughStopIds': travelsThroughStopIds,
                'startStopIds': startStopIds,
                'endStopIds': endStopIds,
                'directions': directions,
                'roadTypes': roadTypes,
                'minDistanceKm': minDistanceKm,
                'maxDistanceKm': maxDistanceKm,
                'minDurationMinutes': minDurationMinutes,
                'maxDurationMinutes': maxDurationMinutes,
                'searchText': searchText,
                'exportMode': exportMode,
                'format': format,
                'includeMultiLanguageFields': includeMultiLanguageFields,
                'includeRouteGroupInfo': includeRouteGroupInfo,
                'includeAuditFields': includeAuditFields,
                'customFields': customFields,
            },
            errors: {
                400: `Invalid export request parameters or validation errors`,
                401: `Unauthorized - authentication required`,
                500: `Internal server error during CSV generation`,
            },
        });
    }
    /**
     * Get all route filter options
     * Retrieve all filter options in one consolidated response including directions, route groups, distance range, and duration range. This endpoint provides everything needed for the UI filtering functionality in a single API call.
     * @returns RouteFilterOptionsResponse All filter options retrieved successfully
     * @throws ApiError
     */
    public static getRouteFilterOptions(): CancelablePromise<RouteFilterOptionsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/routes/filters/options',
        });
    }
    /**
     * Get all route groups with pagination, sorting, and search
     * Retrieve all route groups with optional pagination, sorting, and multi-column search. Search is performed across name and description columns. Default: page=0, size=10, sort=name
     * @param page Page number (0-based)
     * @param size Page size (max 100)
     * @param sortBy Sort by field name (name, createdAt, updatedAt)
     * @param sortDir Sort direction (asc or desc)
     * @param search Search text to filter route groups by name or description
     * @returns PageRouteGroupResponse Route groups retrieved successfully
     * @throws ApiError
     */
    public static getAllRouteGroups(
        page?: number,
        size: number = 10,
        sortBy: string = 'name',
        sortDir: string = 'asc',
        search?: string,
    ): CancelablePromise<PageRouteGroupResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/routes/groups',
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
     * Create a new route group
     * Creates a new route group with the provided details and optional routes. Requires authentication.
     * @param requestBody
     * @returns RouteGroupResponse Route group created successfully
     * @throws ApiError
     */
    public static createRouteGroup(
        requestBody: RouteGroupRequest,
    ): CancelablePromise<RouteGroupResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/routes/groups',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid input data`,
                401: `Unauthorized`,
                409: `Route group already exists`,
            },
        });
    }
    /**
     * Get all route groups without pagination
     * Retrieve all route groups as a simple list without pagination. Use this endpoint carefully as it returns all route groups at once.
     * @returns RouteGroupResponse All route groups retrieved successfully
     * @throws ApiError
     */
    public static getAllRouteGroupsAsList(): CancelablePromise<Array<RouteGroupResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/routes/groups/all',
        });
    }
    /**
     * Get route group by ID
     * Retrieve a specific route group by its unique identifier.
     * @param id Route Group ID
     * @returns RouteGroupResponse Route group found and retrieved successfully
     * @throws ApiError
     */
    public static getRouteGroupById(
        id: string,
    ): CancelablePromise<RouteGroupResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/routes/groups/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Invalid UUID format`,
                404: `Route group not found`,
            },
        });
    }
    /**
     * Update an existing route group
     * Update an existing route group with new details. Requires authentication.
     * @param id Route Group ID
     * @param requestBody
     * @returns RouteGroupResponse Route group updated successfully
     * @throws ApiError
     */
    public static updateRouteGroup(
        id: string,
        requestBody: RouteGroupRequest,
    ): CancelablePromise<RouteGroupResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/routes/groups/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid input data`,
                401: `Unauthorized`,
                404: `Route group not found`,
                409: `Route group name already exists`,
            },
        });
    }
    /**
     * Delete a route group
     * Permanently delete a route group and all its associated routes. This action cannot be undone. Requires authentication.
     * @param id Route Group ID
     * @returns void
     * @throws ApiError
     */
    public static deleteRouteGroup(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/routes/groups/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Invalid UUID format`,
                401: `Unauthorized`,
                404: `Route group not found`,
            },
        });
    }
    /**
     * Import complete route data from unified CSV file
     * Import route groups, routes, and route stops from a single CSV file with flexible options. CSV format includes all route-related entities in one row. Supports intelligent duplicate handling, validation options, and partial imports. The CSV should include columns for route group, route, and route stop information.
     * @param routeGroupDuplicateStrategy Import options for handling duplicates and validation
     * @param routeDuplicateStrategy
     * @param validateStopsExist
     * @param createMissingStops
     * @param allowPartialRouteStops
     * @param validateCoordinates
     * @param continueOnError
     * @param defaultRoadType
     * @param formData
     * @returns RouteUnifiedImportResponse Import completed (check response for detailed results)
     * @throws ApiError
     */
    public static importRoutesUnified(
        routeGroupDuplicateStrategy: string = 'REUSE',
        routeDuplicateStrategy: string = 'SKIP',
        validateStopsExist: boolean = true,
        createMissingStops: boolean = false,
        allowPartialRouteStops: boolean = true,
        validateCoordinates: boolean = false,
        continueOnError: boolean = true,
        defaultRoadType: string = 'NORMALWAY',
        formData?: {
            /**
             * CSV file containing complete route data
             */
            file: Blob;
        },
    ): CancelablePromise<RouteUnifiedImportResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/routes/import',
            query: {
                'routeGroupDuplicateStrategy': routeGroupDuplicateStrategy,
                'routeDuplicateStrategy': routeDuplicateStrategy,
                'validateStopsExist': validateStopsExist,
                'createMissingStops': createMissingStops,
                'allowPartialRouteStops': allowPartialRouteStops,
                'validateCoordinates': validateCoordinates,
                'continueOnError': continueOnError,
                'defaultRoadType': defaultRoadType,
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
     * Download unified CSV import template
     * Download a CSV template file with sample data for unified route import. This template includes all route-related entities (route groups, routes, route stops) in a single format.
     * @returns string Template downloaded successfully
     * @throws ApiError
     */
    public static downloadUnifiedRouteImportTemplate(): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/routes/import/template',
        });
    }
    /**
     * Get route statistics
     * Retrieve comprehensive route statistics for dashboard KPI cards including counts, distributions, distance/duration metrics, and route information.
     * @returns RouteStatisticsResponse Statistics retrieved successfully
     * @throws ApiError
     */
    public static getRouteStatistics(): CancelablePromise<RouteStatisticsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/routes/statistics',
        });
    }
    /**
     * Get route by ID
     * Retrieve a specific route by its unique identifier.
     * @param id Route ID
     * @returns RouteResponse Route found and retrieved successfully
     * @throws ApiError
     */
    public static getRouteById(
        id: string,
    ): CancelablePromise<RouteResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/routes/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Invalid UUID format`,
                404: `Route not found`,
            },
        });
    }
}
