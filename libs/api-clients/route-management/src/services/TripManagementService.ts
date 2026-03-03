/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BulkPspAssignmentRequest } from '../models/BulkPspAssignmentRequest';
import type { BulkPspAssignmentResponse } from '../models/BulkPspAssignmentResponse';
import type { PageTripResponse } from '../models/PageTripResponse';
import type { TripFilterOptionsResponse } from '../models/TripFilterOptionsResponse';
import type { TripRequest } from '../models/TripRequest';
import type { TripResponse } from '../models/TripResponse';
import type { TripStatisticsResponse } from '../models/TripStatisticsResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TripManagementService {
    /**
     * Get all trips with pagination, sorting, and filtering
     * Retrieve all trips with optional pagination, sorting, search, and filtering by status, route, operator, schedule, PSP, bus, date range, and assignment status. Search is performed across trip details, route information, operator name, permit number, bus plate number, and notes (case-insensitive). Default: page=0, size=10, sort=tripDate,desc. Maximum page size is 100.
     * @param page Page number (0-based)
     * @param size Page size (max 100)
     * @param sortBy Sort by field name (tripDate, scheduledDepartureTime, scheduledArrivalTime, status, createdAt, updatedAt)
     * @param sortDir Sort direction (asc or desc)
     * @param search Search text to filter trips by route, operator, permit, bus plate, notes (case-insensitive)
     * @param status Filter by trip status
     * @param routeId Filter by route ID
     * @param operatorId Filter by operator ID
     * @param scheduleId Filter by schedule ID
     * @param passengerServicePermitId Filter by passenger service permit ID
     * @param busId Filter by bus ID
     * @param fromDate Filter trips from this date (inclusive)
     * @param toDate Filter trips to this date (inclusive)
     * @param hasPsp Filter by PSP assignment status - true: has PSP, false: no PSP
     * @param hasBus Filter by bus assignment status - true: has bus, false: no bus
     * @param hasDriver Filter by driver assignment status - true: has driver, false: no driver
     * @param hasConductor Filter by conductor assignment status - true: has conductor, false: no conductor
     * @returns PageTripResponse Trips retrieved successfully
     * @throws ApiError
     */
    public static getAllTrips(
        page?: number,
        size: number = 10,
        sortBy: string = 'tripDate',
        sortDir: string = 'desc',
        search?: string,
        status?: 'pending' | 'active' | 'completed' | 'cancelled' | 'delayed' | 'in_transit' | 'boarding' | 'departed',
        routeId?: string,
        operatorId?: string,
        scheduleId?: string,
        passengerServicePermitId?: string,
        busId?: string,
        fromDate?: string,
        toDate?: string,
        hasPsp?: boolean,
        hasBus?: boolean,
        hasDriver?: boolean,
        hasConductor?: boolean,
    ): CancelablePromise<PageTripResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/trips',
            query: {
                'page': page,
                'size': size,
                'sortBy': sortBy,
                'sortDir': sortDir,
                'search': search,
                'status': status,
                'routeId': routeId,
                'operatorId': operatorId,
                'scheduleId': scheduleId,
                'passengerServicePermitId': passengerServicePermitId,
                'busId': busId,
                'fromDate': fromDate,
                'toDate': toDate,
                'hasPsp': hasPsp,
                'hasBus': hasBus,
                'hasDriver': hasDriver,
                'hasConductor': hasConductor,
            },
            errors: {
                400: `Invalid pagination, sorting, or filter parameters`,
            },
        });
    }
    /**
     * Create a new trip
     * @param requestBody
     * @returns TripResponse OK
     * @throws ApiError
     */
    public static createTrip(
        requestBody: TripRequest,
    ): CancelablePromise<TripResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/trips',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Bulk assign Passenger Service Permit to multiple trips
     * @param tripIds
     * @param passengerServicePermitId
     * @returns TripResponse OK
     * @throws ApiError
     */
    public static bulkAssignPassengerServicePermitToTrips(
        tripIds: Array<string>,
        passengerServicePermitId: string,
    ): CancelablePromise<Array<TripResponse>> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/trips/bulk-assign-psp',
            query: {
                'tripIds': tripIds,
                'passengerServicePermitId': passengerServicePermitId,
            },
        });
    }
    /**
     * Bulk assign PSPs to trips
     * Assign multiple Passenger Service Permits to multiple trips in a single operation. This is useful for workspace scenarios where operators need to assign PSPs to trips in bulk. The operation returns details of successful and failed assignments.
     * @param requestBody
     * @returns BulkPspAssignmentResponse OK
     * @throws ApiError
     */
    public static bulkAssignPspsToTrips(
        requestBody: BulkPspAssignmentRequest,
    ): CancelablePromise<BulkPspAssignmentResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/trips/bulk-assign-psps',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get trips by bus
     * @param busId
     * @returns TripResponse OK
     * @throws ApiError
     */
    public static getTripsByBus(
        busId: string,
    ): CancelablePromise<Array<TripResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/trips/bus/{busId}',
            path: {
                'busId': busId,
            },
        });
    }
    /**
     * Get trips by conductor
     * @param conductorId
     * @returns TripResponse OK
     * @throws ApiError
     */
    public static getTripsByConductor(
        conductorId: string,
    ): CancelablePromise<Array<TripResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/trips/conductor/{conductorId}',
            path: {
                'conductorId': conductorId,
            },
        });
    }
    /**
     * Get trips by date range
     * @param startDate
     * @param endDate
     * @returns TripResponse OK
     * @throws ApiError
     */
    public static getTripsByDateRange(
        startDate: string,
        endDate: string,
    ): CancelablePromise<Array<TripResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/trips/date-range',
            query: {
                'startDate': startDate,
                'endDate': endDate,
            },
        });
    }
    /**
     * Get trips by date
     * @param tripDate
     * @returns TripResponse OK
     * @throws ApiError
     */
    public static getTripsByDate(
        tripDate: string,
    ): CancelablePromise<Array<TripResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/trips/date/{tripDate}',
            path: {
                'tripDate': tripDate,
            },
        });
    }
    /**
     * Get trips by driver
     * @param driverId
     * @returns TripResponse OK
     * @throws ApiError
     */
    public static getTripsByDriver(
        driverId: string,
    ): CancelablePromise<Array<TripResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/trips/driver/{driverId}',
            path: {
                'driverId': driverId,
            },
        });
    }
    /**
     * Get trip filter options
     * Retrieve available filter options for trip search and filtering functionality, including routes, operators, schedules, PSPs, buses, and other filter criteria.
     * @returns TripFilterOptionsResponse Filter options retrieved successfully
     * @throws ApiError
     */
    public static getTripFilterOptions(): CancelablePromise<TripFilterOptionsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/trips/filter-options',
        });
    }
    /**
     * Generate trips for schedule within date range or entire validity period
     * Generate trips for a schedule. If fromDate and toDate are not provided, trips will be generated for the entire validity period of the schedule. If dates are provided, trips will be generated only for the specified period.
     * @param scheduleId
     * @param fromDate
     * @param toDate
     * @returns TripResponse OK
     * @throws ApiError
     */
    public static generateTripsForSchedule1(
        scheduleId: string,
        fromDate?: string,
        toDate?: string,
    ): CancelablePromise<Array<TripResponse>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/trips/generate',
            query: {
                'scheduleId': scheduleId,
                'fromDate': fromDate,
                'toDate': toDate,
            },
        });
    }
    /**
     * Get trips by Passenger Service Permit
     * @param passengerServicePermitId
     * @returns TripResponse OK
     * @throws ApiError
     */
    public static getTripsByPassengerServicePermit(
        passengerServicePermitId: string,
    ): CancelablePromise<Array<TripResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/trips/permit/{passengerServicePermitId}',
            path: {
                'passengerServicePermitId': passengerServicePermitId,
            },
        });
    }
    /**
     * Get trips by Route
     * Retrieve all trips associated with a specific route ID. This includes trips from all schedules that belong to the specified route.
     * @param routeId
     * @returns TripResponse OK
     * @throws ApiError
     */
    public static getTripsByRoute(
        routeId: string,
    ): CancelablePromise<Array<TripResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/trips/route/{routeId}',
            path: {
                'routeId': routeId,
            },
        });
    }
    /**
     * Get trips by Schedule
     * @param scheduleId
     * @returns TripResponse OK
     * @throws ApiError
     */
    public static getTripsBySchedule(
        scheduleId: string,
    ): CancelablePromise<Array<TripResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/trips/schedule/{scheduleId}',
            path: {
                'scheduleId': scheduleId,
            },
        });
    }
    /**
     * Get all trips (simple list)
     * Get all trips as a simple list without pagination - use for dropdowns and quick lookups
     * @returns TripResponse OK
     * @throws ApiError
     */
    public static getAllTripsSimple(): CancelablePromise<Array<TripResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/trips/simple',
        });
    }
    /**
     * Get trip statistics
     * Retrieve comprehensive trip statistics for dashboard KPI cards including counts, performance metrics, distribution data, and operational insights.
     * @returns TripStatisticsResponse Statistics retrieved successfully
     * @throws ApiError
     */
    public static getTripStatistics(): CancelablePromise<TripStatisticsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/trips/statistics',
        });
    }
    /**
     * Get trips by status
     * @param status
     * @returns TripResponse OK
     * @throws ApiError
     */
    public static getTripsByStatus(
        status: 'pending' | 'active' | 'completed' | 'cancelled' | 'delayed' | 'in_transit' | 'boarding' | 'departed',
    ): CancelablePromise<Array<TripResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/trips/status/{status}',
            path: {
                'status': status,
            },
        });
    }
    /**
     * Get trip by ID
     * @param id
     * @returns TripResponse OK
     * @throws ApiError
     */
    public static getTripById(
        id: string,
    ): CancelablePromise<TripResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/trips/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update trip
     * @param id
     * @param requestBody
     * @returns TripResponse OK
     * @throws ApiError
     */
    public static updateTrip(
        id: string,
        requestBody: TripRequest,
    ): CancelablePromise<TripResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/trips/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete trip
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteTrip(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/trips/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Assign Passenger Service Permit to trip
     * @param id
     * @param passengerServicePermitId
     * @returns TripResponse OK
     * @throws ApiError
     */
    public static assignPassengerServicePermitToTrip(
        id: string,
        passengerServicePermitId: string,
    ): CancelablePromise<TripResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/trips/{id}/assign-psp',
            path: {
                'id': id,
            },
            query: {
                'passengerServicePermitId': passengerServicePermitId,
            },
        });
    }
    /**
     * Cancel trip
     * @param id
     * @param reason
     * @returns TripResponse OK
     * @throws ApiError
     */
    public static cancelTrip(
        id: string,
        reason: string,
    ): CancelablePromise<TripResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/trips/{id}/cancel',
            path: {
                'id': id,
            },
            query: {
                'reason': reason,
            },
        });
    }
    /**
     * Complete trip
     * @param id
     * @returns TripResponse OK
     * @throws ApiError
     */
    public static completeTrip(
        id: string,
    ): CancelablePromise<TripResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/trips/{id}/complete',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Remove Passenger Service Permit from trip
     * @param id
     * @returns TripResponse OK
     * @throws ApiError
     */
    public static removePassengerServicePermitFromTrip(
        id: string,
    ): CancelablePromise<TripResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/trips/{id}/remove-psp',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Start trip
     * @param id
     * @returns TripResponse OK
     * @throws ApiError
     */
    public static startTrip(
        id: string,
    ): CancelablePromise<TripResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/trips/{id}/start',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update trip status
     * @param id
     * @param status
     * @returns TripResponse OK
     * @throws ApiError
     */
    public static updateTripStatus(
        id: string,
        status: 'pending' | 'active' | 'completed' | 'cancelled' | 'delayed' | 'in_transit' | 'boarding' | 'departed',
    ): CancelablePromise<TripResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/trips/{id}/status',
            path: {
                'id': id,
            },
            query: {
                'status': status,
            },
        });
    }
}
