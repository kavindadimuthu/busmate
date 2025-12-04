package com.busmate.routeschedule.dto.response.dashboard;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;

@Data
public class DashboardOverviewResponse {
    // System Overview Counts
    private Long totalStops;
    private Long totalRoutes;
    private Long totalOperators;
    private Long totalBuses;
    private Long totalSchedules;
    private Long totalTrips;
    private Long totalPermits;
    
    // Active Entities
    private Long activeStops;
    private Long activeRoutes;
    private Long activeOperators;
    private Long activeBuses;
    private Long activeSchedules;
    private Long activeTrips;
    private Long activePermits;
    
    // Today's Activity
    private Long todayTrips;
    private Long todayCompletedTrips;
    private Long todayCancelledTrips;
    private Long todayDelayedTrips;
    
    // System Health Indicators
    private Double systemHealthScore; // 0-100
    private Double operationalEfficiency; // percentage
    private Double onTimePerformance; // percentage
    private Double capacityUtilization; // percentage
    
    // Quick Stats
    private Integer totalCapacity;
    private Integer averageBusCapacity;
    private Long totalRouteKilometers;
    private Long routeGroupsCount;
    
    // Operational Status
    private String systemStatus; // "operational", "maintenance", "alert"
    private LocalDateTime lastUpdated;
    
    // Distribution summaries
    private Map<String, Long> operatorTypesDistribution;
    private Map<String, Long> tripStatusDistribution;
    private Map<String, Long> busStatusDistribution;
}