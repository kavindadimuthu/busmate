package com.busmate.routeschedule.dto.response.passenger;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import com.busmate.routeschedule.dto.common.LocationDto;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PassengerRouteResponse {
    private UUID routeId;
    private String routeName;
    private String description;
    private Double distance;
    private Integer estimatedDuration;
    
    private PassengerOperatorSummary operator;
    private PassengerStopSummary fromStop;
    private PassengerStopSummary toStop;
    
    // Additional fields for route details
    private List<PassengerStopSummary> stops;
    private List<PassengerScheduleSummary> schedules;
    
    private PassengerServiceFrequency serviceFrequency;
    private PassengerFareInfo fareInfo;
    private PassengerRouteFeatures features;
    
    private Integer scheduleCount;
    private String nextDeparture;
    private Integer popularity;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PassengerOperatorSummary {
        private UUID id;
        private String name;
        private String type;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PassengerStopSummary {
        private UUID id;
        private String name;
        private String city;
        private LocationDto location;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PassengerScheduleSummary {
        private UUID id;
        private String name;
        private String description;
        private String type;
        private String status;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PassengerServiceFrequency {
        private Integer interval;
        private String unit;
        private String description;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PassengerFareInfo {
        private Double minimumFare;
        private Double maximumFare;
        private String currency;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PassengerRouteFeatures {
        private Boolean isAccessible;
        private Boolean hasAirConditioning;
        private Boolean hasWiFi;
        private Boolean allowsLuggage;
    }
}