package com.busmate.routeschedule.dto.response.passenger;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
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
        private String arrivalTime;
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