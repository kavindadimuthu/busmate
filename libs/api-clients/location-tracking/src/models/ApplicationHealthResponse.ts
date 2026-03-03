/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Application health response
 */
export type ApplicationHealthResponse = {
    /**
     * Health status
     */
    status: ApplicationHealthResponse.status;
    /**
     * Timestamp of health check
     */
    timestamp: string;
    /**
     * Service name
     */
    service: string;
    /**
     * Uptime in seconds
     */
    uptime: number;
    /**
     * Service version
     */
    version: string;
};
export namespace ApplicationHealthResponse {
    /**
     * Health status
     */
    export enum status {
        HEALTHY = 'healthy',
        UNHEALTHY = 'unhealthy',
    }
}

