/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BusResponse } from '../models/BusResponse';
import type { OperatorResponse } from '../models/OperatorResponse';
import type { PageBusResponse } from '../models/PageBusResponse';
import type { PageRouteResponse } from '../models/PageRouteResponse';
import type { PageScheduleResponse } from '../models/PageScheduleResponse';
import type { PageTripResponse } from '../models/PageTripResponse';
import type { PaginatedResponsePassengerServicePermitResponse } from '../models/PaginatedResponsePassengerServicePermitResponse';
import type { PassengerServicePermitResponse } from '../models/PassengerServicePermitResponse';
import type { ScheduleResponse } from '../models/ScheduleResponse';
import type { TripResponse } from '../models/TripResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BusOperatorOperationsService {
    /**
     * Get all buses for operator
     * Retrieve all buses registered under a specific bus operator with pagination, sorting, and filtering options. Search is performed across NTC registration number, plate number, and model (case-insensitive). Default: page=0, size=10, sort=ntcRegistrationNumber,asc. Maximum page size is 100.
     * @param operatorId Operator ID
     * @param page Page number (0-based)
     * @param size Page size (max 100)
     * @param sortBy Sort by field name (ntcRegistrationNumber, plateNumber, capacity, model, status, createdAt, updatedAt)
     * @param sortDir Sort direction (asc or desc)
     * @param status Filter by bus status
     * @param searchText Search by plate number or NTC registration number (case-insensitive)
     * @param minCapacity Minimum capacity filter
     * @param maxCapacity Maximum capacity filter
     * @returns PageBusResponse Buses retrieved successfully
     * @throws ApiError
     */
    public static getOperatorBuses(
        operatorId: string,
        page?: number,
        size: number = 10,
        sortBy: string = 'ntcRegistrationNumber',
        sortDir: string = 'asc',
        status?: 'pending' | 'active' | 'inactive' | 'cancelled',
        searchText?: string,
        minCapacity?: number,
        maxCapacity?: number,
    ): CancelablePromise<PageBusResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/bus-operator/{operatorId}/buses',
            path: {
                'operatorId': operatorId,
            },
            query: {
                'page': page,
                'size': size,
                'sortBy': sortBy,
                'sortDir': sortDir,
                'status': status,
                'searchText': searchText,
                'minCapacity': minCapacity,
                'maxCapacity': maxCapacity,
            },
            errors: {
                400: `Invalid pagination, sorting, or filter parameters`,
                404: `Operator not found`,
            },
        });
    }
    /**
     * Get specific bus details for operator
     * Retrieve detailed information about a specific bus belonging to the operator
     * @param operatorId Operator ID
     * @param busId Bus ID
     * @returns BusResponse Bus details retrieved successfully
     * @throws ApiError
     */
    public static getOperatorBusById(
        operatorId: string,
        busId: string,
    ): CancelablePromise<BusResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/bus-operator/{operatorId}/buses/{busId}',
            path: {
                'operatorId': operatorId,
                'busId': busId,
            },
            errors: {
                404: `Bus not found or doesn't belong to operator`,
            },
        });
    }
    /**
     * Get operator dashboard summary
     * Retrieve summary statistics and counts for operator dashboard
     * @param operatorId Operator ID
     * @returns any Dashboard summary retrieved successfully
     * @throws ApiError
     */
    public static getOperatorDashboardSummary(
        operatorId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/bus-operator/{operatorId}/dashboard/summary',
            path: {
                'operatorId': operatorId,
            },
            errors: {
                404: `Operator not found`,
            },
        });
    }
    /**
     * Get all permits for operator
     * Retrieve all passenger service permits registered under a specific bus operator with pagination, sorting, and filtering options. Default: page=0, size=10, sort=permitNumber,asc. Maximum page size is 100.
     * @param operatorId Operator ID
     * @param page Page number (0-based)
     * @param size Page size (max 100)
     * @param sortBy Sort by field name (permitNumber, issueDate, expiryDate, status, createdAt, updatedAt)
     * @param sortDir Sort direction (asc or desc)
     * @param status Filter by permit status
     * @param permitType Filter by permit type
     * @param searchText Search text
     * @returns PaginatedResponsePassengerServicePermitResponse Permits retrieved successfully
     * @throws ApiError
     */
    public static getOperatorPermits(
        operatorId: string,
        page?: number,
        size: number = 10,
        sortBy: string = 'permitNumber',
        sortDir: string = 'asc',
        status?: string,
        permitType?: string,
        searchText?: string,
    ): CancelablePromise<PaginatedResponsePassengerServicePermitResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/bus-operator/{operatorId}/permits',
            path: {
                'operatorId': operatorId,
            },
            query: {
                'page': page,
                'size': size,
                'sortBy': sortBy,
                'sortDir': sortDir,
                'status': status,
                'permitType': permitType,
                'searchText': searchText,
            },
            errors: {
                400: `Invalid pagination, sorting, or filter parameters`,
                404: `Operator not found`,
            },
        });
    }
    /**
     * Get expiring permits for operator
     * Retrieve permits that are expiring within a specified number of days
     * @param operatorId Operator ID
     * @param daysAhead Number of days ahead to check for expiring permits (default: 30)
     * @returns PassengerServicePermitResponse Expiring permits retrieved successfully
     * @throws ApiError
     */
    public static getExpiringPermits(
        operatorId: string,
        daysAhead: number = 30,
    ): CancelablePromise<Array<PassengerServicePermitResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/bus-operator/{operatorId}/permits/expiring',
            path: {
                'operatorId': operatorId,
            },
            query: {
                'daysAhead': daysAhead,
            },
            errors: {
                404: `Operator not found`,
            },
        });
    }
    /**
     * Get specific permit details for operator
     * Retrieve detailed information about a specific permit belonging to the operator
     * @param operatorId Operator ID
     * @param permitId Permit ID
     * @returns PassengerServicePermitResponse Permit details retrieved successfully
     * @throws ApiError
     */
    public static getOperatorPermitById(
        operatorId: string,
        permitId: string,
    ): CancelablePromise<PassengerServicePermitResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/bus-operator/{operatorId}/permits/{permitId}',
            path: {
                'operatorId': operatorId,
                'permitId': permitId,
            },
            errors: {
                404: `Permit not found or doesn't belong to operator`,
            },
        });
    }
    /**
     * Get bus operator profile
     * Retrieve detailed information about a specific bus operator
     * @param operatorId Operator ID
     * @returns OperatorResponse Operator profile retrieved successfully
     * @throws ApiError
     */
    public static getOperatorProfile(
        operatorId: string,
    ): CancelablePromise<OperatorResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/bus-operator/{operatorId}/profile',
            path: {
                'operatorId': operatorId,
            },
            errors: {
                404: `Operator not found`,
            },
        });
    }
    /**
     * Get available routes for operator
     * Retrieve all routes that the operator has permits for with pagination, sorting, and filtering options. Default: page=0, size=10, sort=name,asc. Maximum page size is 100.
     * @param operatorId Operator ID
     * @param page Page number (0-based)
     * @param size Page size (max 100)
     * @param sortBy Sort by field name (name, distanceKm, estimatedDurationMinutes, direction, createdAt, updatedAt)
     * @param sortDir Sort direction (asc or desc)
     * @param routeGroupId Filter by route group ID
     * @param searchText Search by route name
     * @returns PageRouteResponse Routes retrieved successfully
     * @throws ApiError
     */
    public static getOperatorRoutes(
        operatorId: string,
        page?: number,
        size: number = 10,
        sortBy: string = 'name',
        sortDir: string = 'asc',
        routeGroupId?: string,
        searchText?: string,
    ): CancelablePromise<PageRouteResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/bus-operator/{operatorId}/routes',
            path: {
                'operatorId': operatorId,
            },
            query: {
                'page': page,
                'size': size,
                'sortBy': sortBy,
                'sortDir': sortDir,
                'routeGroupId': routeGroupId,
                'searchText': searchText,
            },
            errors: {
                400: `Invalid pagination, sorting, or filter parameters`,
                404: `Operator not found`,
            },
        });
    }
    /**
     * Get available schedules for operator
     * Retrieve all schedules for routes that the operator has permits for with pagination, sorting, and filtering options. Default: page=0, size=10, sort=name,asc. Maximum page size is 100.
     * @param operatorId Operator ID
     * @param page Page number (0-based)
     * @param size Page size (max 100)
     * @param sortBy Sort by field name (name, effectiveStartDate, effectiveEndDate, status, createdAt, updatedAt)
     * @param sortDir Sort direction (asc or desc)
     * @param routeId Filter by route ID
     * @param routeGroupId Filter by route group ID
     * @param status Filter by schedule status
     * @param searchText Search by schedule name
     * @returns PageScheduleResponse Schedules retrieved successfully
     * @throws ApiError
     */
    public static getOperatorSchedules(
        operatorId: string,
        page?: number,
        size: number = 10,
        sortBy: string = 'name',
        sortDir: string = 'asc',
        routeId?: string,
        routeGroupId?: string,
        status?: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'CANCELLED',
        searchText?: string,
    ): CancelablePromise<PageScheduleResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/bus-operator/{operatorId}/schedules',
            path: {
                'operatorId': operatorId,
            },
            query: {
                'page': page,
                'size': size,
                'sortBy': sortBy,
                'sortDir': sortDir,
                'routeId': routeId,
                'routeGroupId': routeGroupId,
                'status': status,
                'searchText': searchText,
            },
            errors: {
                400: `Invalid pagination, sorting, or filter parameters`,
                404: `Operator not found`,
            },
        });
    }
    /**
     * Get specific schedule details for operator
     * Retrieve detailed information about a specific schedule available to the operator
     * @param operatorId Operator ID
     * @param scheduleId Schedule ID
     * @returns ScheduleResponse Schedule details retrieved successfully
     * @throws ApiError
     */
    public static getOperatorScheduleById(
        operatorId: string,
        scheduleId: string,
    ): CancelablePromise<ScheduleResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/bus-operator/{operatorId}/schedules/{scheduleId}',
            path: {
                'operatorId': operatorId,
                'scheduleId': scheduleId,
            },
            errors: {
                404: `Schedule not found or not available to operator`,
            },
        });
    }
    /**
     * Get all trips for operator
     * Retrieve all trips associated with the operator's permits and schedules with pagination, sorting, and filtering options. Default: page=0, size=10, sort=tripDate,desc. Maximum page size is 100.
     * @param operatorId Operator ID
     * @param page Page number (0-based)
     * @param size Page size (max 100)
     * @param sortBy Sort by field name (tripDate, scheduledDepartureTime, status, createdAt, updatedAt)
     * @param sortDir Sort direction (asc or desc)
     * @param status Filter by trip status
     * @param fromDate Filter by trip date (from)
     * @param toDate Filter by trip date (to)
     * @param routeGroupId Filter by route group ID
     * @param routeId Filter by route ID
     * @param scheduleId Filter by schedule ID
     * @param passengerServicePermitId Filter by permit ID
     * @param busId Filter by bus ID
     * @param search Search text (route name, permit number, etc.)
     * @returns PageTripResponse Trips retrieved successfully
     * @throws ApiError
     */
    public static getOperatorTrips(
        operatorId: string,
        page?: number,
        size: number = 10,
        sortBy: string = 'tripDate',
        sortDir: string = 'desc',
        status?: 'pending' | 'active' | 'completed' | 'cancelled' | 'delayed' | 'in_transit' | 'boarding' | 'departed',
        fromDate?: string,
        toDate?: string,
        routeGroupId?: string,
        routeId?: string,
        scheduleId?: string,
        passengerServicePermitId?: string,
        busId?: string,
        search?: string,
    ): CancelablePromise<PageTripResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/bus-operator/{operatorId}/trips',
            path: {
                'operatorId': operatorId,
            },
            query: {
                'page': page,
                'size': size,
                'sortBy': sortBy,
                'sortDir': sortDir,
                'status': status,
                'fromDate': fromDate,
                'toDate': toDate,
                'routeGroupId': routeGroupId,
                'routeId': routeId,
                'scheduleId': scheduleId,
                'passengerServicePermitId': passengerServicePermitId,
                'busId': busId,
                'search': search,
            },
            errors: {
                400: `Invalid pagination, sorting, or filter parameters`,
                404: `Operator not found`,
            },
        });
    }
    /**
     * Get today's trips for operator
     * Retrieve all trips scheduled for today for the operator
     * @param operatorId Operator ID
     * @returns TripResponse Today's trips retrieved successfully
     * @throws ApiError
     */
    public static getTodaysTrips(
        operatorId: string,
    ): CancelablePromise<Array<TripResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/bus-operator/{operatorId}/trips/today',
            path: {
                'operatorId': operatorId,
            },
            errors: {
                404: `Operator not found`,
            },
        });
    }
    /**
     * Get specific trip details for operator
     * Retrieve detailed information about a specific trip belonging to the operator
     * @param operatorId Operator ID
     * @param tripId Trip ID
     * @returns TripResponse Trip details retrieved successfully
     * @throws ApiError
     */
    public static getOperatorTripById(
        operatorId: string,
        tripId: string,
    ): CancelablePromise<TripResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/bus-operator/{operatorId}/trips/{tripId}',
            path: {
                'operatorId': operatorId,
                'tripId': tripId,
            },
            errors: {
                404: `Trip not found or doesn't belong to operator`,
            },
        });
    }
    /**
     * Assign one of the operator's own buses to a trip
     * Assigns a vehicle to a trip. The bus must belong to this operator.
     * @param operatorId Operator ID
     * @param tripId Trip ID
     * @param busId Bus ID (must belong to this operator)
     * @returns TripResponse Bus assigned successfully
     * @throws ApiError
     */
    public static assignBusToTrip(
        operatorId: string,
        tripId: string,
        busId: string,
    ): CancelablePromise<TripResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/bus-operator/{operatorId}/trips/{tripId}/assign-bus',
            path: {
                'operatorId': operatorId,
                'tripId': tripId,
            },
            query: {
                'busId': busId,
            },
            errors: {
                400: `Bus does not belong to this operator, or trip already has a bus`,
                404: `Trip or bus not found`,
            },
        });
    }
    /**
     * Assign a conductor to one of the operator's trips
     * Assigns a conductor (user-service userId) to a trip owned by this operator. Ownership of the conductor account is enforced by the caller (the operator dashboard only offers its own conductors) - core-service has no cross-service validation for this.
     * @param operatorId Operator ID
     * @param tripId Trip ID
     * @param conductorId Conductor's user-service userId
     * @returns TripResponse Conductor assigned successfully
     * @throws ApiError
     */
    public static assignConductorToTrip(
        operatorId: string,
        tripId: string,
        conductorId: string,
    ): CancelablePromise<TripResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/bus-operator/{operatorId}/trips/{tripId}/assign-conductor',
            path: {
                'operatorId': operatorId,
                'tripId': tripId,
            },
            query: {
                'conductorId': conductorId,
            },
            errors: {
                400: `Trip already has a conductor assigned`,
                404: `Trip not found or doesn't belong to operator`,
            },
        });
    }
    /**
     * Unassign the vehicle from one of the operator's trips
     * Removes the currently assigned bus from a trip owned by this operator.
     * @param operatorId Operator ID
     * @param tripId Trip ID
     * @returns TripResponse Bus removed successfully
     * @throws ApiError
     */
    public static removeBusFromTrip(
        operatorId: string,
        tripId: string,
    ): CancelablePromise<TripResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/bus-operator/{operatorId}/trips/{tripId}/remove-bus',
            path: {
                'operatorId': operatorId,
                'tripId': tripId,
            },
            errors: {
                404: `Trip not found or doesn't belong to operator`,
            },
        });
    }
    /**
     * Unassign the conductor from one of the operator's trips
     * Removes the currently assigned conductor from a trip owned by this operator.
     * @param operatorId Operator ID
     * @param tripId Trip ID
     * @returns TripResponse Conductor removed successfully
     * @throws ApiError
     */
    public static removeConductorFromTrip(
        operatorId: string,
        tripId: string,
    ): CancelablePromise<TripResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/bus-operator/{operatorId}/trips/{tripId}/remove-conductor',
            path: {
                'operatorId': operatorId,
                'tripId': tripId,
            },
            errors: {
                404: `Trip not found or doesn't belong to operator`,
            },
        });
    }
}
