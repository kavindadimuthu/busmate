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
     * Scheduled arrival time
     */
    arrivalTime?: string;
    /**
     * Scheduled departure time
     */
    departureTime?: string;
};

