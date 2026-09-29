package com.busmate.routeschedule.network.dto.request;

import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Place a stop into a route's stop list without touching the stops already there")
public record PlaceRouteStopRequest(
        @NotNull UUID stopId,
        @Schema(description = "The route stop it comes after. Required unless the route has no stops yet")
        UUID afterRouteStopId,
        @DecimalMin("0") @Schema(description = "Distance from the start, if someone stated it. Recorded as unverified")
        Double distanceFromStartKmUnverified) {
}
