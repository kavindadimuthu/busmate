package com.busmate.routeschedule.service;

import com.busmate.routeschedule.dto.response.*;
import com.busmate.routeschedule.entity.Stop;
import com.busmate.routeschedule.entity.Bus;
import com.busmate.routeschedule.entity.Operator;
import com.busmate.routeschedule.entity.Route;
import com.busmate.routeschedule.entity.Schedule;
import com.busmate.routeschedule.entity.Trip;
import com.busmate.routeschedule.entity.PassengerServicePermit;
import com.busmate.routeschedule.enums.StatusEnum;
import com.busmate.routeschedule.enums.TripStatusEnum;
import com.busmate.routeschedule.enums.OperatorTypeEnum;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {
    
    private final StopService stopService;
    private final BusService busService;
    private final OperatorService operatorService;
    private final RouteService routeService;
    private final RouteGroupService routeGroupService;
    private final ScheduleService scheduleService;
    private final TripService tripService;
    private final PassengerServicePermitService permitService;

    public DashboardOverviewResponse getOverview() {
        log.info("Generating dashboard overview");
        
        try {
            DashboardOverviewResponse overview = new DashboardOverviewResponse();
            
            // Get statistics from all services
            StopStatisticsResponse stopStats = stopService.getStatistics();
            BusStatisticsResponse busStats = busService.getStatistics();
            OperatorStatisticsResponse operatorStats = operatorService.getStatistics();
            RouteStatisticsResponse routeStats = routeService.getStatistics();
            TripStatisticsResponse tripStats = tripService.getStatistics();
            PassengerServicePermitStatisticsResponse permitStats = permitService.getStatistics();
            Map<String, Object> scheduleStats = scheduleService.getScheduleStatistics();
            
            // System Overview Counts
            overview.setTotalStops(stopStats.getTotalStops());
            overview.setTotalRoutes(routeStats.getTotalRoutes());
            overview.setTotalOperators(operatorStats.getTotalOperators());
            overview.setTotalBuses(busStats.getTotalBuses());
            overview.setTotalSchedules((Long) scheduleStats.getOrDefault("totalSchedules", 0L));
            overview.setTotalTrips(tripStats.getTotalTrips());
            overview.setTotalPermits(permitStats.getTotalPermits());
            
            // Active Entities
            overview.setActiveStops(stopStats.getTotalStops()); // Assuming all stops are active for now
            overview.setActiveRoutes((Long) scheduleStats.getOrDefault("activeSchedules", 0L));
            overview.setActiveOperators(operatorStats.getActiveOperators());
            overview.setActiveBuses(busStats.getActiveBuses());
            overview.setActiveSchedules((Long) scheduleStats.getOrDefault("activeSchedules", 0L));
            overview.setActiveTrips(tripStats.getActiveTrips());
            overview.setActivePermits(permitStats.getActivePermits());
            
            // Today's Activity
            overview.setTodayTrips(tripStats.getTodayTrips());
            overview.setTodayCompletedTrips(tripStats.getCompletedTrips());
            overview.setTodayCancelledTrips(tripStats.getCancelledTrips());
            overview.setTodayDelayedTrips(tripStats.getDelayedTrips());
            
            // Calculate System Health Indicators
            overview.setSystemHealthScore(calculateSystemHealthScore(busStats, tripStats, operatorStats));
            overview.setOperationalEfficiency(calculateOperationalEfficiency(tripStats));
            overview.setOnTimePerformance(calculateOnTimePerformance(tripStats));
            overview.setCapacityUtilization(calculateCapacityUtilization(busStats, tripStats));
            
            // Quick Stats
            overview.setTotalCapacity(busStats.getTotalCapacity());
            overview.setAverageBusCapacity(busStats.getAverageCapacity().intValue());
            overview.setTotalRouteKilometers(routeStats.getTotalDistanceKm() != null ? routeStats.getTotalDistanceKm().longValue() : 0L);
            overview.setRouteGroupsCount(routeStats.getTotalRouteGroups());
            
            // Operational Status
            overview.setSystemStatus(determineSystemStatus(overview));
            overview.setLastUpdated(LocalDateTime.now());
            
            // Distribution summaries
            overview.setOperatorTypesDistribution(operatorStats.getOperatorsByType());
            overview.setTripStatusDistribution(tripStats.getTripsByStatus());
            overview.setBusStatusDistribution(busStats.getBusesByStatus());
            
            log.info("Dashboard overview generated successfully");
            return overview;
            
        } catch (Exception e) {
            log.error("Error generating dashboard overview", e);
            throw new RuntimeException("Failed to generate dashboard overview", e);
        }
    }

    public DashboardKPIResponse getKPIs() {
        log.info("Generating dashboard KPIs");
        
        try {
            DashboardKPIResponse kpi = new DashboardKPIResponse();
            
            // Get statistics from services
            TripStatisticsResponse tripStats = tripService.getStatistics();
            BusStatisticsResponse busStats = busService.getStatistics();
            RouteStatisticsResponse routeStats = routeService.getStatistics();
            OperatorStatisticsResponse operatorStats = operatorService.getStatistics();
            PassengerServicePermitStatisticsResponse permitStats = permitService.getStatistics();
            StopStatisticsResponse stopStats = stopService.getStatistics();
            
            // Performance KPIs
            kpi.setOnTimePerformance(calculateOnTimePerformance(tripStats));
            kpi.setScheduleAdherence(calculateScheduleAdherence(tripStats));
            kpi.setBusUtilizationRate(calculateBusUtilizationRate(busStats));
            kpi.setRouteEfficiency(calculateRouteEfficiency(routeStats, tripStats));
            kpi.setOperatorPerformance(calculateOperatorPerformance(operatorStats, tripStats));
            
            // Operational KPIs
            kpi.setServiceReliability(calculateServiceReliability(tripStats));
            kpi.setFleetAvailability(calculateFleetAvailability(busStats));
            kpi.setRouteCoverage(calculateRouteCoverage(routeStats));
            kpi.setPermitUtilization(calculatePermitUtilization(permitStats));
            kpi.setStopConnectivity(calculateStopConnectivity(stopStats, routeStats));
            
            // Growth & Capacity KPIs
            kpi.setTotalSeatingCapacity(busStats.getTotalCapacity());
            kpi.setCapacityUtilizationDaily(calculateCapacityUtilization(busStats, tripStats));
            kpi.setCapacityUtilizationWeekly(calculateWeeklyCapacityUtilization(busStats, tripStats));
            kpi.setRouteExpansionRate(calculateRouteExpansionRate(routeStats));
            kpi.setFleetGrowthRate(calculateFleetGrowthRate(busStats));
            
            // Quality KPIs
            kpi.setAccessibilityCompliance(calculateAccessibilityCompliance(stopStats));
            kpi.setModernFleetRatio(calculateModernFleetRatio(busStats));
            kpi.setServiceFrequency(calculateServiceFrequency(routeStats, tripStats));
            kpi.setGeographicalCoverage(calculateGeographicalCoverage(stopStats));
            
            // Financial Efficiency (estimated)
            kpi.setCostPerTrip(estimateCostPerTrip(busStats, tripStats));
            kpi.setRevenuePerSeat(estimateRevenuePerSeat(busStats, tripStats));
            kpi.setOperationalCostRatio(estimateOperationalCostRatio(busStats, tripStats));
            
            // Performance Trends (mock data for now - would need historical data)
            kpi.setPerformanceTrends(generatePerformanceTrends());
            kpi.setKpiStatus(generateKPIStatus());
            
            // Target vs Actual KPIs
            kpi.setKpiMetrics(generateKPIMetrics(kpi));
            
            log.info("Dashboard KPIs generated successfully");
            return kpi;
            
        } catch (Exception e) {
            log.error("Error generating dashboard KPIs", e);
            throw new RuntimeException("Failed to generate dashboard KPIs", e);
        }
    }

    public DashboardAnalyticsResponse getAnalytics() {
        log.info("Generating dashboard analytics");
        
        try {
            DashboardAnalyticsResponse analytics = new DashboardAnalyticsResponse();
            
            // Get statistics from services
            TripStatisticsResponse tripStats = tripService.getStatistics();
            BusStatisticsResponse busStats = busService.getStatistics();
            RouteStatisticsResponse routeStats = routeService.getStatistics();
            OperatorStatisticsResponse operatorStats = operatorService.getStatistics();
            StopStatisticsResponse stopStats = stopService.getStatistics();
            
            // Temporal Analytics (using available data)
            analytics.setDailyTripCounts(tripStats.getTripsThisWeek());
            analytics.setWeeklyTripCounts(generateWeeklyTripCounts(tripStats));
            analytics.setMonthlyTripCounts(tripStats.getTripsThisMonth());
            
            // Route Performance Analytics
            analytics.setTopPerformingRoutes(generateTopPerformingRoutes(routeStats));
            analytics.setUnderperformingRoutes(generateUnderperformingRoutes(routeStats));
            analytics.setRouteUtilizationRates(generateRouteUtilizationRates(routeStats));
            
            // Operator Analytics
            analytics.setOperatorPerformance(generateOperatorPerformance(operatorStats, busStats));
            analytics.setTripsByOperator(generateTripsByOperator(operatorStats));
            analytics.setOperatorEfficiencyRatings(generateOperatorEfficiencyRatings(operatorStats));
            
            // Fleet Analytics
            analytics.setBusUtilizationByModel(busStats.getBusesByModel());
            analytics.setBusUtilizationByCapacity(busStats.getBusesByCapacityRange());
            analytics.setBusPerformanceMetrics(generateBusPerformanceMetrics(busStats));
            
            // Geographic Analytics
            analytics.setTripsByRegion(generateTripsByRegion(operatorStats));
            analytics.setStopsByCity(stopStats.getStopsByCity());
            analytics.setRegionalPerformance(generateRegionalPerformance(stopStats, operatorStats));
            
            // Service Quality Analytics (mock data - would need historical tracking)
            analytics.setDailyOnTimePerformance(generateDailyOnTimePerformance());
            analytics.setDailyCancellations(generateDailyCancellations());
            analytics.setDailyDelays(generateDailyDelays());
            
            // Capacity Analytics
            analytics.setCapacityDistribution(generateCapacityDistribution(busStats));
            analytics.setDailyCapacityUtilization(generateDailyCapacityUtilization());
            analytics.setCapacityGaps(generateCapacityGaps(routeStats, busStats));
            
            log.info("Dashboard analytics generated successfully");
            return analytics;
            
        } catch (Exception e) {
            log.error("Error generating dashboard analytics", e);
            throw new RuntimeException("Failed to generate dashboard analytics", e);
        }
    }

    public DashboardAlertsResponse getAlerts() {
        log.info("Generating dashboard alerts");
        
        try {
            DashboardAlertsResponse alerts = new DashboardAlertsResponse();
            
            List<DashboardAlertsResponse.SystemAlert> allAlerts = new ArrayList<>();
            
            // Generate alerts based on current system state
            allAlerts.addAll(generateFleetAlerts());
            allAlerts.addAll(generateOperationalAlerts());
            allAlerts.addAll(generateScheduleAlerts());
            allAlerts.addAll(generatePermitAlerts());
            allAlerts.addAll(generateSystemAlerts());
            
            // Separate alerts by type
            List<DashboardAlertsResponse.SystemAlert> criticalAlerts = allAlerts.stream()
                .filter(alert -> "CRITICAL".equals(alert.getType()))
                .collect(Collectors.toList());
            
            List<DashboardAlertsResponse.SystemAlert> warningAlerts = allAlerts.stream()
                .filter(alert -> "WARNING".equals(alert.getType()))
                .collect(Collectors.toList());
            
            List<DashboardAlertsResponse.SystemAlert> infoAlerts = allAlerts.stream()
                .filter(alert -> "INFO".equals(alert.getType()))
                .collect(Collectors.toList());
            
            alerts.setCriticalAlerts(criticalAlerts);
            alerts.setWarningAlerts(warningAlerts);
            alerts.setInformationalAlerts(infoAlerts);
            alerts.setTotalCriticalAlerts(criticalAlerts.size());
            alerts.setTotalWarningAlerts(warningAlerts.size());
            alerts.setTotalInformationalAlerts(infoAlerts.size());
            alerts.setLastAlertTime(LocalDateTime.now());
            
            log.info("Dashboard alerts generated successfully");
            return alerts;
            
        } catch (Exception e) {
            log.error("Error generating dashboard alerts", e);
            throw new RuntimeException("Failed to generate dashboard alerts", e);
        }
    }

    // ========== PRIVATE HELPER METHODS ==========

    private Double calculateSystemHealthScore(BusStatisticsResponse busStats, 
                                            TripStatisticsResponse tripStats, 
                                            OperatorStatisticsResponse operatorStats) {
        // Simple health score calculation based on active entities and performance
        double busHealth = busStats.getActiveBusPercentage() != null ? busStats.getActiveBusPercentage() : 0.0;
        double operatorHealth = (operatorStats.getActiveOperators().doubleValue() / operatorStats.getTotalOperators().doubleValue()) * 100;
        double tripHealth = tripStats.getTotalTrips() > 0 ? 
            (tripStats.getCompletedTrips().doubleValue() / tripStats.getTotalTrips().doubleValue()) * 100 : 0.0;
        
        return (busHealth + operatorHealth + tripHealth) / 3.0;
    }

    private Double calculateOperationalEfficiency(TripStatisticsResponse tripStats) {
        if (tripStats.getTotalTrips() == 0) return 0.0;
        return (tripStats.getCompletedTrips().doubleValue() / tripStats.getTotalTrips().doubleValue()) * 100;
    }

    private Double calculateOnTimePerformance(TripStatisticsResponse tripStats) {
        if (tripStats.getTotalTrips() == 0) return 0.0;
        long onTimeTrips = tripStats.getCompletedTrips() - tripStats.getDelayedTrips();
        return (onTimeTrips / tripStats.getTotalTrips().doubleValue()) * 100;
    }

    private Double calculateCapacityUtilization(BusStatisticsResponse busStats, TripStatisticsResponse tripStats) {
        if (busStats.getTotalCapacity() == 0) return 0.0;
        // Estimate utilization based on active trips and total capacity
        double estimatedUtilization = (tripStats.getActiveTrips().doubleValue() / busStats.getActiveBuses().doubleValue()) * 100;
        return Math.min(estimatedUtilization, 100.0);
    }

    private String determineSystemStatus(DashboardOverviewResponse overview) {
        if (overview.getSystemHealthScore() >= 90) return "operational";
        if (overview.getSystemHealthScore() >= 70) return "maintenance";
        return "alert";
    }

    private Double calculateScheduleAdherence(TripStatisticsResponse tripStats) {
        if (tripStats.getScheduledTrips() == 0) return 0.0;
        return (tripStats.getCompletedTrips().doubleValue() / tripStats.getScheduledTrips().doubleValue()) * 100;
    }

    private Double calculateBusUtilizationRate(BusStatisticsResponse busStats) {
        return busStats.getActiveBusPercentage() != null ? busStats.getActiveBusPercentage() : 0.0;
    }

    private Double calculateRouteEfficiency(RouteStatisticsResponse routeStats, TripStatisticsResponse tripStats) {
        if (routeStats.getTotalRoutes() == 0) return 0.0;
        return tripStats.getTotalTrips().doubleValue() / routeStats.getTotalRoutes().doubleValue();
    }

    private Double calculateOperatorPerformance(OperatorStatisticsResponse operatorStats, TripStatisticsResponse tripStats) {
        // Calculate average performance across all operators
        return (operatorStats.getActiveOperators().doubleValue() / operatorStats.getTotalOperators().doubleValue()) * 100;
    }

    private Double calculateServiceReliability(TripStatisticsResponse tripStats) {
        return calculateOperationalEfficiency(tripStats);
    }

    private Double calculateFleetAvailability(BusStatisticsResponse busStats) {
        return busStats.getActiveBusPercentage() != null ? busStats.getActiveBusPercentage() : 0.0;
    }

    private Double calculateRouteCoverage(RouteStatisticsResponse routeStats) {
        // Assume all routes are covered by schedules for simplicity
        return 100.0;
    }

    private Double calculatePermitUtilization(PassengerServicePermitStatisticsResponse permitStats) {
        if (permitStats.getTotalPermits() == 0) return 0.0;
        return (permitStats.getActivePermits().doubleValue() / permitStats.getTotalPermits().doubleValue()) * 100;
    }

    private Double calculateStopConnectivity(StopStatisticsResponse stopStats, RouteStatisticsResponse routeStats) {
        // Simplified calculation - assume most stops are connected
        return 85.0; // Mock value
    }

    private Double calculateWeeklyCapacityUtilization(BusStatisticsResponse busStats, TripStatisticsResponse tripStats) {
        return calculateCapacityUtilization(busStats, tripStats) * 0.9; // Weekly slightly lower than daily
    }

    private Double calculateRouteExpansionRate(RouteStatisticsResponse routeStats) {
        // Mock growth rate - would need historical data
        return 5.2;
    }

    private Double calculateFleetGrowthRate(BusStatisticsResponse busStats) {
        // Mock growth rate - would need historical data
        return 3.8;
    }

    private Double calculateAccessibilityCompliance(StopStatisticsResponse stopStats) {
        return stopStats.getAccessibleStopsPercentage() != null ? stopStats.getAccessibleStopsPercentage() : 0.0;
    }

    private Double calculateModernFleetRatio(BusStatisticsResponse busStats) {
        // Mock value - would need year/model data
        return 65.0;
    }

    private Double calculateServiceFrequency(RouteStatisticsResponse routeStats, TripStatisticsResponse tripStats) {
        if (routeStats.getTotalRoutes() == 0) return 0.0;
        return tripStats.getTodayTrips().doubleValue() / routeStats.getTotalRoutes().doubleValue();
    }

    private Double calculateGeographicalCoverage(StopStatisticsResponse stopStats) {
        // Based on number of states and cities served
        return stopStats.getTotalStates() * 10.0 + stopStats.getTotalCities() * 2.0;
    }

    private Double estimateCostPerTrip(BusStatisticsResponse busStats, TripStatisticsResponse tripStats) {
        // Mock estimation based on fleet size and trips
        if (tripStats.getTotalTrips() == 0) return 0.0;
        return (busStats.getTotalBuses() * 100.0) / tripStats.getTotalTrips(); // Simplified cost model
    }

    private Double estimateRevenuePerSeat(BusStatisticsResponse busStats, TripStatisticsResponse tripStats) {
        if (busStats.getTotalCapacity() == 0) return 0.0;
        return (tripStats.getTotalTrips() * 50.0) / busStats.getTotalCapacity(); // Mock revenue calculation
    }

    private Double estimateOperationalCostRatio(BusStatisticsResponse busStats, TripStatisticsResponse tripStats) {
        return calculateOperationalEfficiency(tripStats) / 100.0 * 0.8; // Simplified ratio
    }

    // Mock data generators for complex analytics (would be replaced with real calculations)
    
    private Map<String, Double> generatePerformanceTrends() {
        Map<String, Double> trends = new HashMap<>();
        trends.put("onTimePerformance", 2.5);
        trends.put("busUtilization", -1.2);
        trends.put("routeEfficiency", 3.8);
        trends.put("operatorPerformance", 1.9);
        return trends;
    }

    private Map<String, String> generateKPIStatus() {
        Map<String, String> status = new HashMap<>();
        status.put("onTimePerformance", "improving");
        status.put("busUtilization", "declining");
        status.put("routeEfficiency", "stable");
        status.put("operatorPerformance", "improving");
        return status;
    }

    private Map<String, DashboardKPIResponse.KPIMetric> generateKPIMetrics(DashboardKPIResponse kpi) {
        Map<String, DashboardKPIResponse.KPIMetric> metrics = new HashMap<>();
        
        DashboardKPIResponse.KPIMetric onTimeMetric = new DashboardKPIResponse.KPIMetric();
        onTimeMetric.setName("On-Time Performance");
        onTimeMetric.setActual(kpi.getOnTimePerformance());
        onTimeMetric.setTarget(85.0);
        onTimeMetric.setVariance(((kpi.getOnTimePerformance() - 85.0) / 85.0) * 100);
        onTimeMetric.setStatus(kpi.getOnTimePerformance() >= 85.0 ? "on-target" : "below-target");
        onTimeMetric.setTrend("up");
        metrics.put("onTimePerformance", onTimeMetric);
        
        return metrics;
    }

    private Map<String, Long> generateWeeklyTripCounts(TripStatisticsResponse tripStats) {
        // Generate mock weekly data
        Map<String, Long> weekly = new HashMap<>();
        for (int i = 1; i <= 12; i++) {
            weekly.put("Week " + i, tripStats.getWeeklyTrips() + (i * 10L));
        }
        return weekly;
    }

    private List<DashboardAnalyticsResponse.RoutePerformance> generateTopPerformingRoutes(RouteStatisticsResponse routeStats) {
        List<DashboardAnalyticsResponse.RoutePerformance> routes = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            DashboardAnalyticsResponse.RoutePerformance route = new DashboardAnalyticsResponse.RoutePerformance();
            route.setRouteId("route-" + i);
            route.setRouteName("Top Route " + i);
            route.setTotalTrips(1000L + (i * 100));
            route.setCompletedTrips(950L + (i * 95));
            route.setCompletionRate(95.0 + i);
            route.setAvgDelay(2.0 - (i * 0.3));
            route.setOnTimePerformance(92.0 + i);
            route.setPerformance("excellent");
            routes.add(route);
        }
        return routes;
    }

    private List<DashboardAnalyticsResponse.RoutePerformance> generateUnderperformingRoutes(RouteStatisticsResponse routeStats) {
        List<DashboardAnalyticsResponse.RoutePerformance> routes = new ArrayList<>();
        for (int i = 1; i <= 3; i++) {
            DashboardAnalyticsResponse.RoutePerformance route = new DashboardAnalyticsResponse.RoutePerformance();
            route.setRouteId("route-low-" + i);
            route.setRouteName("Underperforming Route " + i);
            route.setTotalTrips(500L + (i * 50));
            route.setCompletedTrips(300L + (i * 30));
            route.setCompletionRate(60.0 - i);
            route.setAvgDelay(15.0 + (i * 2));
            route.setOnTimePerformance(50.0 + i);
            route.setPerformance("poor");
            routes.add(route);
        }
        return routes;
    }

    private Map<String, Double> generateRouteUtilizationRates(RouteStatisticsResponse routeStats) {
        Map<String, Double> rates = new HashMap<>();
        rates.put("High Utilization", 85.5);
        rates.put("Medium Utilization", 67.2);
        rates.put("Low Utilization", 32.8);
        return rates;
    }

    private List<DashboardAnalyticsResponse.OperatorPerformance> generateOperatorPerformance(
            OperatorStatisticsResponse operatorStats, BusStatisticsResponse busStats) {
        List<DashboardAnalyticsResponse.OperatorPerformance> performance = new ArrayList<>();
        
        operatorStats.getOperatorsByType().forEach((type, count) -> {
            DashboardAnalyticsResponse.OperatorPerformance perf = new DashboardAnalyticsResponse.OperatorPerformance();
            perf.setOperatorId("op-" + type.toLowerCase());
            perf.setOperatorName(type + " Operators");
            perf.setOperatorType(type);
            perf.setTotalBuses(count * 10); // Mock calculation
            perf.setActiveBuses(count * 8);
            perf.setTotalTrips(count * 1000);
            perf.setCompletedTrips(count * 850);
            perf.setOnTimePerformance(85.0 + (count % 10));
            perf.setUtilizationRate(80.0 + (count % 15));
            perf.setPerformanceGrade("A");
            performance.add(perf);
        });
        
        return performance;
    }

    private Map<String, Long> generateTripsByOperator(OperatorStatisticsResponse operatorStats) {
        Map<String, Long> trips = new HashMap<>();
        operatorStats.getOperatorsByType().forEach((type, count) -> {
            trips.put(type, count * 1500L); // Mock calculation based on operator count
        });
        return trips;
    }

    private Map<String, Double> generateOperatorEfficiencyRatings(OperatorStatisticsResponse operatorStats) {
        Map<String, Double> ratings = new HashMap<>();
        operatorStats.getOperatorsByType().forEach((type, count) -> {
            ratings.put(type, 85.0 + (count % 20));
        });
        return ratings;
    }

    private List<DashboardAnalyticsResponse.BusPerformance> generateBusPerformanceMetrics(BusStatisticsResponse busStats) {
        List<DashboardAnalyticsResponse.BusPerformance> metrics = new ArrayList<>();
        // Generate sample bus performance data
        for (int i = 1; i <= 10; i++) {
            DashboardAnalyticsResponse.BusPerformance perf = new DashboardAnalyticsResponse.BusPerformance();
            perf.setBusId("bus-" + i);
            perf.setPlateNumber("ABC-" + (1000 + i));
            perf.setModel("Model-" + (i % 3 + 1));
            perf.setCapacity(40 + (i % 20));
            perf.setTotalTrips(100L + (i * 10));
            perf.setUtilizationRate(75.0 + (i % 25));
            perf.setAvgTripDuration(45.0 + (i % 20));
            perf.setStatus("active");
            metrics.add(perf);
        }
        return metrics;
    }

    private Map<String, Long> generateTripsByRegion(OperatorStatisticsResponse operatorStats) {
        Map<String, Long> trips = new HashMap<>();
        trips.put("Western Province", 15000L);
        trips.put("Central Province", 12000L);
        trips.put("Southern Province", 8000L);
        trips.put("Northern Province", 5000L);
        trips.put("Eastern Province", 4000L);
        return trips;
    }

    private List<DashboardAnalyticsResponse.RegionPerformance> generateRegionalPerformance(
            StopStatisticsResponse stopStats, OperatorStatisticsResponse operatorStats) {
        List<DashboardAnalyticsResponse.RegionPerformance> performance = new ArrayList<>();
        
        stopStats.getStopsByState().forEach((state, stopCount) -> {
            DashboardAnalyticsResponse.RegionPerformance perf = new DashboardAnalyticsResponse.RegionPerformance();
            perf.setRegion(state);
            perf.setTotalStops(stopCount);
            perf.setTotalRoutes(stopCount / 10); // Mock calculation
            perf.setTotalTrips(stopCount * 50);
            perf.setServiceFrequency(25.0 + (stopCount % 15));
            perf.setCoverage(80.0 + (stopCount % 20));
            performance.add(perf);
        });
        
        return performance;
    }

    private Map<LocalDate, Double> generateDailyOnTimePerformance() {
        Map<LocalDate, Double> performance = new HashMap<>();
        LocalDate today = LocalDate.now();
        for (int i = 0; i < 30; i++) {
            LocalDate date = today.minusDays(i);
            performance.put(date, 80.0 + (i % 20));
        }
        return performance;
    }

    private Map<LocalDate, Long> generateDailyCancellations() {
        Map<LocalDate, Long> cancellations = new HashMap<>();
        LocalDate today = LocalDate.now();
        for (int i = 0; i < 30; i++) {
            LocalDate date = today.minusDays(i);
            cancellations.put(date, (long) (10 + (i % 15)));
        }
        return cancellations;
    }

    private Map<LocalDate, Long> generateDailyDelays() {
        Map<LocalDate, Long> delays = new HashMap<>();
        LocalDate today = LocalDate.now();
        for (int i = 0; i < 30; i++) {
            LocalDate date = today.minusDays(i);
            delays.put(date, (long) (25 + (i % 20)));
        }
        return delays;
    }

    private Map<String, Integer> generateCapacityDistribution(BusStatisticsResponse busStats) {
        Map<String, Integer> distribution = new HashMap<>();
        busStats.getBusesByCapacityRange().forEach((range, count) -> {
            distribution.put(range, count.intValue());
        });
        return distribution;
    }

    private Map<LocalDate, Double> generateDailyCapacityUtilization() {
        Map<LocalDate, Double> utilization = new HashMap<>();
        LocalDate today = LocalDate.now();
        for (int i = 0; i < 30; i++) {
            LocalDate date = today.minusDays(i);
            utilization.put(date, 70.0 + (i % 25));
        }
        return utilization;
    }

    private List<DashboardAnalyticsResponse.CapacityGap> generateCapacityGaps(
            RouteStatisticsResponse routeStats, BusStatisticsResponse busStats) {
        List<DashboardAnalyticsResponse.CapacityGap> gaps = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            DashboardAnalyticsResponse.CapacityGap gap = new DashboardAnalyticsResponse.CapacityGap();
            gap.setRouteId("route-gap-" + i);
            gap.setRouteName("Capacity Gap Route " + i);
            gap.setCurrentCapacity(200 + (i * 50));
            gap.setDemandCapacity(350 + (i * 60));
            gap.setGapCapacity(150 + (i * 10));
            gap.setPriority(i <= 2 ? "high" : (i <= 4 ? "medium" : "low"));
            gaps.add(gap);
        }
        return gaps;
    }

    private List<DashboardAlertsResponse.SystemAlert> generateFleetAlerts() {
        List<DashboardAlertsResponse.SystemAlert> alerts = new ArrayList<>();
        
        DashboardAlertsResponse.SystemAlert alert = new DashboardAlertsResponse.SystemAlert();
        alert.setId("fleet-001");
        alert.setType("WARNING");
        alert.setCategory("FLEET");
        alert.setTitle("Bus Utilization Below Threshold");
        alert.setMessage("Current bus utilization is at 72%, below target of 80%");
        alert.setSeverity("MEDIUM");
        alert.setTimestamp(LocalDateTime.now().minusHours(2));
        alert.setEntityType("BUS");
        alert.setActionRequired("Review bus deployment and scheduling");
        alert.setIsResolved(false);
        alert.setSource("DashboardService");
        alerts.add(alert);
        
        return alerts;
    }

    private List<DashboardAlertsResponse.SystemAlert> generateOperationalAlerts() {
        List<DashboardAlertsResponse.SystemAlert> alerts = new ArrayList<>();
        
        DashboardAlertsResponse.SystemAlert alert = new DashboardAlertsResponse.SystemAlert();
        alert.setId("ops-001");
        alert.setType("INFO");
        alert.setCategory("OPERATIONAL");
        alert.setTitle("Peak Hour Performance");
        alert.setMessage("System performing well during peak hours with 92% on-time performance");
        alert.setSeverity("LOW");
        alert.setTimestamp(LocalDateTime.now().minusMinutes(30));
        alert.setEntityType("TRIP");
        alert.setActionRequired("Continue monitoring");
        alert.setIsResolved(false);
        alert.setSource("DashboardService");
        alerts.add(alert);
        
        return alerts;
    }

    private List<DashboardAlertsResponse.SystemAlert> generateScheduleAlerts() {
        List<DashboardAlertsResponse.SystemAlert> alerts = new ArrayList<>();
        
        DashboardAlertsResponse.SystemAlert alert = new DashboardAlertsResponse.SystemAlert();
        alert.setId("schedule-001");
        alert.setType("CRITICAL");
        alert.setCategory("SCHEDULE");
        alert.setTitle("High Cancellation Rate Detected");
        alert.setMessage("Route XYZ-123 has 25% trip cancellations today");
        alert.setSeverity("HIGH");
        alert.setTimestamp(LocalDateTime.now().minusMinutes(15));
        alert.setEntityType("ROUTE");
        alert.setEntityId("route-xyz-123");
        alert.setActionRequired("Investigate route issues and reassign buses");
        alert.setIsResolved(false);
        alert.setSource("DashboardService");
        alerts.add(alert);
        
        return alerts;
    }

    private List<DashboardAlertsResponse.SystemAlert> generatePermitAlerts() {
        List<DashboardAlertsResponse.SystemAlert> alerts = new ArrayList<>();
        
        DashboardAlertsResponse.SystemAlert alert = new DashboardAlertsResponse.SystemAlert();
        alert.setId("permit-001");
        alert.setType("WARNING");
        alert.setCategory("PERMIT");
        alert.setTitle("Permit Expiring Soon");
        alert.setMessage("5 permits are expiring within the next 30 days");
        alert.setSeverity("MEDIUM");
        alert.setTimestamp(LocalDateTime.now().minusHours(1));
        alert.setEntityType("PERMIT");
        alert.setActionRequired("Review and renew expiring permits");
        alert.setIsResolved(false);
        alert.setSource("DashboardService");
        alerts.add(alert);
        
        return alerts;
    }

    private List<DashboardAlertsResponse.SystemAlert> generateSystemAlerts() {
        List<DashboardAlertsResponse.SystemAlert> alerts = new ArrayList<>();
        
        DashboardAlertsResponse.SystemAlert alert = new DashboardAlertsResponse.SystemAlert();
        alert.setId("system-001");
        alert.setType("INFO");
        alert.setCategory("SYSTEM");
        alert.setTitle("System Health Check Complete");
        alert.setMessage("All systems operational - Health Score: 89%");
        alert.setSeverity("LOW");
        alert.setTimestamp(LocalDateTime.now().minusMinutes(5));
        alert.setEntityType("SYSTEM");
        alert.setActionRequired("No action required");
        alert.setIsResolved(false);
        alert.setSource("DashboardService");
        alerts.add(alert);
        
        return alerts;
    }
}