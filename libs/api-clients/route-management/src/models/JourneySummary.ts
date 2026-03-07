/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StopInfo } from './StopInfo';
/**
 * Summary of the journey between origin and destination
 */
export type JourneySummary = {
    /**
     * Origin stop information
     */
    originStop?: StopInfo;
    /**
     * Destination stop information
     */
    destinationStop?: StopInfo;
    /**
     * Distance between origin and destination in km
     */
    distanceKm?: number;
    /**
     * Number of stops between origin and destination (exclusive)
     */
    intermediateStopCount?: number;
    /**
     * Estimated journey duration in minutes
     */
    estimatedDurationMinutes?: number;
    /**
     * Departure time from origin
     */
    departureFromOrigin?: string;
    /**
     * Source of departure time
     */
    departureTimeSource?: JourneySummary.departureTimeSource;
    /**
     * Arrival time at destination
     */
    arrivalAtDestination?: string;
    /**
     * Source of arrival time
     */
    arrivalTimeSource?: JourneySummary.arrivalTimeSource;
    /**
     * Stop order of origin in the schedule
     */
    originStopOrder?: number;
    /**
     * Stop order of destination in the schedule
     */
    destinationStopOrder?: number;
    /**
     * Status message about the journey
     */
    statusMessage?: string;
};
export namespace JourneySummary {
    /**
     * Source of departure time
     */
    export enum departureTimeSource {
        VERIFIED = 'VERIFIED',
        UNVERIFIED = 'UNVERIFIED',
        CALCULATED = 'CALCULATED',
        UNAVAILABLE = 'UNAVAILABLE',
    }
    /**
     * Source of arrival time
     */
    export enum arrivalTimeSource {
        VERIFIED = 'VERIFIED',
        UNVERIFIED = 'UNVERIFIED',
        CALCULATED = 'CALCULATED',
        UNAVAILABLE = 'UNAVAILABLE',
    }
}

