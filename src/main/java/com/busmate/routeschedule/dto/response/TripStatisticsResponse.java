package com.busmate.routeschedule.dto.response;

import lombok.Data;
import java.time.LocalDate;
import java.util.Map;

@Data
public class TripStatisticsResponse {
    // Basic counts
    private Long totalTrips;
    private Long scheduledTrips;
    private Long completedTrips;
    private Long cancelledTrips;
    private Long pendingTrips;
    private Long activeTrips;
    private Long delayedTrips;
    private Long inTransitTrips;
    private Long boardingTrips;
    private Long departedTrips;
    
    // Status distribution
    private Map<String, Long> tripsByStatus;
    
    // Date-based statistics
    private Map<String, Long> tripsThisWeek;
    private Map<String, Long> tripsThisMonth;
    private Long todayTrips;
    private Long tomorrowTrips;
    private Long weeklyTrips;
    private Long monthlyTrips;
    
    // Performance metrics
    private Double completionRate;
    private Double onTimePerformanceRate;
    private Double cancellationRate;
    private Double averageTripsPerDay;
    
    // Operational insights
    private Map<String, Long> tripsByRoute;
    private Map<String, Long> tripsByOperator;
    private Map<String, Long> tripsBySchedule;
    private Map<String, Long> tripsWithPsp; // PSP assigned vs unassigned
    private Map<String, Long> tripsWithBus; // Bus assigned vs unassigned
    
    // Peak insights
    private String peakTripRoute;
    private String peakTripOperator;
    private LocalDate peakTripDate;
    private String leastActiveRoute;
    
    // Assignment statistics
    private Long tripsWithAssignedPsp;
    private Long tripsWithoutPsp;
    private Long tripsWithAssignedBus;
    private Long tripsWithoutBus;
    private Long tripsWithDriver;
    private Long tripsWithConductor;
    
    // Time-based insights
    private Map<String, Long> tripsByTimeOfDay; // morning, afternoon, evening, night
    private Map<String, Long> tripsByDayOfWeek;
    private Double averageTripDuration;
    
    // Recent activity
    private Long recentlyCreatedTrips; // last 24 hours
    private Long recentlyCompletedTrips; // last 24 hours
    private Long recentlyCancelledTrips; // last 24 hours
}