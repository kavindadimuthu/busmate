/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Individual bus/route result with schedule and trip information
 */
export type BusResult = {
    /**
     * Route ID
     */
    routeId?: string;
    /**
     * Route name in English
     */
    routeName?: string;
    /**
     * Route name in Sinhala
     */
    routeNameSinhala?: string;
    /**
     * Route name in Tamil
     */
    routeNameTamil?: string;
    /**
     * Route number
     */
    routeNumber?: string;
    /**
     * Road type
     */
    roadType?: string;
    /**
     * Route description
     */
    routeDescription?: string;
    /**
     * Route through (via) in English
     */
    routeThrough?: string;
    /**
     * Route through in Sinhala
     */
    routeThroughSinhala?: string;
    /**
     * Route through in Tamil
     */
    routeThroughTamil?: string;
    /**
     * Route group ID
     */
    routeGroupId?: string;
    /**
     * Route group name in English
     */
    routeGroupName?: string;
    /**
     * Route group name in Sinhala
     */
    routeGroupNameSinhala?: string;
    /**
     * Route group name in Tamil
     */
    routeGroupNameTamil?: string;
    /**
     * Distance from origin to destination in km
     */
    distanceKm?: number;
    /**
     * Estimated travel duration in minutes
     */
    estimatedDurationMinutes?: number;
    /**
     * Stop order at origin
     */
    fromStopOrder?: number;
    /**
     * Stop order at destination
     */
    toStopOrder?: number;
    /**
     * Schedule ID
     */
    scheduleId?: string;
    /**
     * Schedule name
     */
    scheduleName?: string;
    /**
     * Schedule type (DAILY, WEEKDAY, WEEKEND, etc.)
     */
    scheduleType?: string;
    /**
     * Departure time at origin stop
     */
    departureAtOrigin?: string;
    /**
     * Source of departure time (VERIFIED, UNVERIFIED, CALCULATED, UNAVAILABLE)
     */
    departureAtOriginSource?: BusResult.departureAtOriginSource;
    /**
     * Arrival time at destination stop
     */
    arrivalAtDestination?: string;
    /**
     * Source of arrival time (VERIFIED, UNVERIFIED, CALCULATED, UNAVAILABLE)
     */
    arrivalAtDestinationSource?: BusResult.arrivalAtDestinationSource;
    /**
     * Whether trip data is available for this schedule
     */
    hasTripData?: boolean;
    /**
     * Trip ID (if trip exists)
     */
    tripId?: string;
    /**
     * Trip status (scheduled, active, completed, cancelled)
     */
    tripStatus?: string;
    /**
     * Actual departure time from trip (if available)
     */
    actualDepartureTime?: string;
    /**
     * Actual arrival time from trip (if available)
     */
    actualArrivalTime?: string;
    /**
     * Bus ID
     */
    busId?: string;
    /**
     * Bus registration/plate number
     */
    busPlateNumber?: string;
    /**
     * Bus model
     */
    busModel?: string;
    /**
     * Bus seating capacity
     */
    busCapacity?: number;
    /**
     * Operator ID
     */
    operatorId?: string;
    /**
     * Operator name
     */
    operatorName?: string;
    /**
     * Operator type (CTB, PRIVATE, SLTB, etc.)
     */
    operatorType?: string;
    /**
     * Passenger Service Permit ID
     */
    pspId?: string;
    /**
     * Passenger Service Permit number
     */
    pspNumber?: string;
    /**
     * Whether the service has already departed from origin stop
     */
    alreadyDeparted?: boolean;
    /**
     * User-friendly status message about this result
     */
    statusMessage?: string;
};
export namespace BusResult {
    /**
     * Source of departure time (VERIFIED, UNVERIFIED, CALCULATED, UNAVAILABLE)
     */
    export enum departureAtOriginSource {
        VERIFIED = 'VERIFIED',
        UNVERIFIED = 'UNVERIFIED',
        CALCULATED = 'CALCULATED',
        UNAVAILABLE = 'UNAVAILABLE',
    }
    /**
     * Source of arrival time (VERIFIED, UNVERIFIED, CALCULATED, UNAVAILABLE)
     */
    export enum arrivalAtDestinationSource {
        VERIFIED = 'VERIFIED',
        UNVERIFIED = 'UNVERIFIED',
        CALCULATED = 'CALCULATED',
        UNAVAILABLE = 'UNAVAILABLE',
    }
}

