package com.busmate.routeschedule.network.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.busmate.routeschedule.network.dto.request.PlaceRouteStopRequest;
import com.busmate.routeschedule.network.dto.response.RouteResponse;
import com.busmate.routeschedule.network.service.RouteStopPlacementService;
import com.busmate.routeschedule.shared.security.CallerContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** One stop at a time into a route's list — safe on a route that schedules already use (INC-051). */
@RestController
@RequestMapping("/api/routes/{routeId}/stops")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
@Tag(name = "02. Route Management")
public class RouteStopController {

    private final RouteStopPlacementService service;
    private final CallerContext callerContext;

    @PostMapping
    @Operation(summary = "Place a stop into a route after a given stop, leaving the others and their schedule times alone",
            operationId = "placeRouteStop")
    public ResponseEntity<RouteResponse> place(@PathVariable UUID routeId, @Valid @RequestBody PlaceRouteStopRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.place(routeId, request, callerContext.require().auditId()));
    }

    @DeleteMapping("/{routeStopId}")
    @Operation(summary = "Remove a stop placed by mistake; refused for a route's ends or a stop a schedule has a time at",
            operationId = "removeRouteStop")
    public RouteResponse remove(@PathVariable UUID routeId, @PathVariable UUID routeStopId) {
        return service.remove(routeId, routeStopId, callerContext.require().auditId());
    }
}
