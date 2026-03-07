package com.busmate.routeschedule.network.dto.response;

import com.busmate.routeschedule.shared.dto.LocationDto;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class RouteGroupStopDetailResponse {
    // Route information
    private UUID routeId;
    private String routeName;
    private String routeNameSinhala;
    private String routeNameTamil;
    private String routeNumber;
    private String direction;
    
    // RouteStop information
    private UUID routeStopId;
    private Integer stopOrder;
    private Double distanceFromStartKm;
    
    // Stop information
    private UUID stopId;
    private String stopName;
    private String stopNameSinhala;
    private String stopNameTamil;
    private String stopDescription;
    private LocationDto location;
    private Boolean isAccessible;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
