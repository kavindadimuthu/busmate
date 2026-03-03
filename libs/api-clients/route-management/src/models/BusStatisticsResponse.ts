/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type BusStatisticsResponse = {
    totalBuses?: number;
    activeBuses?: number;
    inactiveBuses?: number;
    pendingBuses?: number;
    cancelledBuses?: number;
    privateBuses?: number;
    ctbBuses?: number;
    busesByOperator?: Record<string, number>;
    busesByStatus?: Record<string, number>;
    busesByModel?: Record<string, number>;
    busesByCapacityRange?: Record<string, number>;
    averageCapacity?: number;
    totalCapacity?: number;
    minCapacity?: number;
    maxCapacity?: number;
    mostPopularModel?: string;
    operatorWithMostBuses?: string;
    activeBusPercentage?: number;
    averageBusesPerOperator?: number;
};

