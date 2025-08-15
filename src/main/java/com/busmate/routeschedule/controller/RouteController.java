package com.busmate.routeschedule.controller;

import com.busmate.routeschedule.dto.request.RouteGroupRequest;
import com.busmate.routeschedule.dto.response.RouteGroupResponse;
import com.busmate.routeschedule.dto.response.RouteResponse;
import com.busmate.routeschedule.service.RouteGroupService;
import com.busmate.routeschedule.service.RouteService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
@Tag(name = "02. Route Management", description = "APIs for managing routes and route groups")
public class RouteController {
    private final RouteService routeService;
    private final RouteGroupService routeGroupService;

    // Route APIs
    @GetMapping("/{id}")
    public ResponseEntity<RouteResponse> getRouteById(@PathVariable UUID id) {
        RouteResponse response = routeService.getRouteById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<RouteResponse>> getAllRoutes() {
        List<RouteResponse> responses = routeService.getAllRoutes();
        return ResponseEntity.ok(responses);
    }

    // Route Group APIs
    @PostMapping("/groups")
    public ResponseEntity<RouteGroupResponse> createRouteGroup(@Valid @RequestBody RouteGroupRequest request, Authentication authentication) {
        String userId = authentication.getName();
        RouteGroupResponse response = routeGroupService.createRouteGroup(request, userId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/groups/{id}")
    public ResponseEntity<RouteGroupResponse> getRouteGroupById(@PathVariable UUID id) {
        RouteGroupResponse response = routeGroupService.getRouteGroupById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/groups")
    public ResponseEntity<List<RouteGroupResponse>> getAllRouteGroups() {
        List<RouteGroupResponse> responses = routeGroupService.getAllRouteGroups();
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/groups/{id}")
    public ResponseEntity<RouteGroupResponse> updateRouteGroup(@PathVariable UUID id, @Valid @RequestBody RouteGroupRequest request, Authentication authentication) {
        String userId = authentication.getName();
        RouteGroupResponse response = routeGroupService.updateRouteGroup(id, request, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/groups/{id}")
    public ResponseEntity<Void> deleteRouteGroup(@PathVariable UUID id) {
        routeGroupService.deleteRouteGroup(id);
        return ResponseEntity.noContent().build();
    }
}