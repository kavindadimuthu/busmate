/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Record_string_any_ } from './Record_string_any_';
/**
 * Dependencies health response
 */
export type DependenciesHealthResponse = {
    /**
     * Overall dependencies status
     */
    status: DependenciesHealthResponse.status;
    /**
     * Timestamp of health check
     */
    timestamp: string;
    /**
     * Service name
     */
    service: string;
    /**
     * List of issues (if any)
     */
    issues?: Array<string>;
    /**
     * Dependencies status details
     */
    dependencies: Record_string_any_;
};
export namespace DependenciesHealthResponse {
    /**
     * Overall dependencies status
     */
    export enum status {
        HEALTHY = 'healthy',
        DEGRADED = 'degraded',
        UNHEALTHY = 'unhealthy',
    }
}

