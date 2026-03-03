/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StopInfo } from './StopInfo';
/**
 * Schedule stop with comprehensive timing information
 */
export type ScheduleStopDetails = {
    /**
     * Schedule stop ID
     */
    scheduleStopId?: string;
    /**
     * Stop order in the schedule
     */
    stopOrder?: number;
    /**
     * Stop information
     */
    stop?: StopInfo;
    /**
     * Distance from route start in km
     */
    distanceFromStartKm?: number;
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
    arrivalTimeSource?: ScheduleStopDetails.arrivalTimeSource;
    /**
     * Resolved departure time based on preference
     */
    resolvedDepartureTime?: string;
    /**
     * Source of resolved departure time
     */
    departureTimeSource?: ScheduleStopDetails.departureTimeSource;
};
export namespace ScheduleStopDetails {
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

