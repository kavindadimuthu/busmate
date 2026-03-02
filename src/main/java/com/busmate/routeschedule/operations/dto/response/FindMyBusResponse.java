package com.busmate.routeschedule.operations.dto.response;

import com.busmate.routeschedule.shared.dto.LocationDto;
import com.busmate.routeschedule.shared.enums.TimePreferenceEnum;
import com.busmate.routeschedule.shared.enums.TimeSourceEnum;
import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import com.busmate.routeschedule.fleet.entity.Bus;
import com.busmate.routeschedule.fleet.entity.Operator;
import com.busmate.routeschedule.network.entity.Route;
import com.busmate.routeschedule.scheduling.entity.Schedule;
import com.busmate.routeschedule.network.entity.Stop;
import com.busmate.routeschedule.operations.entity.Trip;

/**
 * Response for Find My Bus API.
 * 
 * Provides schedule-based bus/route information between two stops.
 * Each result contains route information, schedule timings, and optionally
 * trip details (bus, operator, permit) if a trip exists for the schedule.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Response containing buses/routes found between two stops")
public class FindMyBusResponse {
    
    @Schema(description = "Whether the search was successful")
    private boolean success;
    
    @Schema(description = "Message providing additional context")
    private String message;
    
    @Schema(description = "Origin stop information")
    private StopInfo fromStop;
    
    @Schema(description = "Destination stop information")
    private StopInfo toStop;
    
    @Schema(description = "Date for which results are provided")
    private LocalDate searchDate;
    
    @JsonFormat(pattern = "HH:mm")
    @Schema(description = "Time from which results are filtered", type = "string", pattern = "HH:mm")
    private LocalTime searchTime;
    
    @Schema(description = "Time preference used for this search")
    private TimePreferenceEnum timePreference;
    
    @Schema(description = "Total number of results found")
    private int totalResults;
    
    @Schema(description = "List of bus/route results sorted by departure time")
    private List<BusResult> results;
    
    /**
     * Stop information summary
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Stop information summary")
    public static class StopInfo {
        @Schema(description = "Stop UUID")
        private UUID id;
        
        @Schema(description = "Stop name in English")
        private String name;
        
        @Schema(description = "Stop name in Sinhala")
        private String nameSinhala;
        
        @Schema(description = "Stop name in Tamil")
        private String nameTamil;
        
        @Schema(description = "Stop location details")
        private LocationDto location;
    }
    
    /**
     * Individual bus/route result with schedule and optional trip information.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Individual bus/route result with schedule and trip information")
    public static class BusResult {
        
        // ==================== Route Information ====================
        
        @Schema(description = "Route ID")
        private UUID routeId;
        
        @Schema(description = "Route name in English")
        private String routeName;
        
        @Schema(description = "Route name in Sinhala")
        private String routeNameSinhala;
        
        @Schema(description = "Route name in Tamil")
        private String routeNameTamil;
        
        @Schema(description = "Route number", example = "101")
        private String routeNumber;
        
        @Schema(description = "Road type", example = "NORMALWAY")
        private String roadType;
        
        @Schema(description = "Route description")
        private String routeDescription;
        
        @Schema(description = "Route through (via) in English")
        private String routeThrough;
        
        @Schema(description = "Route through in Sinhala")
        private String routeThroughSinhala;
        
        @Schema(description = "Route through in Tamil")
        private String routeThroughTamil;
        
        // ==================== Route Group Information ====================
        
        @Schema(description = "Route group ID")
        private UUID routeGroupId;
        
        @Schema(description = "Route group name in English")
        private String routeGroupName;
        
        @Schema(description = "Route group name in Sinhala")
        private String routeGroupNameSinhala;
        
        @Schema(description = "Route group name in Tamil")
        private String routeGroupNameTamil;
        
        // ==================== Distance and Stop Information ====================
        
        @Schema(description = "Distance from origin to destination in km")
        private Double distanceKm;
        
        @Schema(description = "Estimated travel duration in minutes")
        private Integer estimatedDurationMinutes;
        
        @Schema(description = "Stop order at origin")
        private Integer fromStopOrder;
        
        @Schema(description = "Stop order at destination")
        private Integer toStopOrder;
        
        // ==================== Schedule Information ====================
        
        @Schema(description = "Schedule ID")
        private UUID scheduleId;
        
        @Schema(description = "Schedule name")
        private String scheduleName;
        
        @Schema(description = "Schedule type (DAILY, WEEKDAY, WEEKEND, etc.)")
        private String scheduleType;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Departure time at origin stop", type = "string", pattern = "HH:mm:ss")
        private LocalTime departureAtOrigin;
        
        @Schema(description = "Source of departure time (VERIFIED, UNVERIFIED, CALCULATED, UNAVAILABLE)")
        private TimeSourceEnum departureAtOriginSource;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Arrival time at destination stop", type = "string", pattern = "HH:mm:ss")
        private LocalTime arrivalAtDestination;
        
        @Schema(description = "Source of arrival time (VERIFIED, UNVERIFIED, CALCULATED, UNAVAILABLE)")
        private TimeSourceEnum arrivalAtDestinationSource;
        
        // ==================== Schedule Start/End Stop Information ====================
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Departure time at schedule's first stop", type = "string", pattern = "HH:mm:ss")
        private LocalTime scheduleStartStopDepartureTime;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Arrival time at schedule's first stop (usually null)", type = "string", pattern = "HH:mm:ss")
        private LocalTime scheduleStartStopArrivalTime;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Arrival time at schedule's last stop", type = "string", pattern = "HH:mm:ss")
        private LocalTime scheduleEndStopArrivalTime;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Departure time at schedule's last stop (usually null)", type = "string", pattern = "HH:mm:ss")
        private LocalTime scheduleEndStopDepartureTime;
        
        @Schema(description = "Total distance of the entire schedule/route in km")
        private Double scheduleTotalDistanceKm;
        
        // ==================== Trip Information (if available) ====================
        
        @Schema(description = "Whether trip data is available for this schedule")
        private Boolean hasTripData;
        
        @Schema(description = "Trip ID (if trip exists)")
        private UUID tripId;
        
        @Schema(description = "Trip status (scheduled, active, completed, cancelled)")
        private String tripStatus;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Actual departure time from trip (if available)", type = "string", pattern = "HH:mm:ss")
        private LocalTime actualDepartureTime;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Actual arrival time from trip (if available)", type = "string", pattern = "HH:mm:ss")
        private LocalTime actualArrivalTime;
        
        // ==================== Bus Information (from trip if available) ====================
        
        @Schema(description = "Bus ID")
        private UUID busId;
        
        @Schema(description = "Bus registration/plate number")
        private String busPlateNumber;
        
        @Schema(description = "Bus model")
        private String busModel;
        
        @Schema(description = "Bus seating capacity")
        private Integer busCapacity;
        
        // ==================== Operator Information ====================
        
        @Schema(description = "Operator ID")
        private UUID operatorId;
        
        @Schema(description = "Operator name")
        private String operatorName;
        
        @Schema(description = "Operator type (CTB, PRIVATE, SLTB, etc.)")
        private String operatorType;
        
        // ==================== PSP Information (from trip if available) ====================
        
        @Schema(description = "Passenger Service Permit ID")
        private UUID pspId;
        
        @Schema(description = "Passenger Service Permit number")
        private String pspNumber;
        
        // ==================== Status Information ====================
        
        @Schema(description = "Whether the service has already departed from origin stop")
        private Boolean alreadyDeparted;
        
        @Schema(description = "User-friendly status message about this result")
        private String statusMessage;
    }
}
