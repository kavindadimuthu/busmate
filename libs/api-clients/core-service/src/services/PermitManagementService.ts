/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedResponsePassengerServicePermitResponse } from '../models/PaginatedResponsePassengerServicePermitResponse';
import type { PassengerServicePermitFilterOptionsResponse } from '../models/PassengerServicePermitFilterOptionsResponse';
import type { PassengerServicePermitImportResponse } from '../models/PassengerServicePermitImportResponse';
import type { PassengerServicePermitRequest } from '../models/PassengerServicePermitRequest';
import type { PassengerServicePermitResponse } from '../models/PassengerServicePermitResponse';
import type { PassengerServicePermitStatisticsResponse } from '../models/PassengerServicePermitStatisticsResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PermitManagementService {
    /**
     * Get permits with pagination
     * Retrieve passenger service permits with pagination, filtering, and sorting options
     * @param page Page number (0-based)
     * @param size Page size
     * @param sortBy Sort field
     * @param sortDir Sort direction (asc/desc)
     * @param status Filter by status
     * @param permitType Filter by permit type
     * @param operatorName Filter by operator name
     * @param routeGroupName Filter by route group name
     * @returns PaginatedResponsePassengerServicePermitResponse OK
     * @throws ApiError
     */
    public static getPermits(
        page?: number,
        size: number = 20,
        sortBy: string = 'createdAt',
        sortDir: string = 'desc',
        status?: string,
        permitType?: string,
        operatorName?: string,
        routeGroupName?: string,
    ): CancelablePromise<PaginatedResponsePassengerServicePermitResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/permits',
            query: {
                'page': page,
                'size': size,
                'sortBy': sortBy,
                'sortDir': sortDir,
                'status': status,
                'permitType': permitType,
                'operatorName': operatorName,
                'routeGroupName': routeGroupName,
            },
        });
    }
    /**
     * @param requestBody
     * @returns PassengerServicePermitResponse OK
     * @throws ApiError
     */
    public static createPermit(
        requestBody: PassengerServicePermitRequest,
    ): CancelablePromise<PassengerServicePermitResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/permits',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get all permits
     * Retrieve all passenger service permits without pagination
     * @returns PassengerServicePermitResponse OK
     * @throws ApiError
     */
    public static getAllPermits(): CancelablePromise<Array<PassengerServicePermitResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/permits/all',
        });
    }
    /**
     * Get available filter options
     * Retrieve all available filter options for permit management frontend including operators, route groups, statuses, permit types, and sort options.
     * @returns PassengerServicePermitFilterOptionsResponse Filter options retrieved successfully
     * @throws ApiError
     */
    public static getPermitFilterOptions(): CancelablePromise<PassengerServicePermitFilterOptionsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/permits/filter-options',
        });
    }
    /**
     * Import permits from CSV file
     * Bulk import passenger service permits from a CSV file. The file must follow the template format with columns: operatorName, routeGroupName, permitNumber, issueDate, expiryDate, maximumBusAssigned, permitType, status. Returns detailed results including successful imports, failures, and error details.
     * @param formData
     * @returns PassengerServicePermitImportResponse Import completed (may include partial failures)
     * @throws ApiError
     */
    public static importPermitsFromCsv(
        formData?: {
            /**
             * CSV file containing permit data
             */
            file: Blob;
        },
    ): CancelablePromise<PassengerServicePermitImportResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/permits/import',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Invalid file format or empty file`,
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Download CSV import template
     * Download a CSV template file with sample data for bulk permit import. The template includes all required columns and example values.
     * @returns string Template downloaded successfully
     * @throws ApiError
     */
    public static getPermitImportTemplate(): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/permits/import-template',
        });
    }
    /**
     * Get permits by route group
     * Retrieve all passenger service permits for a specific route group
     * @param routeGroupId Route group ID
     * @returns PassengerServicePermitResponse OK
     * @throws ApiError
     */
    public static getPermitsByRouteGroupId(
        routeGroupId: string,
    ): CancelablePromise<Array<PassengerServicePermitResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/permits/route-group/{routeGroupId}',
            path: {
                'routeGroupId': routeGroupId,
            },
        });
    }
    /**
     * Get permit statistics
     * Retrieve comprehensive permit statistics including total counts, status breakdowns, expiry alerts, and distribution by operators and route groups.
     * @returns PassengerServicePermitStatisticsResponse Statistics retrieved successfully
     * @throws ApiError
     */
    public static getPermitStatistics(): CancelablePromise<PassengerServicePermitStatisticsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/permits/statistics',
        });
    }
    /**
     * Get permit by ID
     * Retrieve a specific passenger service permit by its ID
     * @param id
     * @returns PassengerServicePermitResponse OK
     * @throws ApiError
     */
    public static getPermitById(
        id: string,
    ): CancelablePromise<PassengerServicePermitResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/permits/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns PassengerServicePermitResponse OK
     * @throws ApiError
     */
    public static updatePermit(
        id: string,
        requestBody: PassengerServicePermitRequest,
    ): CancelablePromise<PassengerServicePermitResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/permits/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deletePermit(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/permits/{id}',
            path: {
                'id': id,
            },
        });
    }
}
