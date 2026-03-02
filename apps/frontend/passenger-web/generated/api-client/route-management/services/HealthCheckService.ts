/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class HealthCheckService {
    /**
     * Basic health check
     * Returns basic service health status - useful for load balancers and monitoring systems
     * @returns any Service is healthy
     * @throws ApiError
     */
    public static getBasicHealth(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/health',
            errors: {
                503: `Service is unhealthy`,
            },
        });
    }
    /**
     * Service information
     * Returns detailed service information including version and build details
     * @returns any Service information retrieved successfully
     * @throws ApiError
     */
    public static getServiceInfo(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/health/info',
        });
    }
    /**
     * Liveness check
     * Returns service liveness status - useful for Kubernetes liveness probes
     * @returns any Service is alive
     * @throws ApiError
     */
    public static getLivenessCheck(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/health/live',
            errors: {
                503: `Service should be restarted`,
            },
        });
    }
    /**
     * Readiness check
     * Returns detailed readiness status including database connectivity - useful for Kubernetes readiness probes
     * @returns any Service is ready
     * @throws ApiError
     */
    public static getReadinessCheck(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/health/ready',
            errors: {
                503: `Service is not ready`,
            },
        });
    }
}
