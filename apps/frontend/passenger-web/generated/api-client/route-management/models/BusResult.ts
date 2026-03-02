/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LocalTime } from './LocalTime';
/**
 * Individual bus/route result
 */
export type BusResult = {
    /**
     * Data mode - REALTIME, SCHEDULE, or STATIC
     */
    dataMode?: BusResult.dataMode;
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
     * Route through (via)
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
     * Schedule ID (if schedule data available)
     */
    scheduleId?: string;
    /**
     * Schedule name
     */
    scheduleName?: string;
    /**
     * Scheduled departure time at origin stop
     */
    scheduledDepartureAtOrigin?: string;
    /**
     * Scheduled arrival time at destination stop
     */
    scheduledArrivalAtDestination?: string;
    /**
     * Trip ID (if trip data available)
     */
    tripId?: string;
    /**
     * Trip status
     */
    tripStatus?: string;
    /**
     * Actual departure time (if available)
     */
    actualDepartureTime?: string;
    /**
     * Actual arrival time (if available)
     */
    actualArrivalTime?: string;
    /**
     * Estimated arrival at origin stop based on current trip progress
     */
    estimatedArrivalAtOrigin?: LocalTime;
    /**
     * Bus ID
     */
    busId?: string;
    /**
     * Bus plate number
     */
    busPlateNumber?: string;
    /**
     * Bus model
     */
    busModel?: string;
    /**
     * Bus capacity
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
     * Whether the bus has already departed from origin
     */
    alreadyDeparted?: boolean;
    /**
     * User-friendly message about this result
     */
    statusMessage?: string;
    /**
     * Route group ID
     */
    routeGroupId?: string;
    /**
     * Route group name
     */
    routeGroupName?: string;
};
export namespace BusResult {
    /**
     * Data mode - REALTIME, SCHEDULE, or STATIC
     */
    export enum dataMode {
        REALTIME = 'REALTIME',
        SCHEDULE = 'SCHEDULE',
        STATIC = 'STATIC',
    }
}

