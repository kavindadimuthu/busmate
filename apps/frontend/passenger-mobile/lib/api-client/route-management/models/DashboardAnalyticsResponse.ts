/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BusPerformance } from './BusPerformance';
import type { CapacityGap } from './CapacityGap';
import type { OperatorPerformance } from './OperatorPerformance';
import type { RegionPerformance } from './RegionPerformance';
import type { RoutePerformance } from './RoutePerformance';
export type DashboardAnalyticsResponse = {
    dailyTripCounts?: Record<string, number>;
    weeklyTripCounts?: Record<string, number>;
    monthlyTripCounts?: Record<string, number>;
    topPerformingRoutes?: Array<RoutePerformance>;
    underperformingRoutes?: Array<RoutePerformance>;
    routeUtilizationRates?: Record<string, number>;
    operatorPerformance?: Array<OperatorPerformance>;
    tripsByOperator?: Record<string, number>;
    operatorEfficiencyRatings?: Record<string, number>;
    busUtilizationByModel?: Record<string, number>;
    busUtilizationByCapacity?: Record<string, number>;
    busPerformanceMetrics?: Array<BusPerformance>;
    tripsByRegion?: Record<string, number>;
    stopsByCity?: Record<string, number>;
    regionalPerformance?: Array<RegionPerformance>;
    dailyOnTimePerformance?: Record<string, number>;
    dailyCancellations?: Record<string, number>;
    dailyDelays?: Record<string, number>;
    capacityDistribution?: Record<string, number>;
    dailyCapacityUtilization?: Record<string, number>;
    capacityGaps?: Array<CapacityGap>;
};

