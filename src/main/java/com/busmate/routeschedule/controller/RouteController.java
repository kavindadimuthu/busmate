package com.busmate.routeschedule.controller;

import com.busmate.routeschedule.dto.response.RouteResponse;
import com.busmate.routeschedule.service.RouteService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
@Tag(name = "2. Route Management", description = "APIs for managing routes")
public class RouteController {
    private final RouteService routeService;

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
}