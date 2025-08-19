package com.busmate.routeschedule.controller;

import com.busmate.routeschedule.dto.request.BusRequest;
import com.busmate.routeschedule.dto.response.BusResponse;
import com.busmate.routeschedule.enums.StatusEnum;
import com.busmate.routeschedule.service.BusService;
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
@RequestMapping("/api/buses")
@RequiredArgsConstructor
@Tag(name = "05. Bus Management", description = "APIs for managing bus details")
public class BusController {
    private final BusService busService;

    // 1. CREATE - First operation for logical flow
    @PostMapping
    @Operation(
        summary = "Create a new bus", 
        description = "Creates a new bus with the provided details. Requires authentication.",
        operationId = "createBus"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Bus created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "409", description = "Bus with same NTC registration number or plate number already exists"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<BusResponse> createBus(
            @Valid @RequestBody BusRequest request, 
            Authentication authentication) {
        String userId = authentication.getName();
        BusResponse response = busService.createBus(request, userId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // 2. READ ALL - Most commonly used operation with filters
    @GetMapping
    @Operation(
        summary = "Get all buses with pagination, sorting, and filtering", 
        description = "Retrieve all buses with optional pagination, sorting, search, and filtering by operator, status, and capacity range. " +
                     "Search is performed across NTC registration number, plate number, model, and operator name. " +
                     "Default: page=0, size=10, sort=ntc_registration_number",
        operationId = "getAllBuses"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Buses retrieved successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid pagination, sorting, or filter parameters")
    })
    public ResponseEntity<Page<BusResponse>> getAllBuses(
            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Page size (max 100)", example = "10")
            @RequestParam(defaultValue = "10") int size,
            
            @Parameter(description = "Sort by field name (ntc_registration_number, plate_number, capacity, model, status, created_at, updated_at)", example = "ntc_registration_number")
            @RequestParam(defaultValue = "ntc_registration_number") String sortBy,
            
            @Parameter(description = "Sort direction (asc or desc)", example = "asc")
            @RequestParam(defaultValue = "asc") String sortDir,
            
            @Parameter(description = "Search text to filter buses by NTC registration number, plate number, model, or operator name", example = "NA-1234")
            @RequestParam(required = false) String search,
            
            @Parameter(description = "Filter by operator ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @RequestParam(required = false) UUID operatorId,
            
            @Parameter(description = "Filter by status (pending, active, inactive, cancelled)", example = "active")
            @RequestParam(required = false) String status,
            
            @Parameter(description = "Filter by minimum capacity", example = "30")
            @RequestParam(required = false) Integer minCapacity,
            
            @Parameter(description = "Filter by maximum capacity", example = "60")
            @RequestParam(required = false) Integer maxCapacity) {
        
        // Validate page size
        if (size > 100) {
            size = 100; // Maximum page size limit
        }
        
        // Use database column names directly - no mapping needed
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                   Sort.by(sortBy).descending() : 
                   Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Parse enum values with validation
        StatusEnum statusEnum = null;
        
        if (status != null && !status.trim().isEmpty()) {
            try {
                statusEnum = StatusEnum.valueOf(status.toLowerCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        }
        
        // Validate capacity range
        if (minCapacity != null && maxCapacity != null && minCapacity > maxCapacity) {
            return ResponseEntity.badRequest().build();
        }
        if (minCapacity != null && minCapacity < 0) {
            return ResponseEntity.badRequest().build();
        }
        if (maxCapacity != null && maxCapacity < 0) {
            return ResponseEntity.badRequest().build();
        }
        
        // Always use the filtered method to ensure consistent behavior
        String searchText = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        Page<BusResponse> responses = busService.getAllBusesWithFilters(searchText, operatorId, statusEnum, 
                                                                       minCapacity, maxCapacity, pageable);
        
        return ResponseEntity.ok(responses);
    }

    // 3. READ ALL WITHOUT PAGINATION - Alternative read operation
    @GetMapping("/all")
    @Operation(
        summary = "Get all buses without pagination", 
        description = "Retrieve all buses as a simple list without pagination. " +
                     "Use this endpoint carefully as it returns all buses at once.",
        operationId = "getAllBusesAsList"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "All buses retrieved successfully")
    })
    public ResponseEntity<List<BusResponse>> getAllBusesAsList() {
        List<BusResponse> responses = busService.getAllBuses();
        return ResponseEntity.ok(responses);
    }

    // 4. READ BY ID - Specific read operation
    @GetMapping("/{id}")
    @Operation(
        summary = "Get bus by ID", 
        description = "Retrieve a specific bus by its unique identifier.",
        operationId = "getBusById"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Bus found and retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Bus not found"),
        @ApiResponse(responseCode = "400", description = "Invalid UUID format")
    })
    public ResponseEntity<BusResponse> getBusById(
            @Parameter(description = "Bus ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id) {
        BusResponse response = busService.getBusById(id);
        return ResponseEntity.ok(response);
    }

    // 5. UPDATE - Modification operation
    @PutMapping("/{id}")
    @Operation(
        summary = "Update an existing bus", 
        description = "Update an existing bus with new details. Requires authentication.",
        operationId = "updateBus"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Bus updated successfully"),
        @ApiResponse(responseCode = "404", description = "Bus not found"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "409", description = "Bus NTC registration number or plate number already exists"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<BusResponse> updateBus(
            @Parameter(description = "Bus ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id, 
            @Valid @RequestBody BusRequest request, 
            Authentication authentication) {
        String userId = authentication.getName();
        BusResponse response = busService.updateBus(id, request, userId);
        return ResponseEntity.ok(response);
    }

    // 6. DELETE - Destructive operation (last)
    @DeleteMapping("/{id}")
    @Operation(
        summary = "Delete a bus", 
        description = "Permanently delete a bus. This action cannot be undone. Requires authentication.",
        operationId = "deleteBus"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Bus deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Bus not found"),
        @ApiResponse(responseCode = "400", description = "Invalid UUID format"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Void> deleteBus(
            @Parameter(description = "Bus ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id) {
        busService.deleteBus(id);
        return ResponseEntity.noContent().build();
    }
}
