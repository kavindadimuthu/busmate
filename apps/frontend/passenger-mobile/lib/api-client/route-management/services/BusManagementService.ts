/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BusFilterOptionsResponse } from '../models/BusFilterOptionsResponse';
import type { BusImportResponse } from '../models/BusImportResponse';
import type { BusRequest } from '../models/BusRequest';
import type { BusResponse } from '../models/BusResponse';
import type { BusStatisticsResponse } from '../models/BusStatisticsResponse';
import type { PageBusResponse } from '../models/PageBusResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BusManagementService {
    /**
     * Get all buses with pagination, sorting, and filtering
     * Retrieve all buses with optional pagination, sorting, search, and filtering by operator, status, and capacity range. Search is performed across NTC registration number, plate number, model, and operator name (case-insensitive). Default: page=0, size=10, sort=ntcRegistrationNumber,asc. Maximum page size is 100.
     * @param page Page number (0-based)
     * @param size Page size (max 100)
     * @param sortBy Sort by field name (ntcRegistrationNumber, plateNumber, capacity, model, status, createdAt, updatedAt)
     * @param sortDir Sort direction (asc or desc)
     * @param search Search text to filter buses by NTC registration number, plate number, model, or operator name (case-insensitive)
     * @param operatorId Filter by operator ID
     * @param status Filter by status (pending, active, inactive, cancelled) - case insensitive
     * @param minCapacity Filter by minimum capacity
     * @param maxCapacity Filter by maximum capacity
     * @returns PageBusResponse Buses retrieved successfully
     * @throws ApiError
     */
    public static getAllBuses(
        page?: number,
        size: number = 10,
        sortBy: string = 'ntcRegistrationNumber',
        sortDir: string = 'asc',
        search?: string,
        operatorId?: string,
        status?: string,
        minCapacity?: number,
        maxCapacity?: number,
    ): CancelablePromise<PageBusResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/buses',
            query: {
                'page': page,
                'size': size,
                'sortBy': sortBy,
                'sortDir': sortDir,
                'search': search,
                'operatorId': operatorId,
                'status': status,
                'minCapacity': minCapacity,
                'maxCapacity': maxCapacity,
            },
            errors: {
                400: `Invalid pagination, sorting, or filter parameters`,
            },
        });
    }
    /**
     * Create a new bus
     * Creates a new bus with the provided details. Requires authentication.
     * @param requestBody
     * @returns BusResponse Bus created successfully
     * @throws ApiError
     */
    public static createBus(
        requestBody: BusRequest,
    ): CancelablePromise<BusResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/buses',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid input data`,
                401: `Unauthorized`,
                409: `Bus with same NTC registration number or plate number already exists`,
            },
        });
    }
    /**
     * Get all buses without pagination
     * Retrieve all buses as a simple list without pagination. Use this endpoint carefully as it returns all buses at once.
     * @returns BusResponse All buses retrieved successfully
     * @throws ApiError
     */
    public static getAllBusesAsList(): CancelablePromise<Array<BusResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/buses/all',
        });
    }
    /**
     * Get available filter options
     * Retrieve all available filter options for bus management frontend including operators, models, statuses, capacity ranges, and sort options.
     * @returns BusFilterOptionsResponse Filter options retrieved successfully
     * @throws ApiError
     */
    public static getBusFilterOptions(): CancelablePromise<BusFilterOptionsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/buses/filter-options',
        });
    }
    /**
     * Import buses from CSV file
     * Bulk import buses from a CSV file. Expected CSV format: operatorName,ntcRegistrationNumber,plateNumber,capacity,model,facilities,status (header row required). OperatorName must match an existing operator. Status should be active, inactive, pending, or cancelled. Facilities should be valid JSON or simple text. Requires authentication.
     * @param formData
     * @returns BusImportResponse Import completed (check response for detailed results)
     * @throws ApiError
     */
    public static importBuses(
        formData?: {
            /**
             * CSV file containing bus data
             */
            file: Blob;
        },
    ): CancelablePromise<BusImportResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/buses/import',
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
     * Download a CSV template file with sample data and correct format for bus import.
     * @returns string Template downloaded successfully
     * @throws ApiError
     */
    public static downloadBusImportTemplate(): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/buses/import-template',
        });
    }
    /**
     * Get bus statistics
     * Retrieve comprehensive bus statistics for dashboard KPI cards including counts, distributions, capacity metrics, and calculated statistics.
     * @returns BusStatisticsResponse Statistics retrieved successfully
     * @throws ApiError
     */
    public static getBusStatistics(): CancelablePromise<BusStatisticsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/buses/statistics',
        });
    }
    /**
     * Get bus by ID
     * Retrieve a specific bus by its unique identifier.
     * @param id Bus ID
     * @returns BusResponse Bus found and retrieved successfully
     * @throws ApiError
     */
    public static getBusById(
        id: string,
    ): CancelablePromise<BusResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/buses/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Invalid UUID format`,
                404: `Bus not found`,
            },
        });
    }
    /**
     * Update an existing bus
     * Update an existing bus with new details. Requires authentication.
     * @param id Bus ID
     * @param requestBody
     * @returns BusResponse Bus updated successfully
     * @throws ApiError
     */
    public static updateBus(
        id: string,
        requestBody: BusRequest,
    ): CancelablePromise<BusResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/buses/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid input data`,
                401: `Unauthorized`,
                404: `Bus not found`,
                409: `Bus NTC registration number or plate number already exists`,
            },
        });
    }
    /**
     * Delete a bus
     * Permanently delete a bus. This action cannot be undone. Requires authentication.
     * @param id Bus ID
     * @returns void
     * @throws ApiError
     */
    public static deleteBus(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/buses/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Invalid UUID format`,
                401: `Unauthorized`,
                404: `Bus not found`,
            },
        });
    }
}
