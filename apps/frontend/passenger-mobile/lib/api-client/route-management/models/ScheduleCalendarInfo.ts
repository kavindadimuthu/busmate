/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schedule calendar - days of operation
 */
export type ScheduleCalendarInfo = {
    monday?: boolean;
    tuesday?: boolean;
    wednesday?: boolean;
    thursday?: boolean;
    friday?: boolean;
    saturday?: boolean;
    sunday?: boolean;
    /**
     * Whether the schedule operates on the query date based on calendar
     */
    operatesOnQueryDate?: boolean;
    /**
     * Summary of operating days
     */
    operatingDaysSummary?: string;
};

