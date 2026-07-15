/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Detailed health response
 */
export type DetailedHealthResponse = {
    /**
     * Overall health status
     */
    status: DetailedHealthResponse.status;
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
    /**
     * Circuit breaker statistics
     */
    circuitBreakers?: any;
    /**
     * Performance health status
     */
    performance?: any;
    /**
     * Route service status
     */
    routeService?: any;
    /**
     * List of issues (if any)
     */
    issues?: Array<string>;
};
export namespace DetailedHealthResponse {
    /**
     * Overall health status
     */
    export enum status {
        HEALTHY = 'healthy',
        DEGRADED = 'degraded',
        UNHEALTHY = 'unhealthy',
    }
}

