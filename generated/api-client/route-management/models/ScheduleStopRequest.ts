/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Stop timing information within a schedule
 */
export type ScheduleStopRequest = {
    /**
     * ID of existing schedule stop (used for updates only, omit for new schedules)
     */
    id?: string;
    /**
     * UUID of the bus stop
     */
    stopId: string;
    /**
     * Order of this stop in the route (0 = first stop, 1 = second stop, etc.)
     */
    stopOrder: number;
    /**
     * Time when bus arrives at this stop - verified (24-hour format HH:mm:ss)
     */
    arrivalTime?: string;
    /**
     * Time when bus departs from this stop - verified (24-hour format HH:mm:ss). Must be >= arrivalTime
     */
    departureTime?: string;
    /**
     * Unverified arrival time from experienced users (24-hour format HH:mm:ss)
     */
    arrivalTimeUnverified?: string;
    /**
     * Unverified departure time from experienced users (24-hour format HH:mm:ss)
     */
    departureTimeUnverified?: string;
    /**
     * Username who provided unverified arrival time (auto-set from authentication if not provided)
     */
    arrivalTimeUnverifiedBy?: string;
    /**
     * Username who provided unverified departure time (auto-set from authentication if not provided)
     */
    departureTimeUnverifiedBy?: string;
    /**
     * Optional calculated arrival time. If not provided, will be auto-calculated by database trigger
     */
    arrivalTimeCalculated?: string;
    /**
     * Optional calculated departure time. If not provided, will be auto-calculated by database trigger
     */
    departureTimeCalculated?: string;
};

