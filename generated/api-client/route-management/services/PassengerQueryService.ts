/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FindMyBusResponse } from '../models/FindMyBusResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PassengerQueryService {
    /**
     * Find buses between two stops
     * Find available bus services between two stops with schedule timings.
     *
     * **Response includes:**
     * - Route information (name, number, road type, via)
     * - Schedule timings (departure at origin, arrival at destination)
     * - Trip details if available (bus, operator, PSP)
     * - Time source indicators for reliability assessment
     *
     * **Time Preferences:**
     * - **VERIFIED_ONLY**: Only verified times (most reliable, fewer results)
     * - **PREFER_UNVERIFIED**: Verified > Unverified
     * - **PREFER_CALCULATED/DEFAULT**: Verified > Unverified > Calculated
     *
     * **Time Sources:**
     * Each time value includes its source (VERIFIED, UNVERIFIED, CALCULATED, UNAVAILABLE)
     * to indicate reliability.
     *
     * **Sorting:** Results sorted by departure time, then by distance.
     *
     * @param fromStopId UUID of the origin stop
     * @param toStopId UUID of the destination stop
     * @param date Date for which to find buses (defaults to today)
     * @param time Time from which to find buses (defaults to 00:00)
     * @param routeNumber Filter by route number
     * @param roadType Filter by road type
     * @param timePreference Time preference for schedule times
     * @returns FindMyBusResponse Search completed successfully
     * @throws ApiError
     */
    public static findMyBus(
        fromStopId: string,
        toStopId: string,
        date?: string,
        time?: any,
        routeNumber?: string,
        roadType?: 'NORMALWAY' | 'EXPRESSWAY',
        timePreference: 'VERIFIED_ONLY' | 'PREFER_UNVERIFIED' | 'PREFER_CALCULATED' | 'DEFAULT' = 'DEFAULT',
    ): CancelablePromise<FindMyBusResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/passenger/find-my-bus',
            query: {
                'fromStopId': fromStopId,
                'toStopId': toStopId,
                'date': date,
                'time': time,
                'routeNumber': routeNumber,
                'roadType': roadType,
                'timePreference': timePreference,
            },
            errors: {
                400: `Invalid request parameters`,
            },
        });
    }
}
