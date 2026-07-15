/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TripResponse } from '../models/TripResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ConductorSelfServiceService {
    /**
     * Get trips assigned to this conductor
     * Retrieve every trip whose conductorId matches the given conductor, optionally filtered by status.
     * @param conductorId Conductor's user-service userId
     * @param status Filter by trip status
     * @returns TripResponse Trips retrieved successfully
     * @throws ApiError
     */
    public static getMyTrips(
        conductorId: string,
        status?: 'pending' | 'active' | 'completed' | 'cancelled' | 'delayed' | 'in_transit' | 'boarding' | 'departed',
    ): CancelablePromise<Array<TripResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/conductor/{conductorId}/trips',
            path: {
                'conductorId': conductorId,
            },
            query: {
                'status': status,
            },
        });
    }
    /**
     * Get a specific trip assigned to this conductor
     * Retrieve trip details, verifying the trip is actually assigned to this conductor.
     * @param conductorId Conductor's user-service userId
     * @param tripId Trip ID
     * @returns TripResponse Trip retrieved successfully
     * @throws ApiError
     */
    public static getMyTripById(
        conductorId: string,
        tripId: string,
    ): CancelablePromise<TripResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/conductor/{conductorId}/trips/{tripId}',
            path: {
                'conductorId': conductorId,
                'tripId': tripId,
            },
            errors: {
                404: `Trip not found or not assigned to this conductor`,
            },
        });
    }
    /**
     * Cancel one of this conductor's trips
     * @param conductorId
     * @param tripId
     * @param reason
     * @returns TripResponse Trip cancelled successfully
     * @throws ApiError
     */
    public static cancelMyTrip(
        conductorId: string,
        tripId: string,
        reason: string,
    ): CancelablePromise<TripResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/conductor/{conductorId}/trips/{tripId}/cancel',
            path: {
                'conductorId': conductorId,
                'tripId': tripId,
            },
            query: {
                'reason': reason,
            },
            errors: {
                404: `Trip not found or not assigned to this conductor`,
            },
        });
    }
    /**
     * Complete one of this conductor's trips
     * @param conductorId
     * @param tripId
     * @returns TripResponse Trip completed successfully
     * @throws ApiError
     */
    public static completeMyTrip(
        conductorId: string,
        tripId: string,
    ): CancelablePromise<TripResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/conductor/{conductorId}/trips/{tripId}/complete',
            path: {
                'conductorId': conductorId,
                'tripId': tripId,
            },
            errors: {
                404: `Trip not found or not assigned to this conductor`,
            },
        });
    }
    /**
     * Start one of this conductor's trips
     * @param conductorId
     * @param tripId
     * @returns TripResponse Trip started successfully
     * @throws ApiError
     */
    public static startMyTrip(
        conductorId: string,
        tripId: string,
    ): CancelablePromise<TripResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/conductor/{conductorId}/trips/{tripId}/start',
            path: {
                'conductorId': conductorId,
                'tripId': tripId,
            },
            errors: {
                404: `Trip not found or not assigned to this conductor`,
            },
        });
    }
}
