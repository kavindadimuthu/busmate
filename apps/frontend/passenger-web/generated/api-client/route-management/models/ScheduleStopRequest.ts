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
     * Time when bus arrives at this stop (24-hour format HH:mm:ss)
     */
    arrivalTime?: string;
    /**
     * Time when bus departs from this stop (24-hour format HH:mm:ss). Must be >= arrivalTime
     */
    departureTime?: string;
};

