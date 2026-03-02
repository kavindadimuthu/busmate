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
     * Find available buses/routes between two stops. This API provides the best available data:
     *
     * **Data Modes:**
     * - **REALTIME**: Trip data with real-time status (ON_TIME, DELAYED, etc.)
     * - **SCHEDULE**: Schedule-based timing when no trips are available
     * - **STATIC**: Basic route information when no schedules exist
     *
     * **Algorithm:**
     * 1. Validates stops and finds all direct routes
     * 2. Fetches active schedules for the search date
     * 3. Checks for trips (real-time data)
     * 4. Returns best available data with appropriate fallbacks
     *
     * **Sorting:**
     * Results are sorted by:
     * 1. Data mode priority (REALTIME > SCHEDULE > STATIC)
     * 2. Departure time at origin
     * 3. Travel distance
     *
     * @param fromStopId UUID of the origin stop
     * @param toStopId UUID of the destination stop
     * @param date Date for which to find buses (defaults to today)
     * @param time Time from which to find buses (defaults to 00:00)
     * @param routeNumber Filter by route number
     * @param roadType Filter by road type
     * @param includeScheduledData Include schedule-based results when no trips available (default: true)
     * @param includeRouteData Include static route data as fallback when no schedules available (default: true)
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
        includeScheduledData: boolean = true,
        includeRouteData: boolean = true,
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
                'includeScheduledData': includeScheduledData,
                'includeRouteData': includeRouteData,
            },
            errors: {
                400: `Invalid request - missing or invalid parameters`,
            },
        });
    }
}
