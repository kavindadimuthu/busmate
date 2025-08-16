package com.busmate.routeschedule.controller;

import com.busmate.routeschedule.dto.request.StopRequest;
import com.busmate.routeschedule.dto.response.StopResponse;
import com.busmate.routeschedule.service.StopService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
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
@RequestMapping("/api/stops")
@RequiredArgsConstructor
@Tag(name = "1. Bus Stop Management", description = "APIs for managing bus stops")
public class StopController {
    private final StopService stopService;

    // 1. CREATE - First operation for logical flow
    @PostMapping
    @Operation(
        summary = "Create a new bus stop", 
        description = "Creates a new bus stop with the provided details. Requires authentication.",
        operationId = "createStop"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Stop created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "409", description = "Stop already exists in the same city"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<StopResponse> createStop(
            @Valid @RequestBody StopRequest request, 
            Authentication authentication) {
        String userId = authentication.getName();
        StopResponse response = stopService.createStop(request, userId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // 2. READ ALL - Most commonly used operation
    @GetMapping
    @Operation(
        summary = "Get all stops with pagination, sorting, and search", 
        description = "Retrieve all stops with optional pagination, sorting, and multi-column search. " +
                     "Search is performed across name, address, city, and state columns. " +
                     "Default: page=0, size=10, sort=name",
        operationId = "getAllStops"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Stops retrieved successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid pagination or sorting parameters")
    })
    public ResponseEntity<Page<StopResponse>> getAllStops(
            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Page size (max 100)", example = "10")
            @RequestParam(defaultValue = "10") int size,
            
            @Parameter(description = "Sort by field name (name, createdAt, updatedAt, city, state)", example = "name")
            @RequestParam(defaultValue = "name") String sortBy,
            
            @Parameter(description = "Sort direction (asc or desc)", example = "asc")
            @RequestParam(defaultValue = "asc") String sortDir,
            
            @Parameter(description = "Search text to filter stops by name, address, city, or state", example = "Central")
            @RequestParam(required = false) String search) {
        
        // Validate page size
        if (size > 100) {
            size = 100; // Maximum page size limit
        }
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                   Sort.by(sortBy).descending() : 
                   Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<StopResponse> responses;
        if (search != null && !search.trim().isEmpty()) {
            responses = stopService.getAllStopsWithSearch(search.trim(), pageable);
        } else {
            responses = stopService.getAllStops(pageable);
        }
        
        return ResponseEntity.ok(responses);
    }

    // 3. READ ALL WITHOUT PAGINATION - Alternative read operation
    @GetMapping("/all")
    @Operation(
        summary = "Get all stops without pagination", 
        description = "Retrieve all stops as a simple list without pagination. " +
                     "Use this endpoint carefully as it returns all stops at once.",
        operationId = "getAllStopsAsList"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "All stops retrieved successfully")
    })
    public ResponseEntity<List<StopResponse>> getAllStopsAsList() {
        List<StopResponse> responses = stopService.getAllStops();
        return ResponseEntity.ok(responses);
    }

    // 4. READ BY ID - Specific read operation
    @GetMapping("/{id}")
    @Operation(
        summary = "Get stop by ID", 
        description = "Retrieve a specific bus stop by its unique identifier.",
        operationId = "getStopById"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Stop found and retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Stop not found"),
        @ApiResponse(responseCode = "400", description = "Invalid UUID format")
    })
    public ResponseEntity<StopResponse> getStopById(
            @Parameter(description = "Stop ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id) {
        StopResponse response = stopService.getStopById(id);
        return ResponseEntity.ok(response);
    }

    // 5. FILTER OPTIONS - Get distinct values for filtering
    @GetMapping("/filter-options/states")
    @Operation(
        summary = "Get distinct states", 
        description = "Retrieve all distinct states available in the stops database for filter dropdown options.",
        operationId = "getDistinctStates"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Distinct states retrieved successfully")
    })
    public ResponseEntity<List<String>> getDistinctStates() {
        List<String> states = stopService.getDistinctStates();
        return ResponseEntity.ok(states);
    }

    @GetMapping("/filter-options/accessibility-statuses")
    @Operation(
        summary = "Get distinct accessibility statuses", 
        description = "Retrieve all distinct accessibility statuses (true/false) available in the stops database for filter dropdown options.",
        operationId = "getDistinctAccessibilityStatuses"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Distinct accessibility statuses retrieved successfully")
    })
    public ResponseEntity<List<Boolean>> getDistinctAccessibilityStatuses() {
        List<Boolean> accessibilityStatuses = stopService.getDistinctAccessibilityStatuses();
        return ResponseEntity.ok(accessibilityStatuses);
    }

    // 6. UPDATE - Modification operation
    @PutMapping("/{id}")
    @Operation(
        summary = "Update an existing stop", 
        description = "Update an existing bus stop with new details. Requires authentication.",
        operationId = "updateStop"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Stop updated successfully"),
        @ApiResponse(responseCode = "404", description = "Stop not found"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "409", description = "Stop name already exists in the same city"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<StopResponse> updateStop(
            @Parameter(description = "Stop ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id, 
            @Valid @RequestBody StopRequest request, 
            Authentication authentication) {
        String userId = authentication.getName();
        StopResponse response = stopService.updateStop(id, request, userId);
        return ResponseEntity.ok(response);
    }

    // 7. DELETE - Destructive operation (last)
    @DeleteMapping("/{id}")
    @Operation(
        summary = "Delete a stop", 
        description = "Permanently delete a bus stop. This action cannot be undone. Requires authentication.",
        operationId = "deleteStop"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Stop deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Stop not found"),
        @ApiResponse(responseCode = "400", description = "Invalid UUID format"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Void> deleteStop(
            @Parameter(description = "Stop ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id) {
        stopService.deleteStop(id);
        return ResponseEntity.noContent().build();
    }
}