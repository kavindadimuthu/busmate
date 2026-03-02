package com.busmate.routeschedule.dto.response.dashboard;

import lombok.Data;

import java.util.Map;

@Data
public class DashboardKPIResponse {
    // Performance KPIs
    private Double onTimePerformance; // percentage of trips on time
    private Double scheduleAdherence; // percentage of scheduled vs completed trips
    private Double busUtilizationRate; // active buses vs total buses
    private Double routeEfficiency; // trips per route ratio
    private Double operatorPerformance; // average performance across operators
    
    // Operational KPIs
    private Double serviceReliability; // completed trips vs scheduled
    private Double fleetAvailability; // active buses percentage
    private Double routeCoverage; // routes with active schedules percentage
    private Double permitUtilization; // permits in use vs total permits
    private Double stopConnectivity; // stops connected to routes percentage
    
    // Growth & Capacity KPIs
    private Integer totalSeatingCapacity;
    private Double capacityUtilizationDaily; // daily trip capacity usage
    private Double capacityUtilizationWeekly; // weekly average
    private Double routeExpansionRate; // new routes added (monthly)
    private Double fleetGrowthRate; // new buses added (monthly)
    
    // Quality KPIs
    private Double accessibilityCompliance; // accessible stops percentage
    private Double modernFleetRatio; // newer buses percentage
    private Double serviceFrequency; // average trips per route per day
    private Double geographicalCoverage; // cities/states served
    
    // Financial Efficiency (derived metrics)
    private Double costPerTrip; // estimated based on capacity and utilization
    private Double revenuePerSeat; // estimated revenue efficiency
    private Double operationalCostRatio; // operational efficiency metric
    
    // Trend Indicators (compared to previous period)
    private Map<String, Double> performanceTrends; // weekly/monthly trends
    private Map<String, String> kpiStatus; // "improving", "declining", "stable"
    
    // Target vs Actual
    private Map<String, KPIMetric> kpiMetrics;
    
    @Data
    public static class KPIMetric {
        private String name;
        private Double actual;
        private Double target;
        private Double variance; // percentage difference
        private String status; // "on-target", "below-target", "above-target"
        private String trend; // "up", "down", "stable"
    }
}