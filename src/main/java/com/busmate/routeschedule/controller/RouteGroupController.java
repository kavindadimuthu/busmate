package com.busmate.routeschedule.controller;

import com.busmate.routeschedule.dto.request.RouteGroupRequest;
import com.busmate.routeschedule.dto.response.RouteGroupResponse;
import com.busmate.routeschedule.service.RouteGroupService;
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
@RequestMapping("/api/route-groups")
@RequiredArgsConstructor
@Tag(name = "3. Route Group Management", description = "APIs for managing route groups")
public class RouteGroupController {
    private final RouteGroupService routeGroupService;

    @PostMapping
    public ResponseEntity<RouteGroupResponse> createRouteGroup(@Valid @RequestBody RouteGroupRequest request, Authentication authentication) {
        String userId = authentication.getName();
        RouteGroupResponse response = routeGroupService.createRouteGroup(request, userId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RouteGroupResponse> getRouteGroupById(@PathVariable UUID id) {
        RouteGroupResponse response = routeGroupService.getRouteGroupById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<RouteGroupResponse>> getAllRouteGroups() {
        List<RouteGroupResponse> responses = routeGroupService.getAllRouteGroups();
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RouteGroupResponse> updateRouteGroup(@PathVariable UUID id, @Valid @RequestBody RouteGroupRequest request, Authentication authentication) {
        String userId = authentication.getName();
        RouteGroupResponse response = routeGroupService.updateRouteGroup(id, request, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRouteGroup(@PathVariable UUID id) {
        routeGroupService.deleteRouteGroup(id);
        return ResponseEntity.noContent().build();
    }
}