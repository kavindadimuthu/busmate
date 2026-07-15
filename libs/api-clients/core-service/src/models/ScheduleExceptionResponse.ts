/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Exception date configuration for special service dates
 */
export type ScheduleExceptionResponse = {
    /**
     * Unique identifier of the exception
     */
    id?: string;
    /**
     * The exception date
     */
    exceptionDate?: string;
    /**
     * Type of exception
     */
    exceptionType?: ScheduleExceptionResponse.exceptionType;
};
export namespace ScheduleExceptionResponse {
    /**
     * Type of exception
     */
    export enum exceptionType {
        ADDED = 'ADDED',
        REMOVED = 'REMOVED',
    }
}

