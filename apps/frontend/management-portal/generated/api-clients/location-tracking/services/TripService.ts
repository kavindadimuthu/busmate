/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponse_any_ } from '../models/ApiResponse_any_';
import type { ApiResponse_TripTrackingResponse_ } from '../models/ApiResponse_TripTrackingResponse_';
import type { StartTripTrackingRequest } from '../models/StartTripTrackingRequest';
import type { StopTripTrackingRequest } from '../models/StopTripTrackingRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TripService {
    /**
     * Start tracking a trip
     * Initializes location tracking for a scheduled trip
     * @param requestBody
     * @returns ApiResponse_TripTrackingResponse_ Ok
     * @throws ApiError
     */
    public static startTracking(
        requestBody: StartTripTrackingRequest,
    ): CancelablePromise<ApiResponse_TripTrackingResponse_> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/trips/start-tracking',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Stop trip tracking
     * @param requestBody
     * @returns ApiResponse_TripTrackingResponse_ Ok
     * @throws ApiError
     */
    public static stopTracking(
        requestBody: StopTripTrackingRequest,
    ): CancelablePromise<ApiResponse_TripTrackingResponse_> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/trips/stop-tracking',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Pause trip tracking
     * @param tripId
     * @param requestBody
     * @returns ApiResponse_TripTrackingResponse_ Ok
     * @throws ApiError
     */
    public static pauseTracking(
        tripId: string,
        requestBody: {
            reason?: string;
        },
    ): CancelablePromise<ApiResponse_TripTrackingResponse_> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/trips/pause-tracking/{tripId}',
            path: {
                'tripId': tripId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Resume trip tracking
     * @param tripId
     * @param requestBody
     * @returns ApiResponse_TripTrackingResponse_ Ok
     * @throws ApiError
     */
    public static resumeTracking(
        tripId: string,
        requestBody: {
            reason?: string;
        },
    ): CancelablePromise<ApiResponse_TripTrackingResponse_> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/trips/resume-tracking/{tripId}',
            path: {
                'tripId': tripId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get tracking status
     * @param tripId
     * @returns ApiResponse_TripTrackingResponse_ Ok
     * @throws ApiError
     */
    public static getTrackingStatus(
        tripId: string,
    ): CancelablePromise<ApiResponse_TripTrackingResponse_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/trips/tracking-status/{tripId}',
            path: {
                'tripId': tripId,
            },
        });
    }
    /**
     * Get active trips
     * @param page
     * @param limit
     * @param status
     * @param busId
     * @param routeId
     * @param driverId
     * @returns ApiResponse_any_ Ok
     * @throws ApiError
     */
    public static getActiveTrips(
        page?: number,
        limit?: number,
        status?: string,
        busId?: string,
        routeId?: string,
        driverId?: string,
    ): CancelablePromise<ApiResponse_any_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/trips/active-trips',
            query: {
                'page': page,
                'limit': limit,
                'status': status,
                'busId': busId,
                'routeId': routeId,
                'driverId': driverId,
            },
        });
    }
    /**
     * Force stop tracking (admin only)
     * @param tripId
     * @param requestBody
     * @returns ApiResponse_TripTrackingResponse_ Ok
     * @throws ApiError
     */
    public static forceStopTracking(
        tripId: string,
        requestBody: {
            reason?: string;
        },
    ): CancelablePromise<ApiResponse_TripTrackingResponse_> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/trips/force-stop-tracking/{tripId}',
            path: {
                'tripId': tripId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
