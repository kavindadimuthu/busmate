package com.busmate.routeschedule.dto.response.dashboard;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
public class DashboardAnalyticsResponse {
    // Temporal Analytics
    private Map<String, Long> dailyTripCounts; // last 30 days
    private Map<String, Long> weeklyTripCounts; // last 12 weeks
    private Map<String, Long> monthlyTripCounts; // last 12 months
    
    // Route Performance Analytics
    private List<RoutePerformance> topPerformingRoutes;
    private List<RoutePerformance> underperformingRoutes;
    private Map<String, Double> routeUtilizationRates;
    
    // Operator Analytics
    private List<OperatorPerformance> operatorPerformance;
    private Map<String, Long> tripsByOperator;
    private Map<String, Double> operatorEfficiencyRatings;
    
    // Fleet Analytics
    private Map<String, Long> busUtilizationByModel;
    private Map<String, Long> busUtilizationByCapacity;
    private List<BusPerformance> busPerformanceMetrics;
    
    // Geographic Analytics
    private Map<String, Long> tripsByRegion;
    private Map<String, Long> stopsByCity;
    private List<RegionPerformance> regionalPerformance;
    
    // Service Quality Analytics
    private Map<LocalDate, Double> dailyOnTimePerformance;
    private Map<LocalDate, Long> dailyCancellations;
    private Map<LocalDate, Long> dailyDelays;
    
    // Capacity Analytics
    private Map<String, Integer> capacityDistribution;
    private Map<LocalDate, Double> dailyCapacityUtilization;
    private List<CapacityGap> capacityGaps; // routes needing more capacity
    
    @Data
    public static class RoutePerformance {
        private String routeId;
        private String routeName;
        private Long totalTrips;
        private Long completedTrips;
        private Double completionRate;
        private Double avgDelay; // in minutes
        private Double onTimePerformance;
        private String performance; // "excellent", "good", "fair", "poor"
    }
    
    @Data
    public static class OperatorPerformance {
        private String operatorId;
        private String operatorName;
        private String operatorType;
        private Long totalBuses;
        private Long activeBuses;
        private Long totalTrips;
        private Long completedTrips;
        private Double onTimePerformance;
        private Double utilizationRate;
        private String performanceGrade; // "A", "B", "C", "D", "F"
    }
    
    @Data
    public static class BusPerformance {
        private String busId;
        private String plateNumber;
        private String model;
        private Integer capacity;
        private Long totalTrips;
        private Double utilizationRate;
        private Double avgTripDuration;
        private String status;
    }
    
    @Data
    public static class RegionPerformance {
        private String region;
        private Long totalRoutes;
        private Long totalStops;
        private Long totalTrips;
        private Double serviceFrequency;
        private Double coverage; // percentage of area covered
    }
    
    @Data
    public static class CapacityGap {
        private String routeId;
        private String routeName;
        private Integer currentCapacity;
        private Integer demandCapacity;
        private Integer gapCapacity;
        private String priority; // "high", "medium", "low"
    }
}