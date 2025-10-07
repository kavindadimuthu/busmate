package com.busmate.routeschedule.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class TripFilterOptionsResponse {
    // Status options
    private List<String> statuses;
    
    // Route related options
    private List<RouteOption> routes;
    private List<RouteGroupOption> routeGroups;
    
    // Operator options
    private List<OperatorOption> operators;
    
    // Schedule options
    private List<ScheduleOption> schedules;
    
    // PSP options
    private List<PspOption> passengerServicePermits;
    
    // Bus options
    private List<BusOption> buses;
    
    // Date range options
    private List<String> dateRangePresets; // Today, Tomorrow, This Week, This Month, Custom
    
    // Time options
    private List<String> timeOfDayOptions; // Morning, Afternoon, Evening, Night
    
    // Assignment status options
    private List<String> assignmentStatuses; // PSP Assigned, PSP Not Assigned, Bus Assigned, etc.
    
    // Sorting options
    private List<String> sortOptions;
    
    // Nested classes for complex filter options
    @Data
    public static class RouteOption {
        private String id;
        private String name;
        private String routeNumber;
        private String direction;
        private String routeGroupName;
    }
    
    @Data
    public static class RouteGroupOption {
        private String id;
        private String name;
        private String description;
        private Long routeCount;
    }
    
    @Data
    public static class OperatorOption {
        private String id;
        private String name;
        private String operatorType;
        private String region;
    }
    
    @Data
    public static class ScheduleOption {
        private String id;
        private String name;
        private String routeName;
        private String operatorName;
        private String scheduleType;
    }
    
    @Data
    public static class PspOption {
        private String id;
        private String permitNumber;
        private String operatorName;
        private String routeName;
    }
    
    @Data
    public static class BusOption {
        private String id;
        private String plateNumber;
        private String model;
        private String operatorName;
        private Integer capacity;
    }
}