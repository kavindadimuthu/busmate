/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Exception date configuration for adding or removing service on specific dates
 */
export type ScheduleExceptionRequest = {
    /**
     * The specific date for this exception (YYYY-MM-DD)
     */
    exceptionDate: string;
    /**
     * Type of exception
     */
    exceptionType: ScheduleExceptionRequest.exceptionType;
};
export namespace ScheduleExceptionRequest {
    /**
     * Type of exception
     */
    export enum exceptionType {
        ADDED = 'ADDED',
        REMOVED = 'REMOVED',
    }
}

