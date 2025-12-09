package com.busmate.routeschedule.controller;

import com.busmate.routeschedule.dto.request.BusRequest;
import com.busmate.routeschedule.dto.response.BusResponse;
import com.busmate.routeschedule.dto.response.filter.BusFilterOptionsResponse;
import com.busmate.routeschedule.dto.response.statistic.BusStatisticsResponse;
import com.busmate.routeschedule.dto.response.importing.BusImportResponse;
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
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
                     "Search is performed across NTC registration number, plate number, model, and operator name (case-insensitive). " +
                     "Default: page=0, size=10, sort=ntcRegistrationNumber,asc. Maximum page size is 100.",
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
            
            @Parameter(description = "Sort by field name (ntcRegistrationNumber, plateNumber, capacity, model, status, createdAt, updatedAt)", example = "ntcRegistrationNumber")
            @RequestParam(defaultValue = "ntcRegistrationNumber") String sortBy,
            
            @Parameter(description = "Sort direction (asc or desc)", example = "asc")
            @RequestParam(defaultValue = "asc") String sortDir,
            
            @Parameter(description = "Search text to filter buses by NTC registration number, plate number, model, or operator name (case-insensitive)", example = "NA-1234")
            @RequestParam(required = false) String search,
            
            @Parameter(description = "Filter by operator ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @RequestParam(required = false) UUID operatorId,
            
            @Parameter(description = "Filter by status (pending, active, inactive, cancelled) - case insensitive", example = "active")
            @RequestParam(required = false) String status,
            
            @Parameter(description = "Filter by minimum capacity", example = "30")
            @RequestParam(required = false) Integer minCapacity,
            
            @Parameter(description = "Filter by maximum capacity", example = "60")
            @RequestParam(required = false) Integer maxCapacity) {
        
        // Validate and normalize parameters
        if (page < 0) page = 0;
        if (size <= 0) size = 10;
        if (size > 100) size = 100;
        
        // Validate sortBy field
        List<String> allowedSortFields = List.of("ntcRegistrationNumber", "plateNumber", "capacity", 
                "model", "status", "createdAt", "updatedAt");
        if (!allowedSortFields.contains(sortBy)) {
            return ResponseEntity.badRequest().build();
        }
        
        // Map camelCase property names to snake_case column names for native query sorting
        String sortColumn = switch (sortBy) {
            case "ntcRegistrationNumber" -> "ntc_registration_number";
            case "plateNumber" -> "plate_number";
            case "createdAt" -> "created_at";
            case "updatedAt" -> "updated_at";
            default -> sortBy; // capacity, model, status are already correct
        };
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                   Sort.by(sortColumn).descending() : 
                   Sort.by(sortColumn).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Parse and validate enum values
        StatusEnum statusEnum = null;
        
        if (status != null && !status.trim().isEmpty()) {
            try {
                statusEnum = StatusEnum.valueOf(status.toLowerCase().trim());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        }
        
        // Validate capacity range
        if (minCapacity != null && minCapacity < 0) {
            return ResponseEntity.badRequest().build();
        }
        if (maxCapacity != null && maxCapacity < 0) {
            return ResponseEntity.badRequest().build();
        }
        if (minCapacity != null && maxCapacity != null && minCapacity > maxCapacity) {
            return ResponseEntity.badRequest().build();
        }
        
        // Normalize search text
        String searchText = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        
        // Execute query
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

    // ========== ENHANCED MANAGEMENT APIs ==========

    // 7. FILTER OPTIONS - For frontend dropdown/filter components
    @GetMapping("/filter-options")
    @Operation(
        summary = "Get available filter options", 
        description = "Retrieve all available filter options for bus management frontend including operators, models, statuses, capacity ranges, and sort options.",
        operationId = "getBusFilterOptions"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Filter options retrieved successfully")
    })
    public ResponseEntity<BusFilterOptionsResponse> getBusFilterOptions() {
        BusFilterOptionsResponse response = busService.getFilterOptions();
        return ResponseEntity.ok(response);
    }

    // 8. STATISTICS - For KPI dashboard cards
    @GetMapping("/statistics")
    @Operation(
        summary = "Get bus statistics", 
        description = "Retrieve comprehensive bus statistics for dashboard KPI cards including counts, distributions, capacity metrics, and calculated statistics.",
        operationId = "getBusStatistics"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Statistics retrieved successfully")
    })
    public ResponseEntity<BusStatisticsResponse> getBusStatistics() {
        BusStatisticsResponse response = busService.getStatistics();
        return ResponseEntity.ok(response);
    }

    // 9. IMPORT - For bulk bus import from file
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
        summary = "Import buses from CSV file", 
        description = "Bulk import buses from a CSV file. Expected CSV format: operatorName,ntcRegistrationNumber,plateNumber,capacity,model,facilities,status (header row required). " +
                     "OperatorName must match an existing operator. Status should be active, inactive, pending, or cancelled. Facilities should be valid JSON or simple text. Requires authentication.",
        operationId = "importBuses"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Import completed (check response for detailed results)"),
        @ApiResponse(responseCode = "400", description = "Invalid file format or content"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<BusImportResponse> importBuses(
            @Parameter(description = "CSV file containing bus data")
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        String userId = authentication.getName();
        BusImportResponse response = busService.importBuses(file, userId);
        return ResponseEntity.ok(response);
    }

    // 10. DOWNLOAD CSV TEMPLATE - For import template
    @GetMapping("/import-template")
    @Operation(
        summary = "Download CSV import template", 
        description = "Download a CSV template file with sample data and correct format for bus import.",
        operationId = "downloadBusImportTemplate"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Template downloaded successfully")
    })
    public ResponseEntity<String> downloadBusImportTemplate() {
        String csvTemplate = "operatorName,ntcRegistrationNumber,plateNumber,capacity,model,facilities,status\n" +
                           "Swarnayya Transport Company,NA-1234,ABC-1234,45,Toyota Coaster,\"{\"\"airCondition\"\": true, \"\"wifi\"\": false}\",active\n" +
                           "Royal Express Transport,NB-5678,XYZ-5678,52,Ashok Leyland,\"{\"\"airCondition\"\": false, \"\"wifi\"\": true}\",active\n" +
                           "Sri Lanka Transport Board - Western Province,NC-9012,LMN-9012,35,TATA,Air conditioning available,inactive\n";
        
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv")
                .header("Content-Disposition", "attachment; filename=\"bus_import_template.csv\"")
                .body(csvTemplate);
    }
}
