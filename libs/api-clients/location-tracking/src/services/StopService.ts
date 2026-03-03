/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponse_any_ } from '../models/ApiResponse_any_';
import type { ApiResponse_StopEventResponse_ } from '../models/ApiResponse_StopEventResponse_';
import type { ManualStopConfirmationRequest } from '../models/ManualStopConfirmationRequest';
import type { StopArrivalRequest } from '../models/StopArrivalRequest';
import type { StopDepartureRequest } from '../models/StopDepartureRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StopService {
    /**
     * Record stop arrival
     * Records arrival at a specific stop for an active trip
     * @param stopId
     * @param requestBody
     * @returns ApiResponse_StopEventResponse_ Ok
     * @throws ApiError
     */
    public static recordStopArrival(
        stopId: string,
        requestBody: StopArrivalRequest,
    ): CancelablePromise<ApiResponse_StopEventResponse_> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/stops/{stopId}/arrivals',
            path: {
                'stopId': stopId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Record stop departure
     * Records departure from a specific stop for an active trip
     * @param stopId
     * @param requestBody
     * @returns ApiResponse_StopEventResponse_ Ok
     * @throws ApiError
     */
    public static recordStopDeparture(
        stopId: string,
        requestBody: StopDepartureRequest,
    ): CancelablePromise<ApiResponse_StopEventResponse_> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/stops/{stopId}/departures',
            path: {
                'stopId': stopId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Process manual stop confirmation
     * Manually confirms stop arrival or departure when automatic detection fails
     * @param requestBody
     * @returns ApiResponse_StopEventResponse_ Ok
     * @throws ApiError
     */
    public static processManualConfirmation(
        requestBody: ManualStopConfirmationRequest,
    ): CancelablePromise<ApiResponse_StopEventResponse_> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/stops/manual-confirmation',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get next stop for trip
     * Retrieves information about the next upcoming stop for an active trip
     * @param tripId
     * @returns ApiResponse_any_ Ok
     * @throws ApiError
     */
    public static getNextStop(
        tripId: string,
    ): CancelablePromise<ApiResponse_any_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/stops/next-stop/{tripId}',
            path: {
                'tripId': tripId,
            },
        });
    }
    /**
     * Get stop progress for trip
     * Retrieves comprehensive progress information for all stops in a trip
     * @param tripId
     * @returns ApiResponse_any_ Ok
     * @throws ApiError
     */
    public static getStopProgress(
        tripId: string,
    ): CancelablePromise<ApiResponse_any_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/stops/progress/{tripId}',
            path: {
                'tripId': tripId,
            },
        });
    }
    /**
     * Get stop events
     * Retrieves historical events for a specific stop with filtering and pagination
     * @param stopId
     * @param limit
     * @param offset
     * @param startDate
     * @param endDate
     * @param eventType
     * @returns ApiResponse_any_ Ok
     * @throws ApiError
     */
    public static getStopEvents(
        stopId: string,
        limit?: number,
        offset?: number,
        startDate?: string,
        endDate?: string,
        eventType?: string,
    ): CancelablePromise<ApiResponse_any_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/stops/events/{stopId}',
            path: {
                'stopId': stopId,
            },
            query: {
                'limit': limit,
                'offset': offset,
                'startDate': startDate,
                'endDate': endDate,
                'eventType': eventType,
            },
        });
    }
}
