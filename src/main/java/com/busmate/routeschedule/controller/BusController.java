package com.busmate.routeschedule.controller;

import com.busmate.routeschedule.dto.request.BusRequest;
import com.busmate.routeschedule.dto.response.BusResponse;
import com.busmate.routeschedule.service.BusService;
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
@RequestMapping("/api/buses")
@RequiredArgsConstructor
@Tag(name = "5. Bus Management", description = "APIs for managing bus details")
public class BusController {
    private final BusService busService;

    @PostMapping
    public ResponseEntity<BusResponse> createBus(@Valid @RequestBody BusRequest request, Authentication authentication) {
        String userId = authentication.getName();
        BusResponse response = busService.createBus(request, userId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BusResponse> getBusById(@PathVariable UUID id) {
        BusResponse response = busService.getBusById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<BusResponse>> getAllBuses() {
        List<BusResponse> responses = busService.getAllBuses();
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BusResponse> updateBus(@PathVariable UUID id, @Valid @RequestBody BusRequest request, Authentication authentication) {
        String userId = authentication.getName();
        BusResponse response = busService.updateBus(id, request, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBus(@PathVariable UUID id) {
        busService.deleteBus(id);
        return ResponseEntity.noContent().build();
    }
}
