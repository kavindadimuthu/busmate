// src/main/java/com/ntc/busmate/routeschedules/dto/request/RouteRequest.java
package com.busmate.routeschedule.network.dto.request;

import com.busmate.routeschedule.shared.provenance.SourceTier;
import jakarta.validation.constraints.Size;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;
import java.util.UUID;
import com.busmate.routeschedule.network.entity.Route;
import com.busmate.routeschedule.network.entity.Stop;

@Data
public class RouteRequest {
    /** Optional source of this record; defaults to field observation by BusMate. SRC_1 is MOT only. */
    private SourceTier sourceTier;

    @Size(max = 255)
    private String attributionLabel;

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

    // Group, endpoints and direction are optional (ADR-023): a contributor may know a route's name and number
    // and nothing more. On update, leaving one out leaves it as it was.
    private UUID routeGroupId; // Changed from Long to UUID

    private UUID startStopId;

    private UUID endStopId;

    private Double distanceKm;

    private Integer estimatedDurationMinutes;

    private String direction;

    /** Only a person asserts anything but UNKNOWN; left out, a new route is UNKNOWN and an edit keeps its value. */
    private com.busmate.routeschedule.network.enums.StopListCompletenessEnum stopListCompleteness;

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