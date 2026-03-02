/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PassengerNearbyStopsResponse } from '../models/PassengerNearbyStopsResponse';
import type { PassengerPaginatedResponsePassengerRouteResponse } from '../models/PassengerPaginatedResponsePassengerRouteResponse';
import type { PassengerPaginatedResponsePassengerStopResponse } from '../models/PassengerPaginatedResponsePassengerStopResponse';
import type { PassengerPaginatedResponsePassengerTripResponse } from '../models/PassengerPaginatedResponsePassengerTripResponse';
import type { PassengerRouteResponse } from '../models/PassengerRouteResponse';
import type { PassengerStopResponse } from '../models/PassengerStopResponse';
import type { PassengerTripResponse } from '../models/PassengerTripResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PassengerApIsService {
    /**
     * Get all available routes
     * Retrieve all bus routes with optional filtering
     * @param direction Filter by direction
     * @param searchText Search text for route names
     * @param page Page number (0-based)
     * @param size Page size
     * @returns PassengerPaginatedResponsePassengerRouteResponse Routes retrieved successfully
     * @throws ApiError
     */
    public static getAllRoutes(
        direction?: 'OUTBOUND' | 'INBOUND',
        searchText?: string,
        page?: number,
        size: number = 20,
    ): CancelablePromise<PassengerPaginatedResponsePassengerRouteResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/passenger/routes',
            query: {
                'direction': direction,
                'searchText': searchText,
                'page': page,
                'size': size,
            },
        });
    }
    /**
     * Search routes between locations
     * Find bus routes between origin and destination with basic filtering
     * @param fromStopId Origin stop ID
     * @param toStopId Destination stop ID
     * @param fromCity Origin city name
     * @param toCity Destination city name
     * @param direction Route direction
     * @param maxDistance Maximum distance in kilometers
     * @param searchText Search text for route names
     * @param page Page number (0-based)
     * @param size Page size
     * @returns PassengerPaginatedResponsePassengerRouteResponse Routes found successfully
     * @throws ApiError
     */
    public static searchRoutes(
        fromStopId?: string,
        toStopId?: string,
        fromCity?: string,
        toCity?: string,
        direction?: 'OUTBOUND' | 'INBOUND',
        maxDistance?: number,
        searchText?: string,
        page?: number,
        size: number = 20,
    ): CancelablePromise<PassengerPaginatedResponsePassengerRouteResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/passenger/routes/search',
            query: {
                'fromStopId': fromStopId,
                'toStopId': toStopId,
                'fromCity': fromCity,
                'toCity': toCity,
                'direction': direction,
                'maxDistance': maxDistance,
                'searchText': searchText,
                'page': page,
                'size': size,
            },
            errors: {
                400: `Invalid search parameters`,
                404: `No routes found for criteria`,
            },
        });
    }
    /**
     * Get detailed route information
     * Retrieve comprehensive details about a specific route including stops and schedules
     * @param routeId Route ID
     * @param includeStops Include stop details
     * @param includeSchedules Include schedule information
     * @param date Date for schedule information
     * @returns PassengerRouteResponse Route details retrieved successfully
     * @throws ApiError
     */
    public static getRouteDetails(
        routeId: string,
        includeStops: boolean = true,
        includeSchedules: boolean = true,
        date?: string,
    ): CancelablePromise<PassengerRouteResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/passenger/routes/{routeId}',
            path: {
                'routeId': routeId,
            },
            query: {
                'includeStops': includeStops,
                'includeSchedules': includeSchedules,
                'date': date,
            },
            errors: {
                404: `Route not found`,
            },
        });
    }
    /**
     * Find nearby bus stops
     * Discover bus stops within a specified radius of given coordinates
     * @param latitude Latitude coordinate
     * @param longitude Longitude coordinate
     * @param radius Search radius in kilometers
     * @param limit Maximum number of stops to return
     * @param includeRoutes Include route information for each stop
     * @returns PassengerNearbyStopsResponse Nearby stops found successfully
     * @throws ApiError
     */
    public static findNearbyStops(
        latitude: number,
        longitude: number,
        radius: number = 2,
        limit: number = 20,
        includeRoutes: boolean = true,
    ): CancelablePromise<PassengerNearbyStopsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/passenger/stops/nearby',
            query: {
                'latitude': latitude,
                'longitude': longitude,
                'radius': radius,
                'limit': limit,
                'includeRoutes': includeRoutes,
            },
            errors: {
                400: `Invalid coordinates or radius`,
            },
        });
    }
    /**
     * Search bus stops
     * Search for bus stops by name, city, or other criteria
     * @param name Stop name or partial name
     * @param city City name
     * @param searchText General search text
     * @param accessibleOnly Filter accessible stops only
     * @param page Page number (0-based)
     * @param size Page size
     * @returns PassengerPaginatedResponsePassengerStopResponse Stops found successfully
     * @throws ApiError
     */
    public static searchStops(
        name?: string,
        city?: string,
        searchText?: string,
        accessibleOnly?: boolean,
        page?: number,
        size: number = 20,
    ): CancelablePromise<PassengerPaginatedResponsePassengerStopResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/passenger/stops/search',
            query: {
                'name': name,
                'city': city,
                'searchText': searchText,
                'accessibleOnly': accessibleOnly,
                'page': page,
                'size': size,
            },
        });
    }
    /**
     * Get detailed stop information
     * Retrieve comprehensive details about a specific bus stop
     * @param stopId Stop ID
     * @param includeUpcomingTrips Include upcoming trips
     * @param date Date for trip information
     * @returns PassengerStopResponse Stop details retrieved successfully
     * @throws ApiError
     */
    public static getStopDetails(
        stopId: string,
        includeUpcomingTrips: boolean = true,
        date?: string,
    ): CancelablePromise<PassengerStopResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/passenger/stops/{stopId}',
            path: {
                'stopId': stopId,
            },
            query: {
                'includeUpcomingTrips': includeUpcomingTrips,
                'date': date,
            },
            errors: {
                404: `Stop not found`,
            },
        });
    }
    /**
     * Get routes serving a stop
     * Retrieve all bus routes that serve a specific stop
     * @param stopId Stop ID
     * @param direction Filter by direction
     * @param date Date for schedule filtering
     * @returns PassengerRouteResponse Routes retrieved successfully
     * @throws ApiError
     */
    public static getRoutesForStop(
        stopId: string,
        direction?: 'OUTBOUND' | 'INBOUND',
        date?: string,
    ): CancelablePromise<Array<PassengerRouteResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/passenger/stops/{stopId}/routes',
            path: {
                'stopId': stopId,
            },
            query: {
                'direction': direction,
                'date': date,
            },
            errors: {
                404: `Stop not found`,
            },
        });
    }
    /**
     * Get active trips
     * Retrieve currently active trips with optional filtering
     * @param routeId Filter by route ID
     * @param operatorType Filter by operator type
     * @param operatorId Filter by specific operator ID
     * @param latitude Latitude for location-based filtering
     * @param longitude Longitude for location-based filtering
     * @param radius Radius for location-based filtering in km
     * @param page Page number (0-based)
     * @param size Page size
     * @returns PassengerPaginatedResponsePassengerTripResponse Active trips retrieved successfully
     * @throws ApiError
     */
    public static getActiveTrips(
        routeId?: string,
        operatorType?: 'PRIVATE' | 'CTB',
        operatorId?: string,
        latitude?: number,
        longitude?: number,
        radius?: number,
        page?: number,
        size: number = 20,
    ): CancelablePromise<PassengerPaginatedResponsePassengerTripResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/passenger/trips/active',
            query: {
                'routeId': routeId,
                'operatorType': operatorType,
                'operatorId': operatorId,
                'latitude': latitude,
                'longitude': longitude,
                'radius': radius,
                'page': page,
                'size': size,
            },
        });
    }
    /**
     * Search trips between stops
     * Find available trips between origin and destination with filtering options
     * @param fromStopId Origin stop ID
     * @param toStopId Destination stop ID
     * @param routeId Route ID filter
     * @param travelDate Travel date (optional for status-only searches)
     * @param departureTimeFrom Departure time (earliest)
     * @param departureTimeTo Departure time (latest)
     * @param operatorType Operator type filter
     * @param operatorId Specific operator ID filter
     * @param status Trip status filter
     * @param page Page number (0-based)
     * @param size Page size
     * @returns PassengerPaginatedResponsePassengerTripResponse Trips found successfully
     * @throws ApiError
     */
    public static searchTrips(
        fromStopId?: string,
        toStopId?: string,
        routeId?: string,
        travelDate?: string,
        departureTimeFrom?: string,
        departureTimeTo?: string,
        operatorType?: 'PRIVATE' | 'CTB',
        operatorId?: string,
        status?: 'pending' | 'active' | 'completed' | 'cancelled' | 'delayed' | 'in_transit' | 'boarding' | 'departed',
        page?: number,
        size: number = 20,
    ): CancelablePromise<PassengerPaginatedResponsePassengerTripResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/passenger/trips/search',
            query: {
                'fromStopId': fromStopId,
                'toStopId': toStopId,
                'routeId': routeId,
                'travelDate': travelDate,
                'departureTimeFrom': departureTimeFrom,
                'departureTimeTo': departureTimeTo,
                'operatorType': operatorType,
                'operatorId': operatorId,
                'status': status,
                'page': page,
                'size': size,
            },
            errors: {
                400: `Invalid search parameters`,
            },
        });
    }
    /**
     * Get detailed trip information
     * Retrieve comprehensive details about a specific trip
     * @param tripId Trip ID
     * @param includeRealTimeStatus Include real-time status
     * @param includeStopTimes Include stop times
     * @returns PassengerTripResponse Trip details retrieved successfully
     * @throws ApiError
     */
    public static getTripDetails(
        tripId: string,
        includeRealTimeStatus: boolean = true,
        includeStopTimes: boolean = true,
    ): CancelablePromise<PassengerTripResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/passenger/trips/{tripId}',
            path: {
                'tripId': tripId,
            },
            query: {
                'includeRealTimeStatus': includeRealTimeStatus,
                'includeStopTimes': includeStopTimes,
            },
            errors: {
                404: `Trip not found`,
            },
        });
    }
    /**
     * Get real-time trip status
     * Retrieve current status and location information for a trip
     * @param tripId Trip ID
     * @returns PassengerTripResponse Trip status retrieved successfully
     * @throws ApiError
     */
    public static getTripStatus(
        tripId: string,
    ): CancelablePromise<PassengerTripResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/passenger/trips/{tripId}/status',
            path: {
                'tripId': tripId,
            },
            errors: {
                404: `Trip not found`,
            },
        });
    }
}
