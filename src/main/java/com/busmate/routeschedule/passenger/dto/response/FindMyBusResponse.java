package com.busmate.routeschedule.passenger.dto.response;

import com.busmate.routeschedule.dto.common.LocationDto;
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
    
    @Schema(description = "Total number of results found")
    private int totalResults;
    
    @Schema(description = "List of bus/route results sorted by departure time or distance")
    private List<BusResult> results;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Stop information summary")
    public static class StopInfo {
        private UUID id;
        private String name;
        private String nameSinhala;
        private String nameTamil;
        private LocationDto location;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Individual bus/route result")
    public static class BusResult {
        
        @Schema(description = "Data mode - REALTIME, SCHEDULE, or STATIC", example = "REALTIME")
        private DataMode dataMode;
        
        // Route Information (always available)
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
        
        @Schema(description = "Route through (via)")
        private String routeThrough;
        
        @Schema(description = "Route through in Sinhala")
        private String routeThroughSinhala;
        
        @Schema(description = "Route through in Tamil")
        private String routeThroughTamil;
        
        // Distance and Duration
        @Schema(description = "Distance from origin to destination in km")
        private Double distanceKm;
        
        @Schema(description = "Estimated travel duration in minutes")
        private Integer estimatedDurationMinutes;
        
        @Schema(description = "Stop order at origin")
        private Integer fromStopOrder;
        
        @Schema(description = "Stop order at destination")
        private Integer toStopOrder;
        
        // Schedule Information (when available)
        @Schema(description = "Schedule ID (if schedule data available)")
        private UUID scheduleId;
        
        @Schema(description = "Schedule name")
        private String scheduleName;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Scheduled departure time at origin stop", type = "string", pattern = "HH:mm:ss")
        private LocalTime scheduledDepartureAtOrigin;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Scheduled arrival time at destination stop", type = "string", pattern = "HH:mm:ss")
        private LocalTime scheduledArrivalAtDestination;
        
        // Trip Information (when real-time data available)
        @Schema(description = "Trip ID (if trip data available)")
        private UUID tripId;
        
        @Schema(description = "Trip status", example = "active")
        private String tripStatus;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Actual departure time (if available)", type = "string", pattern = "HH:mm:ss")
        private LocalTime actualDepartureTime;
        
        @JsonFormat(pattern = "HH:mm:ss")
        @Schema(description = "Actual arrival time (if available)", type = "string", pattern = "HH:mm:ss")
        private LocalTime actualArrivalTime;
        
        @Schema(description = "Estimated arrival at origin stop based on current trip progress")
        @JsonFormat(pattern = "HH:mm:ss")
        private LocalTime estimatedArrivalAtOrigin;
        
        // Bus Information (when trip data available)
        @Schema(description = "Bus ID")
        private UUID busId;
        
        @Schema(description = "Bus plate number")
        private String busPlateNumber;
        
        @Schema(description = "Bus model")
        private String busModel;
        
        @Schema(description = "Bus capacity")
        private Integer busCapacity;
        
        // Operator Information
        @Schema(description = "Operator ID")
        private UUID operatorId;
        
        @Schema(description = "Operator name")
        private String operatorName;
        
        // Additional flags
        @Schema(description = "Whether the bus has already departed from origin")
        private Boolean alreadyDeparted;
        
        @Schema(description = "User-friendly message about this result")
        private String statusMessage;
        
        // Route Group
        @Schema(description = "Route group ID")
        private UUID routeGroupId;
        
        @Schema(description = "Route group name")
        private String routeGroupName;
    }
    
    @Schema(description = "Data availability mode")
    public enum DataMode {
        @Schema(description = "Real-time trip data available - best quality")
        REALTIME,
        
        @Schema(description = "Schedule data available but no active trips")
        SCHEDULE,
        
        @Schema(description = "Only static route information available")
        STATIC
    }
}
