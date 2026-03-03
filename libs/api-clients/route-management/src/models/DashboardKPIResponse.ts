/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { KPIMetric } from './KPIMetric';
export type DashboardKPIResponse = {
    onTimePerformance?: number;
    scheduleAdherence?: number;
    busUtilizationRate?: number;
    routeEfficiency?: number;
    operatorPerformance?: number;
    serviceReliability?: number;
    fleetAvailability?: number;
    routeCoverage?: number;
    permitUtilization?: number;
    stopConnectivity?: number;
    totalSeatingCapacity?: number;
    capacityUtilizationDaily?: number;
    capacityUtilizationWeekly?: number;
    routeExpansionRate?: number;
    fleetGrowthRate?: number;
    accessibilityCompliance?: number;
    modernFleetRatio?: number;
    serviceFrequency?: number;
    geographicalCoverage?: number;
    costPerTrip?: number;
    revenuePerSeat?: number;
    operationalCostRatio?: number;
    performanceTrends?: Record<string, number>;
    kpiStatus?: Record<string, string>;
    kpiMetrics?: Record<string, KPIMetric>;
};

