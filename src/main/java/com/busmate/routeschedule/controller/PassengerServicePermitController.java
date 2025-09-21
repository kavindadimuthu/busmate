package com.busmate.routeschedule.controller;

import com.busmate.routeschedule.dto.request.PassengerServicePermitRequest;
import com.busmate.routeschedule.dto.response.PassengerServicePermitResponse;
import com.busmate.routeschedule.dto.response.PaginatedResponse;
import com.busmate.routeschedule.service.PassengerServicePermitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/permits")
@RequiredArgsConstructor
@Tag(name = "06. Permit Management", description = "APIs for managing passenger service permits")
public class PassengerServicePermitController {
    private final PassengerServicePermitService permitService;

    @PostMapping
    public ResponseEntity<PassengerServicePermitResponse> createPermit(@Valid @RequestBody PassengerServicePermitRequest request, Authentication authentication) {
        String userId = authentication.getName();
        PassengerServicePermitResponse response = permitService.createPermit(request, userId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get permit by ID", description = "Retrieve a specific passenger service permit by its ID")
    public ResponseEntity<PassengerServicePermitResponse> getPermitById(@PathVariable UUID id) {
        PassengerServicePermitResponse response = permitService.getPermitById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/all")
    @Operation(summary = "Get all permits", description = "Retrieve all passenger service permits without pagination")
    public ResponseEntity<List<PassengerServicePermitResponse>> getAllPermits() {
        List<PassengerServicePermitResponse> responses = permitService.getAllPermits();
        return ResponseEntity.ok(responses);
    }

    @GetMapping
    @Operation(summary = "Get permits with pagination", description = "Retrieve passenger service permits with pagination, filtering, and sorting options")
    public ResponseEntity<PaginatedResponse<PassengerServicePermitResponse>> getPermits(
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort field") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction (asc/desc)") @RequestParam(defaultValue = "desc") String sortDir,
            @Parameter(description = "Filter by status") @RequestParam(required = false) String status,
            @Parameter(description = "Filter by permit type") @RequestParam(required = false) String permitType,
            @Parameter(description = "Filter by operator name") @RequestParam(required = false) String operatorName,
            @Parameter(description = "Filter by route group name") @RequestParam(required = false) String routeGroupName) {
        
        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        PaginatedResponse<PassengerServicePermitResponse> response = permitService.getPermits(
                pageable, status, permitType, operatorName, routeGroupName);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/route-group/{routeGroupId}")
    @Operation(summary = "Get permits by route group", description = "Retrieve all passenger service permits for a specific route group")
    public ResponseEntity<List<PassengerServicePermitResponse>> getPermitsByRouteGroupId(
            @Parameter(description = "Route group ID") @PathVariable UUID routeGroupId) {
        List<PassengerServicePermitResponse> responses = permitService.getPermitsByRouteGroupId(routeGroupId);
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PassengerServicePermitResponse> updatePermit(@PathVariable UUID id, @Valid @RequestBody PassengerServicePermitRequest request, Authentication authentication) {
        String userId = authentication.getName();
        PassengerServicePermitResponse response = permitService.updatePermit(id, request, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePermit(@PathVariable UUID id) {
        permitService.deletePermit(id);
        return ResponseEntity.noContent().build();
    }
}
