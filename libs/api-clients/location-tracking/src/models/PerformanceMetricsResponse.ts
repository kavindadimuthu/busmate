/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Performance metrics response
 */
export type PerformanceMetricsResponse = {
    /**
     * Timestamp of metrics collection
     */
    timestamp: string;
    /**
     * Time window description
     */
    timeWindow: string;
    /**
     * Operation name
     */
    operation: string;
    /**
     * Performance statistics
     */
    stats: any;
    /**
     * Performance alerts
     */
    alerts: {
        /**
         * Critical alerts
         */
        critical: Array<any>;
        /**
         * Recent alerts
         */
        recent: Array<any>;
    };
};

