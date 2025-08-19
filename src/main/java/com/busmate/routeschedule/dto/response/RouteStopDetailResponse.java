package com.busmate.routeschedule.dto.response;

import com.busmate.routeschedule.dto.common.LocationDto;
import lombok.Data;
import java.util.UUID;

@Data
public class RouteStopDetailResponse {
    private UUID routeStopId;
    private UUID stopId;
    private String stopName;
    private String stopDescription;
    private LocationDto location;
    private Boolean isAccessible;
    private Integer stopOrder;
    private Double distanceFromStartKm;
}