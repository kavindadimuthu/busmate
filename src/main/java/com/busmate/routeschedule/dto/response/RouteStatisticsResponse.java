package com.busmate.routeschedule.dto.response;

import lombok.Data;
import java.util.Map;

@Data
public class RouteStatisticsResponse {
    private Long totalRoutes;
    private Long outboundRoutes;
    private Long inboundRoutes;
    private Long routesWithStops;
    private Long routesWithoutStops;
    private Map<String, Long> routesByRouteGroup;
    private Map<String, Long> routesByDirection;
    private Double averageDistanceKm;
    private Double minDistanceKm;
    private Double maxDistanceKm;
    private Double totalDistanceKm;
    private Double averageDurationMinutes;
    private Double minDurationMinutes;
    private Double maxDurationMinutes;
    private Double totalDurationMinutes;
    private Long totalRouteGroups;
    private Double averageRoutesPerGroup;
    private String longestRoute;
    private String shortestRoute;
    private String longestDurationRoute;
    private String shortestDurationRoute;
}