/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Circuit breaker reset response
 */
export type CircuitBreakerResetResponse = {
    /**
     * Operation status
     */
    status: CircuitBreakerResetResponse.status;
    /**
     * Success/error message
     */
    message: string;
    /**
     * Timestamp of operation
     */
    timestamp: string;
    /**
     * Error details (if any)
     */
    error?: string;
};
export namespace CircuitBreakerResetResponse {
    /**
     * Operation status
     */
    export enum status {
        SUCCESS = 'success',
        ERROR = 'error',
    }
}

