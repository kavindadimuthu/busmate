/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type StopStatisticsResponse = {
    totalStops?: number;
    accessibleStops?: number;
    nonAccessibleStops?: number;
    stopsWithDescription?: number;
    stopsWithoutDescription?: number;
    stopsByState?: Record<string, number>;
    stopsByCity?: Record<string, number>;
    stopsByAccessibility?: Record<string, number>;
    averageStopsPerState?: number;
    averageStopsPerCity?: number;
    mostPopulatedState?: string;
    leastPopulatedState?: string;
    mostPopulatedCity?: string;
    leastPopulatedCity?: string;
    accessibleStopsPercentage?: number;
    nonAccessibleStopsPercentage?: number;
    totalStates?: number;
    totalCities?: number;
};

