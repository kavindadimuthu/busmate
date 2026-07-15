/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponse_any_ } from '../models/ApiResponse_any_';
import type { ApiResponse_any_Array_ } from '../models/ApiResponse_any_Array_';
import type { ApiResponse_LocationUpdateResponse_ } from '../models/ApiResponse_LocationUpdateResponse_';
import type { ApiResponse_LocationUpdateResponse_Array_ } from '../models/ApiResponse_LocationUpdateResponse_Array_';
import type { BatchLocationUpdateRequest } from '../models/BatchLocationUpdateRequest';
import type { LocationUpdateRequest } from '../models/LocationUpdateRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class LocationService {
    /**
     * Update location for an active trip
     * Records GPS location data from a device during an active trip
     * @param requestBody
     * @returns ApiResponse_LocationUpdateResponse_ Location updated successfully
     * @throws ApiError
     */
    public static updateLocation(
        requestBody: LocationUpdateRequest,
    ): CancelablePromise<ApiResponse_LocationUpdateResponse_> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/location/update',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Batch update multiple locations
     * Processes multiple GPS location updates in a single request
     * @param requestBody
     * @returns ApiResponse_LocationUpdateResponse_Array_ Batch location updates processed
     * @throws ApiError
     */
    public static batchUpdateLocation(
        requestBody: BatchLocationUpdateRequest,
    ): CancelablePromise<ApiResponse_LocationUpdateResponse_Array_> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/location/batch-update',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Validate GPS coordinates
     * Validates GPS coordinates and returns location information
     * @param latitude
     * @param longitude
     * @param speed
     * @param accuracy
     * @returns ApiResponse_any_ GPS coordinates validated
     * @throws ApiError
     */
    public static validateGpsCoordinates(
        latitude: number,
        longitude: number,
        speed?: number,
        accuracy?: number,
    ): CancelablePromise<ApiResponse_any_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/location/validate',
            query: {
                'latitude': latitude,
                'longitude': longitude,
                'speed': speed,
                'accuracy': accuracy,
            },
        });
    }
    /**
     * Get latest location for a trip
     * Retrieves the most recent location update for a specific trip
     * @param tripId
     * @returns ApiResponse_any_ Latest location retrieved
     * @throws ApiError
     */
    public static getLatestLocation(
        tripId: string,
    ): CancelablePromise<ApiResponse_any_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/location/trip/{tripId}/latest',
            path: {
                'tripId': tripId,
            },
        });
    }
    /**
     * Get location history for a trip
     * Retrieves historical location data for a specific trip with pagination
     * @param tripId
     * @param startTime
     * @param endTime
     * @param limit
     * @param offset
     * @returns ApiResponse_any_Array_ Location history retrieved
     * @throws ApiError
     */
    public static getLocationHistory(
        tripId: string,
        startTime?: string,
        endTime?: string,
        limit: number = 100,
        offset?: number,
    ): CancelablePromise<ApiResponse_any_Array_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/location/trip/{tripId}/history',
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
}
