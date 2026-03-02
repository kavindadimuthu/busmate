package com.busmate.routeschedule.passenger.dto.response;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import com.busmate.routeschedule.common.dto.LocationDto;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PassengerTripResponse {
    private UUID tripId;
    private String routeName;
    private LocalDateTime scheduledDeparture;
    private LocalDateTime scheduledArrival;
    private LocalDateTime estimatedDeparture;
    private LocalDateTime estimatedArrival;
    private Integer duration;
    private Double distance;
    
    // Relational identifiers for easy data joining
    private UUID scheduleId;
    private UUID routeId;
    private UUID routeGroupId;
    private UUID operatorId;
    private UUID busId;
    
    private PassengerRouteResponse.PassengerStopSummary departureStop;
    private PassengerRouteResponse.PassengerStopSummary arrivalStop;
    private List<PassengerIntermediateStop> intermediateStops;
    
    private PassengerBusInfo bus;
    private PassengerRouteResponse.PassengerOperatorSummary operator;
    
    private Double fare;
    private String status;
    private Integer delay;
    private Integer availableSeats;
    private Boolean bookingAvailable;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PassengerIntermediateStop {
        private UUID stopId;
        private String name;
        private String description;
        private String city;
        private LocationDto location;
        private Boolean isAccessible;
        private List<String> facilities;
        private Integer stopOrder;
        private Double distanceFromStart;
        
        // Detailed timing information for this specific stop
        private LocalTime scheduledArrivalTime;
        private LocalTime scheduledDepartureTime;
        private LocalTime actualArrivalTime;
        private LocalTime actualDepartureTime;
        private LocalDateTime estimatedArrivalTime;
        private LocalDateTime estimatedDepartureTime;
        
        // Status and operational info
        private Integer arrivalDelay;
        private Integer departureDelay;
        private String status;
        
        // Legacy fields for backward compatibility
        @Deprecated
        private String arrivalTime;
        @Deprecated
        private String departureTime;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PassengerBusInfo {
        private String plateNumber;
        private Integer capacity;
        private String type;
        private PassengerBusFeatures features;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PassengerBusFeatures {
        private Boolean isAccessible;
        private Boolean hasAirConditioning;
        private Boolean hasWiFi;
        private Boolean hasToilet;
    }
}
