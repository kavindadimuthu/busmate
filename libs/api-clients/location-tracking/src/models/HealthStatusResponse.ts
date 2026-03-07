/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Basic health status response
 */
export type HealthStatusResponse = {
    /**
     * Health status
     */
    status: HealthStatusResponse.status;
    /**
     * Timestamp of health check
     */
    timestamp?: string;
    /**
     * Reason for status (if unhealthy)
     */
    reason?: string;
    /**
     * Additional error information
     */
    error?: string;
};
export namespace HealthStatusResponse {
    /**
     * Health status
     */
    export enum status {
        READY = 'ready',
        NOT_READY = 'not ready',
        ALIVE = 'alive',
        HEALTHY = 'healthy',
        UNHEALTHY = 'unhealthy',
        DEGRADED = 'degraded',
    }
}

