package com.busmate.routeschedule.passenger.dto.response;

import com.busmate.routeschedule.common.dto.LocationDto;
import com.busmate.routeschedule.common.enums.TimePreferenceEnum;
import com.busmate.routeschedule.common.enums.TimeSourceEnum;
import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import com.busmate.routeschedule.bus.entity.Bus;
import com.busmate.routeschedule.operator.entity.Operator;
import com.busmate.routeschedule.route.entity.Route;
import com.busmate.routeschedule.schedule.entity.Schedule;
import com.busmate.routeschedule.stop.entity.Stop;
import com.busmate.routeschedule.trip.entity.Trip;

/**
 * Response for Find My Bus Details API.
 * 
 * Provides comprehensive information about a specific schedule or trip,
 * including route details, all schedule stops with times, calendar info,
 * exceptions, and trip-specific data when available.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Comprehensive details about a specific bus schedule or trip")
public class FindMyBusDetailsResponse {
    
    @Schema(description = "Whether the request was successful")
    private boolean success;
    
    @Schema(description = "Message providing additional context")
    private String message;
    
    @Schema(description = "Time preference used for time resolution")
    private TimePreferenceEnum timePreference;
    
    @Schema(description = "Date for which details are provided")
    private LocalDate queryDate;
    
    // ==================== Route Information ====================
    
    @Schema(description = "Complete route information")
    private RouteDetails route;
    
    // ==================== Schedule Information ====================
    
    @Schema(description = "Schedule metadata (without stops)")
    private ScheduleDetails schedule;
    
    // ==================== Route Schedule Stops ====================
    
    @Schema(description = "All stops in this route and schedule with unified data (route + schedule + stop info)")
    private List<RouteScheduleStop> routeScheduleStops;
    
    // ==================== Trip Information (optional) ====================
    
    @Schema(description = "Trip-specific information (only if tripId was provided)")
    private TripDetails trip;
    
    // ==================== Journey Summary ====================
    
    @Schema(description = "Summary of the journey from origin to destination")
    private JourneySummary journeySummary;
    
    /**
     * Complete route information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Detailed route information")
    public static class RouteDetails {
        @Schema(description = "Route ID")
        private UUID routeId;
        
        @Schema(description = "Route name in English")
        private String name;
        
        @Schema(description = "Route name in Sinhala")
        private String nameSinhala;
        
        @Schema(description = "Route name in Tamil")
        private String nameTamil;
        
        @Schema(description = "Route number")
        private String routeNumber;
        
        @Schema(description = "Road type")
        private String roadType;
        
        @Schema(description = "Route description")
        private String description;
        
        @Schema(description = "Route through (via) in English")
        private String routeThrough;
        
        @Schema(description = "Route through in Sinhala")
        private String routeThroughSinhala;
        
        @Schema(description = "Route through in Tamil")
        private String routeThroughTamil;
        
        @Schema(description = "Total route distance in km")
        private Double totalDistanceKm;
        
        @Schema(description = "Estimated total duration in minutes")
        private Integer estimatedDurationMinutes;
        
        @Schema(description = "Route direction")
        private String direction;
        
        @Schema(description = "Route group information")
        private RouteGroupInfo routeGroup;
        
        @Schema(description = "Start stop of the route")
        private StopInfo startStop;
        
        @Schema(description = "End stop of the route")
        private StopInfo endStop;
    }
    
    /**
     * Route group information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Route group information")
    public static class RouteGroupInfo {
        private UUID id;
        private String name;
        private String nameSinhala;
        private String nameTamil;
    }
    
    /**
     * Stop information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Stop information")
    public static class StopInfo {
        private UUID id;
        private String name;
        private String nameSinhala;
        private String nameTamil;
        private String description;
        private LocationDto location;
        private Boolean isAccessible;
    }
    
    /**
     * Complete schedule information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Detailed schedule information")
    public static class ScheduleDetails {
        @Schema(description = "Schedule ID")
        private UUID scheduleId;
        
        @Schema(description = "Schedule name")
        private String name;
        
        @Schema(description = "Schedule description")
        private String description;
        
        @Schema(description = "Schedule type (DAILY, WEEKDAY, WEEKEND, etc.)")
        private String scheduleType;
        
        @Schema(description = "Schedule status")
        private String status;
        
        @Schema(description = "Effective start date")
        private LocalDate effectiveStartDate;
        
        @Schema(description = "Effective end date")
        private LocalDate effectiveEndDate;
        
        @Schema(description = "Whether the schedule is active on the query date")
        private Boolean isActiveOnDate;
        
        @Schema(description = "Total number of stops in this schedule")
        private Integer totalStops;
        
        @Schema(description = "Calendar information (days of operation)")
        private ScheduleCalendarInfo calendar;
        
        @Schema(description = "Exceptions for this schedule")
        private List<ScheduleExceptionInfo> exceptions;
    }
    
    /**
     * Unified route and schedule stop information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Unified stop information combining route stop, schedule stop, and stop metadata")
    public static class RouteScheduleStop {
        // Route Stop Information
        @Schema(description = "Route stop ID")
        private UUID routeStopId;
        
        @Schema(description = "Schedule stop ID")
        private UUID scheduleStopId;
        
        @Schema(description = "Stop order in both route and schedule")
        private Integer stopOrder;
        
        @Schema(description = "Stop information")
        private StopInfo stop;
        
        // Distance with fallback (verified -> unverified -> calculated)
        @Schema(description = "Distance from route start in km (resolved with fallback)")
        private Double distanceFromStartKm;
        
        @Schema(description = "Verified distance from route start in km")
        private Double distanceFromStartKmVerified;
        
        @Schema(description = "Unverified distance from route start in km (user-submitted)")
        private Double distanceFromStartKmUnverified;
        
        @Schema(description = "Calculated distance from route start in km (system-generated)")
        private Double distanceFromStartKmCalculated;
        
        @Schema(description = "Whether this is the user's origin stop")
        private Boolean isOrigin;
        
        @Schema(description = "Whether this is the user's destination stop")
        private Boolean isDestination;
        
        // Verified times
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Verified arrival time", type = "string", pattern = "HH:mm:ss")
        private LocalTime arrivalTime;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Verified departure time", type = "string", pattern = "HH:mm:ss")
        private LocalTime departureTime;
        
        // Unverified times
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Unverified arrival time (user-submitted)", type = "string", pattern = "HH:mm:ss")
        private LocalTime arrivalTimeUnverified;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Unverified departure time (user-submitted)", type = "string", pattern = "HH:mm:ss")
        private LocalTime departureTimeUnverified;
        
        // Calculated times
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Calculated arrival time (system-generated)", type = "string", pattern = "HH:mm:ss")
        private LocalTime arrivalTimeCalculated;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Calculated departure time (system-generated)", type = "string", pattern = "HH:mm:ss")
        private LocalTime departureTimeCalculated;
        
        // Resolved times based on preference
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Resolved arrival time based on preference", type = "string", pattern = "HH:mm:ss")
        private LocalTime resolvedArrivalTime;
        
        @Schema(description = "Source of resolved arrival time")
        private TimeSourceEnum arrivalTimeSource;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Resolved departure time based on preference", type = "string", pattern = "HH:mm:ss")
        private LocalTime resolvedDepartureTime;
        
        @Schema(description = "Source of resolved departure time")
        private TimeSourceEnum departureTimeSource;
    }
    
    /**
     * Schedule calendar information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Schedule calendar - days of operation")
    public static class ScheduleCalendarInfo {
        private Boolean monday;
        private Boolean tuesday;
        private Boolean wednesday;
        private Boolean thursday;
        private Boolean friday;
        private Boolean saturday;
        private Boolean sunday;
        
        @Schema(description = "Whether the schedule operates on the query date based on calendar")
        private Boolean operatesOnQueryDate;
        
        @Schema(description = "Summary of operating days")
        private String operatingDaysSummary;
    }
    
    /**
     * Schedule exception information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Schedule exception")
    public static class ScheduleExceptionInfo {
        private UUID id;
        
        @Schema(description = "Date of the exception")
        private LocalDate exceptionDate;
        
        @Schema(description = "Type of exception (ADDED, REMOVED)")
        private String exceptionType;
        
        @Schema(description = "Reason for the exception")
        private String reason;
        
        @Schema(description = "Whether this exception affects the query date")
        private Boolean affectsQueryDate;
    }
    
    /**
     * Trip-specific details (when tripId is provided)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Trip-specific information")
    public static class TripDetails {
        @Schema(description = "Trip ID")
        private UUID tripId;
        
        @Schema(description = "Trip date")
        private LocalDate tripDate;
        
        @Schema(description = "Trip status (scheduled, active, completed, cancelled)")
        private String status;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Scheduled departure time", type = "string", pattern = "HH:mm:ss")
        private LocalTime scheduledDepartureTime;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Scheduled arrival time", type = "string", pattern = "HH:mm:ss")
        private LocalTime scheduledArrivalTime;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Actual departure time (if departed)", type = "string", pattern = "HH:mm:ss")
        private LocalTime actualDepartureTime;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Actual arrival time (if completed)", type = "string", pattern = "HH:mm:ss")
        private LocalTime actualArrivalTime;
        
        @Schema(description = "Delay in minutes (positive = late, negative = early)")
        private Integer delayMinutes;
        
        @Schema(description = "Bus information")
        private BusInfo bus;
        
        @Schema(description = "Operator information")
        private OperatorInfo operator;
        
        @Schema(description = "Passenger Service Permit information")
        private PspInfo psp;
        
        @Schema(description = "Real-time location data (if available)")
        private RealTimeInfo realTime;
    }
    
    /**
     * Bus information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Bus information")
    public static class BusInfo {
        private UUID busId;
        private String plateNumber;
        private String model;
        private String manufacturer;
        private Integer capacity;
        private Integer manufactureYear;
        private Boolean hasAirConditioning;
        private Boolean isAccessible;
    }
    
    /**
     * Operator information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Operator information")
    public static class OperatorInfo {
        private UUID operatorId;
        private String name;
        private String operatorType;
        private String region;
        private String contactNumber;
    }
    
    /**
     * PSP (Passenger Service Permit) information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Passenger Service Permit information")
    public static class PspInfo {
        private UUID pspId;
        private String permitNumber;
        private LocalDate validFrom;
        private LocalDate validUntil;
        private String status;
    }
    
    /**
     * Real-time information for active trips
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Real-time trip information")
    public static class RealTimeInfo {
        @Schema(description = "Current latitude of the bus")
        private Double currentLatitude;
        
        @Schema(description = "Current longitude of the bus")
        private Double currentLongitude;
        
        @Schema(description = "Last location update timestamp")
        @JsonFormat(pattern = "HH:mm:ss")
        private LocalTime lastUpdated;
        
        @Schema(description = "Current speed in km/h")
        private Double speedKmh;
        
        @Schema(description = "Heading direction in degrees")
        private Double heading;
        
        @Schema(description = "Last completed stop")
        private StopInfo lastStop;
        
        @Schema(description = "Next upcoming stop")
        private StopInfo nextStop;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Estimated arrival at next stop", type = "string", pattern = "HH:mm:ss")
        private LocalTime etaNextStop;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Estimated arrival at user's origin stop", type = "string", pattern = "HH:mm:ss")
        private LocalTime etaOrigin;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Estimated arrival at user's destination stop", type = "string", pattern = "HH:mm:ss")
        private LocalTime etaDestination;
    }
    
    /**
     * Journey summary from origin to destination
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Summary of the journey between origin and destination")
    public static class JourneySummary {
        @Schema(description = "Origin stop information")
        private StopInfo originStop;
        
        @Schema(description = "Destination stop information")
        private StopInfo destinationStop;
        
        @Schema(description = "Distance between origin and destination in km")
        private Double distanceKm;
        
        @Schema(description = "Number of stops between origin and destination (exclusive)")
        private Integer intermediateStopCount;
        
        @Schema(description = "Estimated journey duration in minutes")
        private Integer estimatedDurationMinutes;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Departure time from origin", type = "string", pattern = "HH:mm:ss")
        private LocalTime departureFromOrigin;
        
        @Schema(description = "Source of departure time")
        private TimeSourceEnum departureTimeSource;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Arrival time at destination", type = "string", pattern = "HH:mm:ss")
        private LocalTime arrivalAtDestination;
        
        @Schema(description = "Source of arrival time")
        private TimeSourceEnum arrivalTimeSource;
        
        @Schema(description = "Stop order of origin in the schedule")
        private Integer originStopOrder;
        
        @Schema(description = "Stop order of destination in the schedule")
        private Integer destinationStopOrder;
        
        @Schema(description = "Status message about the journey")
        private String statusMessage;
    }
}
