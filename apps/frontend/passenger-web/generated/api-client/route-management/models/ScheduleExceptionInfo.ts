/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schedule exception
 */
export type ScheduleExceptionInfo = {
    id?: string;
    /**
     * Date of the exception
     */
    exceptionDate?: string;
    /**
     * Type of exception (ADDED, REMOVED)
     */
    exceptionType?: string;
    /**
     * Reason for the exception
     */
    reason?: string;
    /**
     * Whether this exception affects the query date
     */
    affectsQueryDate?: boolean;
};

