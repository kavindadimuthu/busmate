package com.busmate.routeschedule.scheduling.dto.response;

import com.busmate.routeschedule.shared.dto.LocationDto;
import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import com.busmate.routeschedule.network.entity.Route;
import com.busmate.routeschedule.scheduling.entity.Schedule;
import com.busmate.routeschedule.network.entity.Stop;

@Data
@Schema(description = "Schedule response containing all schedule information and related components")
public class ScheduleResponse {
    
    @Schema(description = "Unique identifier of the schedule", example = "12345678-1234-1234-1234-123456789012")
    private UUID id;
    
    @Schema(description = "Name of the schedule", example = "Morning Express Service")
    private String name;
    
    @Schema(description = "Description or notes about the schedule", example = "Express service during morning rush hours")
    private String description;
    
    @Schema(description = "ID of the route this schedule belongs to", example = "77777777-7777-7777-7777-777777777771")
    private UUID routeId;
    
    @Schema(description = "Name of the route", example = "Colombo Fort - Kandy")
    private String routeName;
    
    @Schema(description = "ID of the route group", example = "66666666-6666-6666-6666-666666666661")
    private UUID routeGroupId;
    
    @Schema(description = "Name of the route group", example = "Colombo - Kandy Route Group")
    private String routeGroupName;
    
    @Schema(description = "Type of schedule", allowableValues = {"REGULAR", "SPECIAL"}, example = "REGULAR")
    private String scheduleType;
    
    @Schema(description = "Date when schedule becomes effective", example = "2025-09-25")
    private LocalDate effectiveStartDate;
    
    @Schema(description = "Date when schedule expires", example = "2025-12-31")
    private LocalDate effectiveEndDate;
    
    @Schema(description = "Current status", allowableValues = {"PENDING", "ACTIVE", "INACTIVE", "CANCELLED"}, example = "ACTIVE")
    private String status;
    
    @Schema(description = "List of stops with timing information. Empty for basic schedules.")
    private List<ScheduleStopResponse> scheduleStops;
    
    @Schema(description = "Calendar configuration. Empty for basic schedules.")
    private List<ScheduleCalendarResponse> scheduleCalendars;
    
    @Schema(description = "Date exceptions for this schedule. Empty if no exceptions.")
    private List<ScheduleExceptionResponse> scheduleExceptions;
    
    @Schema(description = "When the schedule was created", example = "2025-09-21T10:30:00")
    private LocalDateTime createdAt;
    
    @Schema(description = "When the schedule was last updated", example = "2025-09-21T14:45:00")
    private LocalDateTime updatedAt;
    
    @Schema(description = "User who created the schedule", example = "admin@busmate.lk")
    private String createdBy;
    
    @Schema(description = "User who last updated the schedule", example = "operator@busmate.lk")
    private String updatedBy;

    @Data
    @Schema(description = "Stop timing information within a schedule")
    public static class ScheduleStopResponse {
        
        @Schema(description = "Unique identifier of the schedule stop", example = "11111111-1111-1111-1111-111111111111")
        private UUID id;
        
        @Schema(description = "ID of the bus stop", example = "33333333-3333-3333-3333-333333333331")
        private UUID stopId;
        
        @Schema(description = "Name of the bus stop", example = "Fort Railway Station")
        private String stopName;
        
        @Schema(description = "Geographic location of the stop")
        private LocationDto location;
        
        @Schema(description = "Order of this stop in the route (0 = first)", example = "0")
        private Integer stopOrder;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Scheduled arrival time (verified)", type = "string", pattern = "HH:mm:ss", example = "10:30:00")
        private LocalTime arrivalTime;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Scheduled departure time (verified)", type = "string", pattern = "HH:mm:ss", example = "10:35:00")
        private LocalTime departureTime;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Unverified arrival time from experienced users", type = "string", pattern = "HH:mm:ss", example = "10:32:00")
        private LocalTime arrivalTimeUnverified;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Unverified departure time from experienced users", type = "string", pattern = "HH:mm:ss", example = "10:37:00")
        private LocalTime departureTimeUnverified;
        
        @Schema(description = "Username who provided unverified arrival time", example = "experienced_user@busmate.lk")
        private String arrivalTimeUnverifiedBy;
        
        @Schema(description = "Username who provided unverified departure time", example = "experienced_user@busmate.lk")
        private String departureTimeUnverifiedBy;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Calculated arrival time based on route distance and travel time", type = "string", pattern = "HH:mm:ss", example = "10:31:30")
        private LocalTime arrivalTimeCalculated;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Calculated departure time based on route distance and travel time", type = "string", pattern = "HH:mm:ss", example = "10:36:30")
        private LocalTime departureTimeCalculated;
    }

    @Data
    @Schema(description = "Calendar configuration showing which days the schedule operates")
    public static class ScheduleCalendarResponse {
        
        @Schema(description = "Unique identifier of the calendar", example = "22222222-2222-2222-2222-222222222222")
        private UUID id;
        
        @Schema(description = "Operates on Mondays", example = "true")
        private Boolean monday;
        
        @Schema(description = "Operates on Tuesdays", example = "true")
        private Boolean tuesday;
        
        @Schema(description = "Operates on Wednesdays", example = "true")
        private Boolean wednesday;
        
        @Schema(description = "Operates on Thursdays", example = "true")
        private Boolean thursday;
        
        @Schema(description = "Operates on Fridays", example = "true")
        private Boolean friday;
        
        @Schema(description = "Operates on Saturdays", example = "false")
        private Boolean saturday;
        
        @Schema(description = "Operates on Sundays", example = "false")
        private Boolean sunday;
    }

    @Data
    @Schema(description = "Exception date configuration for special service dates")
    public static class ScheduleExceptionResponse {
        
        @Schema(description = "Unique identifier of the exception", example = "33333333-3333-3333-3333-333333333333")
        private UUID id;
        
        @Schema(description = "The exception date", example = "2025-12-25")
        private LocalDate exceptionDate;
        
        @Schema(description = "Type of exception", allowableValues = {"ADDED", "REMOVED"}, example = "REMOVED")
        private String exceptionType;
    }
}