package com.busmate.routeschedule.controller;

import com.busmate.routeschedule.dto.request.StopRequest;
import com.busmate.routeschedule.dto.request.StopExportRequest;
import com.busmate.routeschedule.dto.response.RouteStopDetailResponse;
import com.busmate.routeschedule.dto.response.ScheduleStopDetailResponse;
import com.busmate.routeschedule.dto.response.StopResponse;
import com.busmate.routeschedule.dto.response.StopFilterOptionsResponse;
import com.busmate.routeschedule.dto.response.statistic.StopStatisticsResponse;
import com.busmate.routeschedule.dto.response.importing.StopImportResponse;
import com.busmate.routeschedule.dto.response.exporting.StopExportResponse;

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

    // 5. FILTER OPTIONS - Get all filter options in one call for better UX
    @GetMapping("/filter-options")
    @Operation(
        summary = "Get all filter options for stops", 
        description = "Retrieve all available filter options including states, cities, countries, and accessibility statuses. " +
                     "This consolidated endpoint provides all filter data needed by the UI in a single call, " +
                     "improving performance and user experience. Also includes metadata about the available options.",
        operationId = "getFilterOptions"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Filter options retrieved successfully")
    })
    public ResponseEntity<StopFilterOptionsResponse> getFilterOptions() {
        StopFilterOptionsResponse filterOptions = stopService.getFilterOptions();
        return ResponseEntity.ok(filterOptions);
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
        description = "Dynamically import stops from CSV files with flexible field combinations. " +
                     "The system automatically detects available fields and processes any combination: " +
                     "Required: At least one name field (name, name_sinhala, or name_tamil). " +
                     "Optional: description, coordinates (lat/lng), address fields (all languages), " +
                     "city/state/country (all languages), zipCode, isAccessible. " +
                     "Mixed data supported - different rows can have different field combinations. " +
                     "Requires authentication.",
        operationId = "importStops"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Import completed (check response for detailed results including imported stop IDs)"),
        @ApiResponse(responseCode = "400", description = "Invalid file format or content"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<StopImportResponse> importStops(
            @Parameter(description = "CSV file containing stop data (supports multiple formats)")
            @RequestParam("file") MultipartFile file,
            
            @Parameter(description = "Default country for stops when not specified in CSV", example = "Sri Lanka")
            @RequestParam(defaultValue = "Sri Lanka") String defaultCountry,
            
            Authentication authentication) {
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        String userId = authentication.getName();
        StopImportResponse response = stopService.importStops(file, userId, defaultCountry);
        return ResponseEntity.ok(response);
    }

    // DOWNLOAD CSV TEMPLATE - For import template
    @GetMapping("/import-template")
    @Operation(
        summary = "Download CSV import template", 
        description = "Download flexible CSV template examples showing various field combinations supported. " +
                     "The system dynamically processes any combination of available fields.",
        operationId = "downloadStopImportTemplate"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Template downloaded successfully")
    })
    public ResponseEntity<String> downloadStopImportTemplate(
            @Parameter(description = "Template type: 'minimal' (name only), 'multilingual' (name variants), 'location' (with coordinates), 'full' (all fields)", example = "full")
            @RequestParam(defaultValue = "full") String format) {
        
        String csvTemplate;
        String filename;
        
        switch (format.toLowerCase()) {
            case "minimal":
                csvTemplate = "# Minimal Format - English names only\n" +
                             "name\n" +
                             "Colombo Central\n" +
                             "Kandy Terminal\n" +
                             "Galle Station\n";
                filename = "minimal_stop_template.csv";
                break;
                
            case "multilingual":
                csvTemplate = "# Multilingual Format - Names in multiple languages\n" +
                             "name,name_sinhala,name_tamil\n" +
                             "Colombo Central,කොළඹ මධ්‍යම,கொழும்பு மத்திய\n" +
                             "Kandy Terminal,මහනුවර පර්යන්තය,கண்டி முனையம்\n" +
                             "Galle Station,ගාල්ල ස්ථානය,காலி நிலையம்\n";
                filename = "multilingual_stop_template.csv";
                break;
                
            case "location":
                csvTemplate = "# Location Format - Names with coordinates\n" +
                             "name,latitude,longitude,city,state,country\n" +
                             "Colombo Central,6.9344,79.8428,Colombo,Western Province,Sri Lanka\n" +
                             "Kandy Terminal,7.2906,80.6337,Kandy,Central Province,Sri Lanka\n" +
                             "Galle Station,6.0535,80.2210,Galle,Southern Province,Sri Lanka\n";
                filename = "location_stop_template.csv";
                break;
                
            default: // full
                csvTemplate = "# Full Format - All available fields\n" +
                             "name,name_sinhala,description,latitude,longitude,address,city,state,zipCode,country,isAccessible\n" +
                             "Colombo Central,කොළඹ මධ්‍යම,Main intercity terminal,6.9344,79.8428,Olcott Mawatha,Colombo,Western Province,00100,Sri Lanka,true\n" +
                             "Kandy Terminal,මහනුවර පර්යන්තය,Hill capital hub,7.2906,80.6337,Temple Street,Kandy,Central Province,20000,Sri Lanka,true\n" +
                             "Galle Station,ගාල්ල ස්ථානය,Southern coastal terminal,6.0535,80.2210,Main Street,Galle,Southern Province,80000,Sri Lanka,false\n\n" +
                             "# Supported Fields (all optional except name):\n" +
                             "# Names: name, name_sinhala, name_tamil\n" +
                             "# Location: latitude, longitude, address, address_sinhala, address_tamil\n" +
                             "# Administrative: city, city_sinhala, city_tamil, state, state_sinhala, state_tamil\n" +
                             "# Other: zipCode, country, country_sinhala, country_tamil, description, isAccessible\n" +
                             "# Legacy: stop_id (preserved as original_stop_id)\n";
                filename = "full_stop_template.csv";
                break;
        }
        
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv")
                .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                .body(csvTemplate);
    }

    // EXPORT - Flexible stop data export
    @PostMapping("/export")
    @Operation(
        summary = "Export stops with flexible filtering and format options", 
        description = "Export stops to CSV or JSON format with highly flexible filtering options. " +
                     "Supports exporting all stops, filtering by city/state/country, specific IDs, accessibility, " +
                     "and custom field selection. Perfect for bulk operations like route imports where you need " +
                     "stop IDs to replace in external datasets. The exported file includes comprehensive metadata " +
                     "about applied filters and export options for audit purposes.",
        operationId = "exportStops"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Export completed successfully - returns file content with metadata"),
        @ApiResponse(responseCode = "400", description = "Invalid export request parameters"),
        @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
        @ApiResponse(responseCode = "500", description = "Internal server error during export processing")
    })
    public ResponseEntity<byte[]> exportStops(
            @Valid @RequestBody StopExportRequest request,
            Authentication authentication) {
        
        String userId = authentication != null ? authentication.getName() : "system";
        StopExportResponse exportResponse = stopService.exportStops(request, userId);
        
        return ResponseEntity.ok()
                .header("Content-Type", exportResponse.getContentType())
                .header("Content-Disposition", "attachment; filename=\"" + exportResponse.getFileName() + "\"")
                .header("X-Export-Metadata", 
                       String.format("Records: %d, Format: %s, Exported-By: %s", 
                                   exportResponse.getMetadata().getRecordsExported(),
                                   exportResponse.getMetadata().getFormat(),
                                   exportResponse.getMetadata().getExportedBy()))
                .body(exportResponse.getContent());
    }


}