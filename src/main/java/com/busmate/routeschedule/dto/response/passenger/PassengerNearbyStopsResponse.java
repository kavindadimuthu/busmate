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
public class PassengerNearbyStopsResponse {
    private List<PassengerNearbyStop> stops;
    private Integer totalFound;
    private Double searchRadius;
    private LocationDto userLocation;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PassengerNearbyStop {
        private UUID stopId;
        private String name;
        private String city;
        private LocationDto location;
        private Double distance;
        private String distanceUnit;
        private Boolean isAccessible;
        private List<String> facilities;
        private Integer routeCount;
        private Integer operatorCount;
        private List<PassengerStopResponse.PassengerUpcomingTrip> upcomingTrips;
    }
}