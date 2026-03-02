package com.busmate.routeschedule.passenger.dto.response;

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
public class PassengerStopResponse {
    private UUID stopId;
    private String name;
    private String description;
    private String city;
    private LocationDto location;
    private Boolean isAccessible;
    private List<String> facilities;
    private Integer routeCount;
    private Integer operatorCount;
    private List<PassengerUpcomingTrip> upcomingTrips;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PassengerUpcomingTrip {
        private String routeName;
        private String departureTime;
        private String destination;
        private Integer estimatedDelay;
        private String busNumber;
        private String status;
    }
}
