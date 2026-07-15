/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Calendar configuration showing which days the schedule operates
 */
export type ScheduleCalendarResponse = {
    /**
     * Unique identifier of the calendar
     */
    id?: string;
    /**
     * Operates on Mondays
     */
    monday?: boolean;
    /**
     * Operates on Tuesdays
     */
    tuesday?: boolean;
    /**
     * Operates on Wednesdays
     */
    wednesday?: boolean;
    /**
     * Operates on Thursdays
     */
    thursday?: boolean;
    /**
     * Operates on Fridays
     */
    friday?: boolean;
    /**
     * Operates on Saturdays
     */
    saturday?: boolean;
    /**
     * Operates on Sundays
     */
    sunday?: boolean;
};

