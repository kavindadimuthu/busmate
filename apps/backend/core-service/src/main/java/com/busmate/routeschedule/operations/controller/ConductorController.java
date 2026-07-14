package com.busmate.routeschedule.operations.controller;

import com.busmate.routeschedule.operations.dto.response.TripResponse;
import com.busmate.routeschedule.operations.enums.TripStatusEnum;
import com.busmate.routeschedule.operations.service.TripService;
import com.busmate.routeschedule.shared.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Conductor self-service trip endpoints.
 *
 * A conductor has no domain entity of its own in core-service - a conductor is a user-service
 * account (userType "conductor") whose userId is stored as the bare {@code Trip.conductorId}
 * column. This controller is the conductor-facing counterpart to
 * {@link com.busmate.routeschedule.fleet.controller.BusOperatorController}: every endpoint is
 * scoped to "trips assigned to this conductorId", and the write endpoints additionally verify
 * that the trip is actually assigned to the calling conductor before allowing a status
 * transition - unlike the generic {@code /api/trips/{id}/start|complete|cancel} endpoints, which
 * have no ownership check at all.
 */
@RestController
@RequestMapping("/api/v1/conductor")
@RequiredArgsConstructor
@Tag(name = "09. Conductor Self-Service", description = "API endpoints for a conductor to manage their own assigned trips")
public class ConductorController {

    private final TripService tripService;

    @GetMapping("/{conductorId}/trips")
    @Operation(
        summary = "Get trips assigned to this conductor",
        description = "Retrieve every trip whose conductorId matches the given conductor, optionally filtered by status."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Trips retrieved successfully")
    })
    public ResponseEntity<List<TripResponse>> getMyTrips(
            @Parameter(description = "Conductor's user-service userId", required = true)
            @PathVariable UUID conductorId,
            @Parameter(description = "Filter by trip status")
            @RequestParam(required = false) TripStatusEnum status) {

        List<TripResponse> trips = tripService.getTripsByConductor(conductorId);
        if (status != null) {
            trips = trips.stream()
                    .filter(trip -> status.name().equals(trip.getStatus()))
                    .collect(Collectors.toList());
        }
        return ResponseEntity.ok(trips);
    }

    @GetMapping("/{conductorId}/trips/{tripId}")
    @Operation(
        summary = "Get a specific trip assigned to this conductor",
        description = "Retrieve trip details, verifying the trip is actually assigned to this conductor."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Trip retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Trip not found or not assigned to this conductor")
    })
    public ResponseEntity<TripResponse> getMyTripById(
            @Parameter(description = "Conductor's user-service userId", required = true)
            @PathVariable UUID conductorId,
            @Parameter(description = "Trip ID", required = true)
            @PathVariable UUID tripId) {

        TripResponse trip = tripService.getTripById(tripId);
        if (!conductorId.equals(trip.getConductorId())) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(trip);
    }

    @PatchMapping("/{conductorId}/trips/{tripId}/start")
    @Operation(summary = "Start one of this conductor's trips")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Trip started successfully"),
        @ApiResponse(responseCode = "404", description = "Trip not found or not assigned to this conductor")
    })
    public ResponseEntity<TripResponse> startMyTrip(
            @PathVariable UUID conductorId,
            @PathVariable UUID tripId,
            Authentication authentication) {

        verifyOwnership(conductorId, tripId);
        TripResponse response = tripService.startTrip(tripId, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{conductorId}/trips/{tripId}/complete")
    @Operation(summary = "Complete one of this conductor's trips")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Trip completed successfully"),
        @ApiResponse(responseCode = "404", description = "Trip not found or not assigned to this conductor")
    })
    public ResponseEntity<TripResponse> completeMyTrip(
            @PathVariable UUID conductorId,
            @PathVariable UUID tripId,
            Authentication authentication) {

        verifyOwnership(conductorId, tripId);
        TripResponse response = tripService.completeTrip(tripId, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{conductorId}/trips/{tripId}/cancel")
    @Operation(summary = "Cancel one of this conductor's trips")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Trip cancelled successfully"),
        @ApiResponse(responseCode = "404", description = "Trip not found or not assigned to this conductor")
    })
    public ResponseEntity<TripResponse> cancelMyTrip(
            @PathVariable UUID conductorId,
            @PathVariable UUID tripId,
            @RequestParam String reason,
            Authentication authentication) {

        verifyOwnership(conductorId, tripId);
        TripResponse response = tripService.cancelTrip(tripId, reason, authentication.getName());
        return ResponseEntity.ok(response);
    }

    private void verifyOwnership(UUID conductorId, UUID tripId) {
        TripResponse trip = tripService.getTripById(tripId);
        if (!conductorId.equals(trip.getConductorId())) {
            throw new ResourceNotFoundException("Trip not found with ID: " + tripId);
        }
    }
}
