/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationHealthResponse } from '../models/ApplicationHealthResponse';
import type { CircuitBreakerResetResponse } from '../models/CircuitBreakerResetResponse';
import type { DependenciesHealthResponse } from '../models/DependenciesHealthResponse';
import type { DetailedHealthResponse } from '../models/DetailedHealthResponse';
import type { HealthStatusResponse } from '../models/HealthStatusResponse';
import type { PerformanceMetricsResponse } from '../models/PerformanceMetricsResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class HealthService {
    /**
     * Kubernetes readiness probe
     * Checks if the service is ready to receive traffic
     * @returns HealthStatusResponse Ok
     * @throws ApiError
     */
    public static getReadinessProbe(): CancelablePromise<HealthStatusResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health/ready',
        });
    }
    /**
     * Kubernetes liveness probe
     * Checks if the service is alive
     * @returns HealthStatusResponse Ok
     * @throws ApiError
     */
    public static getLivenessProbe(): CancelablePromise<HealthStatusResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health/live',
        });
    }
    /**
     * Basic application health check
     * Returns basic health information about the service
     * @returns ApplicationHealthResponse Ok
     * @throws ApiError
     */
    public static getApplicationHealth(): CancelablePromise<ApplicationHealthResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health',
        });
    }
    /**
     * Detailed health check with dependencies
     * Returns comprehensive health information including circuit breakers and dependencies
     * @returns DetailedHealthResponse Ok
     * @throws ApiError
     */
    public static getDetailedHealth(): CancelablePromise<DetailedHealthResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health/detailed',
        });
    }
    /**
     * Dependencies health check
     * Returns health status of external dependencies
     * @returns DependenciesHealthResponse Ok
     * @throws ApiError
     */
    public static getDependenciesHealth(): CancelablePromise<DependenciesHealthResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health/dependencies',
        });
    }
    /**
     * Performance metrics retrieval
     * Returns performance statistics and alerts
     * @param window
     * @param operation
     * @returns PerformanceMetricsResponse Ok
     * @throws ApiError
     */
    public static getPerformanceMetrics(
        window?: number,
        operation?: string,
    ): CancelablePromise<PerformanceMetricsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health/performance',
            query: {
                'window': window,
                'operation': operation,
            },
        });
    }
    /**
     * Reset circuit breakers
     * Admin operation to reset all circuit breakers
     * @returns CircuitBreakerResetResponse Ok
     * @throws ApiError
     */
    public static resetCircuitBreakers(): CancelablePromise<CircuitBreakerResetResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/health/circuit-breakers/reset',
        });
    }
}
