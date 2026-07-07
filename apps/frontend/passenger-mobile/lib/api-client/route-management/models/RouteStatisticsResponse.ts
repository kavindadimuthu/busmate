/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RouteStatisticsResponse = {
    totalRoutes?: number;
    outboundRoutes?: number;
    inboundRoutes?: number;
    routesWithStops?: number;
    routesWithoutStops?: number;
    routesByRouteGroup?: Record<string, number>;
    routesByDirection?: Record<string, number>;
    averageDistanceKm?: number;
    minDistanceKm?: number;
    maxDistanceKm?: number;
    totalDistanceKm?: number;
    averageDurationMinutes?: number;
    minDurationMinutes?: number;
    maxDurationMinutes?: number;
    totalDurationMinutes?: number;
    totalRouteGroups?: number;
    averageRoutesPerGroup?: number;
    longestRoute?: string;
    shortestRoute?: string;
    longestDurationRoute?: string;
    shortestDurationRoute?: string;
};

