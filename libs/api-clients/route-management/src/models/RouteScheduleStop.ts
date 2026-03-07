/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StopInfo } from './StopInfo';
/**
 * Unified stop information combining route stop, schedule stop, and stop metadata
 */
export type RouteScheduleStop = {
    /**
     * Route stop ID
     */
    routeStopId?: string;
    /**
     * Schedule stop ID
     */
    scheduleStopId?: string;
    /**
     * Stop order in both route and schedule
     */
    stopOrder?: number;
    /**
     * Stop information
     */
    stop?: StopInfo;
    /**
     * Distance from route start in km (resolved with fallback)
     */
    distanceFromStartKm?: number;
    /**
     * Verified distance from route start in km
     */
    distanceFromStartKmVerified?: number;
    /**
     * Unverified distance from route start in km (user-submitted)
     */
    distanceFromStartKmUnverified?: number;
    /**
     * Calculated distance from route start in km (system-generated)
     */
    distanceFromStartKmCalculated?: number;
    /**
     * Whether this is the user's origin stop
     */
    isOrigin?: boolean;
    /**
     * Whether this is the user's destination stop
     */
    isDestination?: boolean;
    /**
     * Verified arrival time
     */
    arrivalTime?: string;
    /**
     * Verified departure time
     */
    departureTime?: string;
    /**
     * Unverified arrival time (user-submitted)
     */
    arrivalTimeUnverified?: string;
    /**
     * Unverified departure time (user-submitted)
     */
    departureTimeUnverified?: string;
    /**
     * Calculated arrival time (system-generated)
     */
    arrivalTimeCalculated?: string;
    /**
     * Calculated departure time (system-generated)
     */
    departureTimeCalculated?: string;
    /**
     * Resolved arrival time based on preference
     */
    resolvedArrivalTime?: string;
    /**
     * Source of resolved arrival time
     */
    arrivalTimeSource?: RouteScheduleStop.arrivalTimeSource;
    /**
     * Resolved departure time based on preference
     */
    resolvedDepartureTime?: string;
    /**
     * Source of resolved departure time
     */
    departureTimeSource?: RouteScheduleStop.departureTimeSource;
};
export namespace RouteScheduleStop {
    /**
     * Source of resolved arrival time
     */
    export enum arrivalTimeSource {
        VERIFIED = 'VERIFIED',
        UNVERIFIED = 'UNVERIFIED',
        CALCULATED = 'CALCULATED',
        UNAVAILABLE = 'UNAVAILABLE',
    }
    /**
     * Source of resolved departure time
     */
    export enum departureTimeSource {
        VERIFIED = 'VERIFIED',
        UNVERIFIED = 'UNVERIFIED',
        CALCULATED = 'CALCULATED',
        UNAVAILABLE = 'UNAVAILABLE',
    }
}

