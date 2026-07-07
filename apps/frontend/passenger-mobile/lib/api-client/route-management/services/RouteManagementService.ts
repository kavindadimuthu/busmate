/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PageRouteGroupResponse } from '../models/PageRouteGroupResponse';
import type { PageRouteResponse } from '../models/PageRouteResponse';
import type { RouteGroupRequest } from '../models/RouteGroupRequest';
import type { RouteGroupResponse } from '../models/RouteGroupResponse';
import type { RouteImportResponse } from '../models/RouteImportResponse';
import type { RouteResponse } from '../models/RouteResponse';
import type { RouteStatisticsResponse } from '../models/RouteStatisticsResponse';
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
     * @param minDistance Minimum distance in kilometers
     * @param maxDistance Maximum distance in kilometers
     * @param minDuration Minimum estimated duration in minutes
     * @param maxDuration Maximum estimated duration in minutes
     * @returns PageRouteResponse Routes retrieved successfully
     * @throws ApiError
     */
    public static getAllRoutes1(
        page?: number,
        size: number = 10,
        sortBy: string = 'name',
        sortDir: string = 'asc',
        search?: string,
        routeGroupId?: string,
        direction?: 'OUTBOUND' | 'INBOUND',
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
     * Get routes by route group ID
     * Retrieve all routes belonging to a specific route group.
     * @param routeGroupId Route Group ID
     * @returns RouteResponse Routes retrieved successfully
     * @throws ApiError
     */
    public static getRoutesByRouteGroupId(
        routeGroupId: string,
    ): CancelablePromise<Array<RouteResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/routes/by-group/{routeGroupId}',
            path: {
                'routeGroupId': routeGroupId,
            },
            errors: {
                400: `Invalid UUID format`,
            },
        });
    }
    /**
     * Get distinct directions
     * Retrieve all distinct directions available in the routes database for filter dropdown options.
     * @returns string Distinct directions retrieved successfully
     * @throws ApiError
     */
    public static getDistinctDirections(): CancelablePromise<Array<'OUTBOUND' | 'INBOUND'>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/routes/filter-options/directions',
        });
    }
    /**
     * Get distance range
     * Retrieve the minimum and maximum distance values available in the routes database for range filter options.
     * @returns any Distance range retrieved successfully
     * @throws ApiError
     */
    public static getDistanceRange(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/routes/filter-options/distance-range',
        });
    }
    /**
     * Get duration range
     * Retrieve the minimum and maximum duration values available in the routes database for range filter options.
     * @returns any Duration range retrieved successfully
     * @throws ApiError
     */
    public static getDurationRange(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/routes/filter-options/duration-range',
        });
    }
    /**
     * Get distinct route groups
     * Retrieve all distinct route groups available in the routes database for filter dropdown options.
     * @returns any Distinct route groups retrieved successfully
     * @throws ApiError
     */
    public static getDistinctRouteGroups(): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/routes/filter-options/route-groups',
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
     * Import routes from CSV file
     * Bulk import routes from a CSV file. Expected CSV format: name,description,routeGroupName,startStopName,endStopName,distanceKm,estimatedDurationMinutes,direction (header row required). Direction should be OUTBOUND or INBOUND. Route group and stops must already exist in the system. Requires authentication.
     * @param formData
     * @returns RouteImportResponse Import completed (check response for detailed results)
     * @throws ApiError
     */
    public static importRoutes(
        formData?: {
            /**
             * CSV file containing route data
             */
            file: Blob;
        },
    ): CancelablePromise<RouteImportResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/routes/import',
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
     * Download a CSV template file with sample data and correct format for route import.
     * @returns string Template downloaded successfully
     * @throws ApiError
     */
    public static downloadRouteImportTemplate(): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/routes/import-template',
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
