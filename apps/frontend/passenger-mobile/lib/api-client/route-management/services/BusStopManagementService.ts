/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PageStopResponse } from '../models/PageStopResponse';
import type { RouteStopDetailResponse } from '../models/RouteStopDetailResponse';
import type { ScheduleStopDetailResponse } from '../models/ScheduleStopDetailResponse';
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
     * Get distinct accessibility statuses
     * Retrieve all distinct accessibility statuses (true/false) available in the stops database for filter dropdown options.
     * @returns boolean Distinct accessibility statuses retrieved successfully
     * @throws ApiError
     */
    public static getDistinctAccessibilityStatuses(): CancelablePromise<Array<boolean>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/stops/filter-options/accessibility-statuses',
        });
    }
    /**
     * Get distinct states
     * Retrieve all distinct states available in the stops database for filter dropdown options.
     * @returns string Distinct states retrieved successfully
     * @throws ApiError
     */
    public static getDistinctStates(): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/stops/filter-options/states',
        });
    }
    /**
     * Import stops from CSV file
     * Bulk import stops from a CSV file. Expected CSV format: name,description,latitude,longitude,address,city,state,zipCode,country,isAccessible (header row required). Latitude and longitude are required. isAccessible should be true or false. Requires authentication.
     * @param formData
     * @returns StopImportResponse Import completed (check response for detailed results)
     * @throws ApiError
     */
    public static importStops(
        formData?: {
            /**
             * CSV file containing stop data
             */
            file: Blob;
        },
    ): CancelablePromise<StopImportResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/stops/import',
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
     * Download a CSV template file with sample data and correct format for stop import.
     * @returns string Template downloaded successfully
     * @throws ApiError
     */
    public static downloadStopImportTemplate(): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/stops/import-template',
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
