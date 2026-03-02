/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FindMyBusDetailsResponse } from '../models/FindMyBusDetailsResponse';
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
    /**
     * Get comprehensive schedule/trip details
     * Get detailed information for a specific schedule and optionally a specific trip.
     * Use this after Find My Bus to get complete schedule information.
     *
     * **Response includes:**
     * - **Route information**: Full route details with route group
     * - **Schedule information**: Complete schedule with ALL stops (not just origin/destination)
     * - **All time types**: Verified, unverified, and calculated times for each stop
     * - **Calendar info**: Which days the schedule operates
     * - **Exceptions**: Cancelled or specially added dates
     * - **Trip details** (if tripId provided): Bus, operator, PSP, real-time data
     * - **Journey summary**: Quick view of origin-destination with resolved times
     *
     * **Time Preferences:**
     * - **VERIFIED_ONLY**: Only verified times (most reliable)
     * - **PREFER_UNVERIFIED**: Verified > Unverified
     * - **PREFER_CALCULATED/DEFAULT**: Verified > Unverified > Calculated
     *
     * All three time types are always returned for each stop, plus the resolved
     * time based on the selected preference.
     *
     * @param scheduleId UUID of the schedule
     * @param fromStopId UUID of the origin stop
     * @param toStopId UUID of the destination stop
     * @param tripId Optional UUID of a specific trip for bus/operator details
     * @param date Date for context (calendar/exceptions)
     * @param timePreference Time preference for resolved schedule times
     * @returns FindMyBusDetailsResponse Details retrieved successfully
     * @throws ApiError
     */
    public static findMyBusDetails(
        scheduleId: string,
        fromStopId: string,
        toStopId: string,
        tripId?: string,
        date?: string,
        timePreference: 'VERIFIED_ONLY' | 'PREFER_UNVERIFIED' | 'PREFER_CALCULATED' | 'DEFAULT' = 'DEFAULT',
    ): CancelablePromise<FindMyBusDetailsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/passenger/find-my-bus-details',
            query: {
                'scheduleId': scheduleId,
                'fromStopId': fromStopId,
                'toStopId': toStopId,
                'tripId': tripId,
                'date': date,
                'timePreference': timePreference,
            },
            errors: {
                400: `Invalid request parameters`,
                404: `Schedule or stops not found`,
            },
        });
    }
}
