/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DashboardAlertsResponse } from '../models/DashboardAlertsResponse';
import type { DashboardAnalyticsResponse } from '../models/DashboardAnalyticsResponse';
import type { DashboardKPIResponse } from '../models/DashboardKPIResponse';
import type { DashboardOverviewResponse } from '../models/DashboardOverviewResponse';
import type { KPIMetric } from '../models/KPIMetric';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminDashboardService {
    /**
     * Get system alerts
     * Retrieves all system alerts categorized by severity (critical, warning, informational) with alert details and action recommendations.
     * @returns DashboardAlertsResponse Alerts retrieved successfully
     * @throws ApiError
     */
    public static getAlerts(): CancelablePromise<DashboardAlertsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/alerts',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get critical alerts only
     * Retrieves only critical system alerts that require immediate attention.
     * @returns any Critical alerts retrieved successfully
     * @throws ApiError
     */
    public static getCriticalAlerts(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/alerts/critical',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get alerts summary
     * Retrieves a summary of alerts showing counts by type and severity without detailed alert content.
     * @returns any Alerts summary retrieved successfully
     * @throws ApiError
     */
    public static getAlertsSummary(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/alerts/summary',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get comprehensive analytics
     * Retrieves detailed analytics including temporal trends, route performance, operator analytics, fleet metrics, geographic distribution, and service quality analytics.
     * @returns DashboardAnalyticsResponse Analytics retrieved successfully
     * @throws ApiError
     */
    public static getAnalytics(): CancelablePromise<DashboardAnalyticsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/analytics',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get capacity analytics
     * Retrieves capacity-related analytics including capacity distribution, utilization trends, and identified capacity gaps that need attention.
     * @returns any Capacity analytics retrieved successfully
     * @throws ApiError
     */
    public static getCapacityAnalytics(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/analytics/capacity',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get fleet analytics
     * Retrieves fleet performance data including bus utilization by model and capacity, and individual bus performance metrics.
     * @returns any Fleet analytics retrieved successfully
     * @throws ApiError
     */
    public static getFleetAnalytics(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/analytics/fleet',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get geographic analytics
     * Retrieves geographic distribution of services including trips by region, stops by city, and regional performance metrics.
     * @returns any Geographic analytics retrieved successfully
     * @throws ApiError
     */
    public static getGeographicAnalytics(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/analytics/geographic',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get operator performance analytics
     * Retrieves operator performance metrics, trip distribution by operator, and efficiency ratings.
     * @returns any Operator analytics retrieved successfully
     * @throws ApiError
     */
    public static getOperatorAnalytics(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/analytics/operators',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get route performance analytics
     * Retrieves detailed route performance data including top performing routes, underperforming routes, and utilization rates.
     * @returns any Route analytics retrieved successfully
     * @throws ApiError
     */
    public static getRouteAnalytics(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/analytics/routes',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get temporal trend analytics
     * Retrieves temporal analytics including daily, weekly, and monthly trip trends, along with service quality trends over time.
     * @returns any Trend analytics retrieved successfully
     * @throws ApiError
     */
    public static getTrendAnalytics(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/analytics/trends',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get system health check
     * Performs a comprehensive system health check returning operational status of all major components.
     * @returns any Health check completed successfully
     * @throws ApiError
     */
    public static getHealthCheck(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/health',
            errors: {
                500: `System health check failed`,
            },
        });
    }
    /**
     * Get comprehensive KPI dashboard
     * Retrieves all Key Performance Indicators including performance KPIs, operational KPIs, growth metrics, quality indicators, and financial efficiency metrics.
     * @returns DashboardKPIResponse KPIs retrieved successfully
     * @throws ApiError
     */
    public static getKpIs(): CancelablePromise<DashboardKPIResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/kpis',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get operational KPIs only
     * Retrieves operational KPIs including fleet availability, route coverage, permit utilization, and stop connectivity metrics.
     * @returns any Operational KPIs retrieved successfully
     * @throws ApiError
     */
    public static getOperationalKpIs(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/kpis/operational',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get performance KPIs only
     * Retrieves performance-focused KPIs including on-time performance, schedule adherence, bus utilization, route efficiency, and operator performance.
     * @returns any Performance KPIs retrieved successfully
     * @throws ApiError
     */
    public static getPerformanceKpIs(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/kpis/performance',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get KPI targets vs actuals
     * Retrieves KPI metrics showing target vs actual performance with variance calculations and status indicators.
     * @returns KPIMetric KPI targets retrieved successfully
     * @throws ApiError
     */
    public static getKpiTargets(): CancelablePromise<Record<string, KPIMetric>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/kpis/targets',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get dashboard overview
     * Retrieves comprehensive system overview including entity counts, active status, today's activity, and system health indicators. Perfect for admin dashboard homepage.
     * @returns DashboardOverviewResponse Dashboard overview retrieved successfully
     * @throws ApiError
     */
    public static getDashboardOverview(): CancelablePromise<DashboardOverviewResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/overview',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get quick dashboard statistics
     * Retrieves essential system statistics for dashboard widgets - counts of entities, active status, and basic performance metrics.
     * @returns any Quick stats retrieved successfully
     * @throws ApiError
     */
    public static getQuickStats(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/overview/quick-stats',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get system status
     * Retrieves current system status including health score, operational status, and key performance indicators.
     * @returns any System status retrieved successfully
     * @throws ApiError
     */
    public static getSystemStatus(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/status',
            errors: {
                500: `Internal server error`,
            },
        });
    }
}
