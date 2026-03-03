/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Details of a successfully imported schedule
 */
export type CreatedSchedule = {
    /**
     * UUID of the created/updated schedule
     */
    id?: string;
    /**
     * Name of the schedule
     */
    name?: string;
    /**
     * Route ID the schedule belongs to
     */
    routeId?: string;
    /**
     * Route name
     */
    routeName?: string;
    /**
     * Action taken
     */
    action?: string;
    /**
     * Number of stops created for this schedule
     */
    stopsCount?: number;
    /**
     * Starting row number in CSV for this schedule
     */
    startRowNumber?: number;
    /**
     * Ending row number in CSV for this schedule
     */
    endRowNumber?: number;
};

