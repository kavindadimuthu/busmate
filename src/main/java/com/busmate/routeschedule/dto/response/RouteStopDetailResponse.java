package com.busmate.routeschedule.dto.response;

import com.busmate.routeschedule.dto.common.LocationDto;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class RouteStopDetailResponse {
    private UUID routeStopId;
    private UUID stopId;
    private String stopName;
    private String stopNameSinhala;
    private String stopNameTamil;
    private String stopDescription;
    private LocationDto location;
    private Boolean isAccessible;
    private Integer stopOrder;
    private Double distanceFromStartKm;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}