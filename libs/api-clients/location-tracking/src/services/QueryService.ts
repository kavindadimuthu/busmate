/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponse_any_ } from '../models/ApiResponse_any_';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class QueryService {
    /**
     * Get active trips with current location and ETA information
     * @param page
     * @param limit
     * @param busId
     * @param routeId
     * @param driverId
     * @returns ApiResponse_any_ Ok
     * @throws ApiError
     */
    public static getActiveTrips(
        page?: number,
        limit?: number,
        busId?: string,
        routeId?: string,
        driverId?: string,
    ): CancelablePromise<ApiResponse_any_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/queries/active-trips',
            query: {
                'page': page,
                'limit': limit,
                'busId': busId,
                'routeId': routeId,
                'driverId': driverId,
            },
        });
    }
    /**
     * Get current location for a specific trip
     * @param tripId
     * @returns ApiResponse_any_ Ok
     * @throws ApiError
     */
    public static getCurrentTripLocation(
        tripId: string,
    ): CancelablePromise<ApiResponse_any_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/queries/trip-location/{tripId}',
            path: {
                'tripId': tripId,
            },
        });
    }
    /**
     * Get trip location history
     * @param tripId
     * @param startTime
     * @param endTime
     * @param limit
     * @param offset
     * @returns ApiResponse_any_ Ok
     * @throws ApiError
     */
    public static getTripLocationHistory(
        tripId: string,
        startTime?: string,
        endTime?: string,
        limit?: number,
        offset?: number,
    ): CancelablePromise<ApiResponse_any_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/queries/trip-location-history/{tripId}',
            path: {
                'tripId': tripId,
            },
            query: {
                'startTime': startTime,
                'endTime': endTime,
                'limit': limit,
                'offset': offset,
            },
        });
    }
    /**
     * Get current bus location
     * @param busId
     * @returns ApiResponse_any_ Ok
     * @throws ApiError
     */
    public static getCurrentBusLocation(
        busId: string,
    ): CancelablePromise<ApiResponse_any_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/queries/bus-location/{busId}',
            path: {
                'busId': busId,
            },
        });
    }
    /**
     * Get active buses on a specific route
     * @param routeId
     * @returns ApiResponse_any_ Ok
     * @throws ApiError
     */
    public static getActiveBusesOnRoute(
        routeId: string,
    ): CancelablePromise<ApiResponse_any_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/queries/route-buses/{routeId}',
            path: {
                'routeId': routeId,
            },
        });
    }
    /**
     * Get expected arrivals at a specific stop
     * @param stopId
     * @param timeWindow
     * @returns ApiResponse_any_ Ok
     * @throws ApiError
     */
    public static getStopArrivals(
        stopId: string,
        timeWindow?: number,
    ): CancelablePromise<ApiResponse_any_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/queries/stop-arrivals/{stopId}',
            path: {
                'stopId': stopId,
            },
            query: {
                'timeWindow': timeWindow,
            },
        });
    }
    /**
     * Get the next stop for a trip
     * @param tripId
     * @returns ApiResponse_any_ Ok
     * @throws ApiError
     */
    public static getNextStop(
        tripId: string,
    ): CancelablePromise<ApiResponse_any_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/queries/trip-next-stop/{tripId}',
            path: {
                'tripId': tripId,
            },
        });
    }
    /**
     * Get trip progress information
     * @param tripId
     * @returns ApiResponse_any_ Ok
     * @throws ApiError
     */
    public static getTripProgress(
        tripId: string,
    ): CancelablePromise<ApiResponse_any_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/queries/trip-progress/{tripId}',
            path: {
                'tripId': tripId,
            },
        });
    }
}
