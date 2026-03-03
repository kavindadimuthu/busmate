/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DashboardOverviewResponse = {
    totalStops?: number;
    totalRoutes?: number;
    totalOperators?: number;
    totalBuses?: number;
    totalSchedules?: number;
    totalTrips?: number;
    totalPermits?: number;
    activeStops?: number;
    activeRoutes?: number;
    activeOperators?: number;
    activeBuses?: number;
    activeSchedules?: number;
    activeTrips?: number;
    activePermits?: number;
    todayTrips?: number;
    todayCompletedTrips?: number;
    todayCancelledTrips?: number;
    todayDelayedTrips?: number;
    systemHealthScore?: number;
    operationalEfficiency?: number;
    onTimePerformance?: number;
    capacityUtilization?: number;
    totalCapacity?: number;
    averageBusCapacity?: number;
    totalRouteKilometers?: number;
    routeGroupsCount?: number;
    systemStatus?: string;
    lastUpdated?: string;
    operatorTypesDistribution?: Record<string, number>;
    tripStatusDistribution?: Record<string, number>;
    busStatusDistribution?: Record<string, number>;
};

