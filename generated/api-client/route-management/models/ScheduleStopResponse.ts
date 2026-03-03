/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LocationDto } from './LocationDto';
/**
 * Stop timing information within a schedule
 */
export type ScheduleStopResponse = {
    /**
     * Unique identifier of the schedule stop
     */
    id?: string;
    /**
     * ID of the bus stop
     */
    stopId?: string;
    /**
     * Name of the bus stop
     */
    stopName?: string;
    /**
     * Geographic location of the stop
     */
    location?: LocationDto;
    /**
     * Order of this stop in the route (0 = first)
     */
    stopOrder?: number;
    /**
     * Scheduled arrival time (verified)
     */
    arrivalTime?: string;
    /**
     * Scheduled departure time (verified)
     */
    departureTime?: string;
    /**
     * Unverified arrival time from experienced users
     */
    arrivalTimeUnverified?: string;
    /**
     * Unverified departure time from experienced users
     */
    departureTimeUnverified?: string;
    /**
     * Username who provided unverified arrival time
     */
    arrivalTimeUnverifiedBy?: string;
    /**
     * Username who provided unverified departure time
     */
    departureTimeUnverifiedBy?: string;
    /**
     * Calculated arrival time based on route distance and travel time
     */
    arrivalTimeCalculated?: string;
    /**
     * Calculated departure time based on route distance and travel time
     */
    departureTimeCalculated?: string;
};

