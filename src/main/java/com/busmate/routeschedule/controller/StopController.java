package com.busmate.routeschedule.controller;

import com.busmate.routeschedule.dto.request.StopRequest;
import com.busmate.routeschedule.dto.response.RouteStopDetailResponse;
import com.busmate.routeschedule.dto.response.ScheduleStopDetailResponse;
import com.busmate.routeschedule.dto.response.StopResponse;
import com.busmate.routeschedule.dto.response.statistic.StopStatisticsResponse;
import com.busmate.routeschedule.dto.response.importing.StopImportResponse;
import com.busmate.routeschedule.dto.response.importing.SimpleStopImportResponse;
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
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/stops")
@RequiredArgsConstructor
@Tag(name = "01. Bus Stop Management", description = "APIs for managing bus stops")
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

    // NEW ENDPOINTS for route and schedule stop details
    @GetMapping("/route/{routeId}")
    @Operation(
        summary = "Get stops along a route", 
        description = "Retrieve all stops in correct order for a specific route with details including distances.",
        operationId = "getStopsByRoute"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Route stops retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Route not found"),
        @ApiResponse(responseCode = "400", description = "Invalid route ID format")
    })
    public ResponseEntity<List<RouteStopDetailResponse>> getStopsByRoute(
            @Parameter(description = "Route ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID routeId) {
        List<RouteStopDetailResponse> responses = stopService.getStopsByRoute(routeId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/schedule/{scheduleId}")
    @Operation(
        summary = "Get stops with schedule timings", 
        description = "Retrieve all stops in correct order for a specific schedule with arrival/departure times and details.",
        operationId = "getStopsWithScheduleBySchedule"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Schedule stops retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Schedule not found"),
        @ApiResponse(responseCode = "400", description = "Invalid schedule ID format")
    })
    public ResponseEntity<List<ScheduleStopDetailResponse>> getStopsWithScheduleBySchedule(
            @Parameter(description = "Schedule ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID scheduleId) {
        List<ScheduleStopDetailResponse> responses = stopService.getStopsWithScheduleBySchedule(scheduleId);
        return ResponseEntity.ok(responses);
    }

    // ========== STATISTICS APIs ==========

    // STOP STATISTICS - For KPI dashboard cards
    @GetMapping("/statistics")
    @Operation(
        summary = "Get stop statistics", 
        description = "Retrieve comprehensive stop statistics for dashboard KPI cards including counts, distributions, accessibility metrics, and geographical information.",
        operationId = "getStopStatistics"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Statistics retrieved successfully")
    })
    public ResponseEntity<StopStatisticsResponse> getStopStatistics() {
        StopStatisticsResponse response = stopService.getStatistics();
        return ResponseEntity.ok(response);
    }

    // ========== IMPORT APIs ==========

    // STOP IMPORT - For bulk stop import from file
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
        summary = "Import stops from CSV file", 
        description = "Bulk import stops from a CSV file. Expected CSV format: name,description,latitude,longitude,address,city,state,zipCode,country,isAccessible (header row required). " +
                     "Latitude and longitude are required. isAccessible should be true or false. Requires authentication.",
        operationId = "importStops"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Import completed (check response for detailed results)"),
        @ApiResponse(responseCode = "400", description = "Invalid file format or content"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<StopImportResponse> importStops(
            @Parameter(description = "CSV file containing stop data")
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        String userId = authentication.getName();
        StopImportResponse response = stopService.importStops(file, userId);
        return ResponseEntity.ok(response);
    }

    // DOWNLOAD CSV TEMPLATE - For import template
    @GetMapping("/import-template")
    @Operation(
        summary = "Download CSV import template", 
        description = "Download a CSV template file with sample data and correct format for stop import.",
        operationId = "downloadStopImportTemplate"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Template downloaded successfully")
    })
    public ResponseEntity<String> downloadStopImportTemplate() {
        String csvTemplate = "name,description,latitude,longitude,address,city,state,zipCode,country,isAccessible\n" +
                           "Colombo Central Bus Station,Main bus terminal in Colombo,6.9344,79.8428,Olcott Mawatha,Colombo,Western Province,00100,Sri Lanka,true\n" +
                           "Kandy Bus Terminal,Main bus terminal in Kandy,7.2906,80.6337,Temple Street,Kandy,Central Province,20000,Sri Lanka,true\n" +
                           "Galle Bus Station,Main bus station in Galle,6.0535,80.2210,Main Street,Galle,Southern Province,80000,Sri Lanka,false\n";
        
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv")
                .header("Content-Disposition", "attachment; filename=\"stop_import_template.csv\"")
                .body(csvTemplate);
    }

    // SIMPLE STOP IMPORT - For minimal CSV with just stop_id and stop_name
    @PostMapping(value = "/import-simple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
        summary = "Import stops from simple CSV file", 
        description = "Bulk import stops from a simple CSV file with minimal data. Expected CSV format: stop_id,stop_name (header row required). " +
                     "Only stop name is required. Default values will be used for missing location data. " +
                     "Returns list of imported stops with their UUIDs for further use. Requires authentication.",
        operationId = "importSimpleStops"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Import completed (check response for detailed results and imported stop UUIDs)"),
        @ApiResponse(responseCode = "400", description = "Invalid file format or content"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<SimpleStopImportResponse> importSimpleStops(
            @Parameter(description = "CSV file containing simple stop data (stop_id,stop_name format)")
            @RequestParam("file") MultipartFile file,
            
            @Parameter(description = "Default country for all imported stops", example = "Sri Lanka")
            @RequestParam(defaultValue = "Sri Lanka") String defaultCountry,
            
            Authentication authentication) {
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        String userId = authentication.getName();
        SimpleStopImportResponse response = stopService.importSimpleStops(file, userId, defaultCountry);
        return ResponseEntity.ok(response);
    }

    // DOWNLOAD SIMPLE CSV TEMPLATE - For simple import template
    @GetMapping("/import-simple-template")
    @Operation(
        summary = "Download simple CSV import template", 
        description = "Download a simple CSV template file with sample data and correct format for simple stop import (stop_id,stop_name).",
        operationId = "downloadSimpleStopImportTemplate"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Simple template downloaded successfully")
    })
    public ResponseEntity<String> downloadSimpleStopImportTemplate() {
        String csvTemplate = "stop_id,stop_name\n" +
                           "1,කොළඹ\n" +
                           "2,මාලිගාවත්ත\n" +
                           "3,කැළණිතිස්ස\n" +
                           "4,කිරිබත්ගොඩ\n";
        
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv")
                .header("Content-Disposition", "attachment; filename=\"simple_stop_import_template.csv\"")
                .body(csvTemplate);
    }
}