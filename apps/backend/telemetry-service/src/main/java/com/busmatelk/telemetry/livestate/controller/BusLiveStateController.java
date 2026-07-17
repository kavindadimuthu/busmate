package com.busmatelk.telemetry.livestate.controller;

import com.busmatelk.telemetry.livestate.dto.BusLiveStateResponse;
import com.busmatelk.telemetry.livestate.repository.BusLiveStateRepository;
import com.busmatelk.telemetry.shared.exception.NotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Read model for "where is bus X right now?" (IoT Platform Layer plan, Phase 3) — backs both
 * core-service's live-ETA lookup and api-gateway's SSE bootstrap/fallback. Deliberately
 * unauthenticated ({@code GET /api/live/**} is {@code permitAll} in {@code SecurityConfig}), same
 * convention as core-service's own public {@code GET /api/**}: this is read-only, non-sensitive
 * position data consumed server-to-server, not staff-gated device management.
 */
@RestController
@RequestMapping("/api/live/buses")
@RequiredArgsConstructor
@Tag(name = "Live bus state", description = "Latest known position per bus, from the telemetry ingest pipeline")
public class BusLiveStateController {

    private final BusLiveStateRepository liveStateRepository;

    @Operation(summary = "Latest position for every bus with recent telemetry")
    @GetMapping
    public List<BusLiveStateResponse> list() {
        return liveStateRepository.findAll().stream().map(BusLiveStateResponse::of).toList();
    }

    @Operation(summary = "Latest position for one bus")
    @GetMapping("/{busId}")
    public BusLiveStateResponse get(@PathVariable UUID busId) {
        return liveStateRepository.findById(busId)
                .map(BusLiveStateResponse::of)
                .orElseThrow(() -> new NotFoundException("No live state for bus: " + busId));
    }
}
