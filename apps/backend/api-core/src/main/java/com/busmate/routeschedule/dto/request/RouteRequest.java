// src/main/java/com/ntc/busmate/routeschedules/dto/request/RouteRequest.java
package com.busmate.routeschedule.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class RouteRequest {
    @NotBlank(message = "Name is mandatory")
    private String name; // English name (primary)

    private String nameSinhala;

    private String nameTamil;

    private String routeNumber;

    private String description;

    private String roadType; // NORMALWAY or EXPRESSWAY

    private String routeThrough; // English (primary)

    private String routeThroughSinhala;

    private String routeThroughTamil;

    @NotNull(message = "Route group ID is mandatory")
    private UUID routeGroupId; // Changed from Long to UUID

    @NotNull(message = "Start stop ID is mandatory")
    private UUID startStopId;

    @NotNull(message = "End stop ID is mandatory")
    private UUID endStopId;

    private Double distanceKm;

    private Integer estimatedDurationMinutes;

    @NotNull(message = "Direction is mandatory")
    private String direction;

    private List<RouteStopRequest> routeStops;

    @Data
    public static class RouteStopRequest {
        @NotNull(message = "Stop ID is mandatory")
        private UUID stopId;

        @NotNull(message = "Stop order is mandatory")
        private Integer stopOrder;

        private Double distanceFromStartKm;
        
        private Double distanceFromStartKmUnverified;
        
        private Double distanceFromStartKmCalculated;
    }
}