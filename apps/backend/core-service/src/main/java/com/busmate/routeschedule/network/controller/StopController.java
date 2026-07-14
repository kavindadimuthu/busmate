package com.busmate.routeschedule.network.controller;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.busmate.routeschedule.network.dto.request.StopBatchCreateRequest;
import com.busmate.routeschedule.network.dto.request.StopBulkUpdateRequest;
import com.busmate.routeschedule.network.dto.request.StopExportRequest;
import com.busmate.routeschedule.network.dto.request.StopRequest;
import com.busmate.routeschedule.network.dto.response.RouteGroupStopDetailResponse;
import com.busmate.routeschedule.network.dto.response.RouteStopDetailResponse;
import com.busmate.routeschedule.network.dto.response.StopBatchCreateResponse;
import com.busmate.routeschedule.network.dto.response.StopBulkUpdateResponse;
import com.busmate.routeschedule.network.dto.response.StopExistsResponse;
import com.busmate.routeschedule.network.dto.response.StopExportResponse;
import com.busmate.routeschedule.network.dto.response.StopFilterOptionsResponse;
import com.busmate.routeschedule.network.dto.response.StopImportResponse;
import com.busmate.routeschedule.network.dto.response.StopResponse;
import com.busmate.routeschedule.network.dto.response.StopStatisticsResponse;
import com.busmate.routeschedule.network.service.StopImportExportService;
import com.busmate.routeschedule.network.service.StopService;
import com.busmate.routeschedule.scheduling.dto.response.ScheduleStopDetailResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/stops")
@RequiredArgsConstructor
@Tag(name = "01. Bus Stop Management", description = "APIs for managing bus stops")
public class StopController {

    /** Allowed field names for the {@code sortBy} query parameter. */
    private static final Set<String> VALID_STOP_SORT_FIELDS = Set.of(
            "name", "nameSinhala", "nameTamil",
            "location.city", "location.state",
            "isAccessible", "createdAt", "updatedAt");

    private final StopService stopService;
    private final StopImportExportService stopImportExportService;

    // 1. CREATE - First operation for logical flow
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @Operation(
        summary = "Create a new bus stop", 
        description = "Creates a new bus stop with the provided details. Requires authentication.",
        operationId = "createStop"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Stop created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "409", description = "Stop already exists in the same city"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - requires MOT role")
    })
    public ResponseEntity<StopResponse> createStop(
            @Valid @RequestBody StopRequest request, 
            Authentication authentication) {
        String userId = authentication.getName();
        StopResponse response = stopService.createStop(request, userId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // 1b. BATCH CREATE - Create multiple stops in a single request
    @PostMapping("/batch")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @Operation(
        summary = "Create multiple bus stops in batch",
        description = "Creates multiple bus stops in a single request. Each stop is validated individually. " +
                     "Stops that already exist or fail validation will be reported in the response without blocking other stops. " +
                     "Requires authentication.",
        operationId = "createStopsBatch"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Batch creation completed (check response for individual results)"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - requires MOT role")
    })
    public ResponseEntity<StopBatchCreateResponse> createStopsBatch(
            @Valid @RequestBody StopBatchCreateRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        StopBatchCreateResponse response = stopService.createStopsBatch(request, userId);
        return ResponseEntity.ok(response);
    }

    // 2. READ ALL - Most commonly used operation
    @GetMapping
    @Operation(
        summary = "Get all stops with pagination, sorting, search and server-side filtering", 
        description = "Retrieve all stops with optional pagination, sorting, multi-column search, and server-side filtering. " +
                     "Search is performed across name, address, city, and state columns. " +
                     "Filters (state, city, isAccessible) narrow results server-side, eliminating the need for client-side filtering. " +
                     "Default: page=0, size=10, sort=name",
        operationId = "getAllStops"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Stops retrieved successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid pagination, sorting, or filtering parameters")
    })
    public ResponseEntity<Page<StopResponse>> getAllStops(
            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Page size (max 100)", example = "10")
            @RequestParam(defaultValue = "10") int size,
            
            @Parameter(description = "Sort by field (name, nameSinhala, nameTamil, location.city, location.state, isAccessible, createdAt, updatedAt)", example = "name")
            @RequestParam(defaultValue = "name") String sortBy,
            
            @Parameter(description = "Sort direction (asc or desc)", example = "asc")
            @RequestParam(defaultValue = "asc") String sortDir,
            
            @Parameter(description = "Search text to filter stops by name, address, city, or state", example = "Central")
            @RequestParam(required = false) String search,

            @Parameter(description = "Filter by state/province (exact match)", example = "Western Province")
            @RequestParam(required = false) String state,

            @Parameter(description = "Filter by city (exact match)", example = "Colombo")
            @RequestParam(required = false) String city,

            @Parameter(description = "Filter by accessibility status", example = "true")
            @RequestParam(required = false) Boolean isAccessible) {
        
        // Validate page size
        if (size > 100) {
            size = 100; // Maximum page size limit
        }

        // Validate sort field
        if (!VALID_STOP_SORT_FIELDS.contains(sortBy)) {
            return ResponseEntity.badRequest().build();
        }
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                   Sort.by(sortBy).descending() : 
                   Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Use the unified filtered query which handles all combinations
        Page<StopResponse> responses = stopService.getAllStopsFiltered(search, state, city, isAccessible, pageable);
        
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

    // 4. CHECK STOP EXISTS - Check if a stop exists by ID or name
    @GetMapping("/exists")
    @Operation(
        summary = "Check if a stop exists by ID or name", 
        description = "Check if a bus stop exists in the system by providing either an ID or a name. " +
                     "If the stop is found, its full data is returned. " +
                     "Priority: ID takes precedence over name if both are provided. " +
                     "Name search matches against English, Sinhala, and Tamil name variants (case-insensitive). " +
                     "Note: In a future implementation, this will support checking by both name and city for more precise matching.",
        operationId = "checkStopExists"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Check completed - exists field indicates if stop was found"),
        @ApiResponse(responseCode = "400", description = "Neither ID nor name provided")
    })
    public ResponseEntity<StopExistsResponse> checkStopExists(
            @Parameter(description = "Stop ID (UUID format)", example = "123e4567-e89b-12d3-a456-426614174000")
            @RequestParam(required = false) String id,
            
            @Parameter(description = "Stop name (English, Sinhala, or Tamil)", example = "Colombo Fort")
            @RequestParam(required = false) String name) {
        
        // Validate that at least one parameter is provided
        if ((id == null || id.trim().isEmpty()) && (name == null || name.trim().isEmpty())) {
            return ResponseEntity.badRequest().body(
                    StopExistsResponse.notFound("none", "Either 'id' or 'name' parameter is required")
            );
        }
        
        StopExistsResponse response = stopService.checkStopExists(id, name);
        return ResponseEntity.ok(response);
    }

    // 5. READ BY ID - Specific read operation
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

    // 6. FILTER OPTIONS - Get all filter options in one call for better UX
    @GetMapping("/filters/options")
    @Operation(
        summary = "Get all filter options for stops", 
        description = "Retrieve all available filter options including states, cities, countries, and accessibility statuses. " +
                     "This consolidated endpoint provides all filter data needed by the UI in a single call, " +
                     "improving performance and user experience. Also includes metadata about the available options.",
        operationId = "getStopFilterOptions"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Filter options retrieved successfully")
    })
    public ResponseEntity<StopFilterOptionsResponse> getFilterOptions() {
        StopFilterOptionsResponse filterOptions = stopService.getFilterOptions();
        return ResponseEntity.ok(filterOptions);
    }

    // 7. UPDATE - Modification operation
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
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
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - requires MOT role")
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

    // 8. DELETE - Destructive operation (last)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @Operation(
        summary = "Delete a stop", 
        description = "Permanently delete a bus stop. This action cannot be undone. Requires authentication.",
        operationId = "deleteStop"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Stop deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Stop not found"),
        @ApiResponse(responseCode = "400", description = "Invalid UUID format"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - requires MOT role")
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

    @GetMapping("/route-group/{routeGroupId}")
    @Operation(
        summary = "Get stops for all routes in a route group", 
        description = "Retrieve all stops for all routes within a specific route group, ordered by route name and stop order. " +
                     "Each stop includes both stop details and route information to distinguish stops across different routes.",
        operationId = "getStopsByRouteGroup"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Route group stops retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Route group not found"),
        @ApiResponse(responseCode = "400", description = "Invalid route group ID format")
    })
    public ResponseEntity<List<RouteGroupStopDetailResponse>> getStopsByRouteGroup(
            @Parameter(description = "Route Group ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID routeGroupId) {
        List<RouteGroupStopDetailResponse> responses = stopService.getStopsByRouteGroup(routeGroupId);
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
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
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
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - requires MOT role")
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
        
        String userId = authentication != null ? authentication.getName() : "system";
        StopImportResponse response = stopImportExportService.importStops(file, userId, defaultCountry);
        return ResponseEntity.ok(response);
    }

    // DOWNLOAD CSV TEMPLATE - For import template
    @GetMapping("/import/template")
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
        
        String csvTemplate = generateTemplate(format);
        String filename = format.toLowerCase() + "_stop_template.csv";
        
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv")
                .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                .body(csvTemplate);
    }

    // EXPORT - Flexible stop data export
    @PostMapping("/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
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
        @ApiResponse(responseCode = "403", description = "Forbidden - requires MOT role"),
        @ApiResponse(responseCode = "500", description = "Internal server error during export processing")
    })
    public ResponseEntity<byte[]> exportStops(
            @Parameter(description = "Export all stops (ignores other filters if true)", example = "false")
            @RequestParam(defaultValue = "false") Boolean exportAll,
            
            @Parameter(description = "Specific stop IDs to export (comma-separated)")
            @RequestParam(required = false) List<UUID> stopIds,
            
            @Parameter(description = "Filter by cities (comma-separated)")
            @RequestParam(required = false) List<String> cities,
            
            @Parameter(description = "Filter by states (comma-separated)")
            @RequestParam(required = false) List<String> states,
            
            @Parameter(description = "Filter by countries (comma-separated)")
            @RequestParam(required = false) List<String> countries,
            
            @Parameter(description = "Filter by accessibility status")
            @RequestParam(required = false) Boolean isAccessible,
            
            @Parameter(description = "Search text to filter stops by name, address, city, or state in all languages")
            @RequestParam(required = false) String searchText,
            
            @Parameter(description = "Export format", example = "CSV")
            @RequestParam(defaultValue = "CSV") StopExportRequest.ExportFormat format,
            
            @Parameter(description = "Include multi-language fields (name_sinhala, name_tamil, etc.)", example = "true")
            @RequestParam(defaultValue = "true") Boolean includeMultiLanguageFields,
            
            @Parameter(description = "Include detailed location information (address, coordinates, etc.)", example = "true")
            @RequestParam(defaultValue = "true") Boolean includeLocationDetails,
            
            @Parameter(description = "Include timestamp information (createdAt, updatedAt)", example = "false")
            @RequestParam(defaultValue = "false") Boolean includeTimestamps,
            
            @Parameter(description = "Include user information (createdBy, updatedBy)", example = "false")
            @RequestParam(defaultValue = "false") Boolean includeUserInfo,
            
            @Parameter(description = "Custom field selection (comma-separated, if specified only these fields will be exported)")
            @RequestParam(required = false) List<String> customFields,
            
            Authentication authentication) {
        
        // Build request object
        StopExportRequest request = new StopExportRequest();
        request.setExportAll(exportAll);
        request.setStopIds(stopIds);
        request.setCities(cities);
        request.setStates(states);
        request.setCountries(countries);
        request.setIsAccessible(isAccessible);
        request.setSearchText(searchText);
        request.setFormat(format);
        request.setIncludeMultiLanguageFields(includeMultiLanguageFields);
        request.setIncludeLocationDetails(includeLocationDetails);
        request.setIncludeTimestamps(includeTimestamps);
        request.setIncludeUserInfo(includeUserInfo);
        request.setCustomFields(customFields);
        
        String userId = authentication != null ? authentication.getName() : "system";
        StopExportResponse exportResponse = stopImportExportService.exportStops(request, userId);
        
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

    // 11. BULK UPDATE - Update or create multiple stops via CSV file
    @PutMapping(value = "/import/upsert", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @Operation(
        summary = "Bulk update stops from CSV file", 
        description = "Update multiple bus stops at once using a CSV file. " +
                     "Supports flexible matching strategies (ID, name+city, or auto), " +
                     "partial updates, conflict resolution, and creation of missing stops. " +
                     "The CSV should contain the same fields as the export format. " +
                     "Returns detailed results including success/failure counts and specific error information.",
        operationId = "bulkUpdateStops"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Bulk update completed (check response for individual results)"),
        @ApiResponse(responseCode = "400", description = "Invalid file format or request parameters"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "413", description = "File too large"),
        @ApiResponse(responseCode = "415", description = "Unsupported file type"),
        @ApiResponse(responseCode = "403", description = "Forbidden - requires MOT role")
    })
    public ResponseEntity<StopBulkUpdateResponse> bulkUpdateStops(
            @Parameter(description = "CSV file containing stops to update", required = true)
            @RequestParam("file") MultipartFile csvFile,
            
            @Parameter(description = "Update strategy for handling conflicts", example = "UPDATE_ALL")
            @RequestParam(defaultValue = "UPDATE_ALL") StopBulkUpdateRequest.UpdateStrategy updateStrategy,
            
            @Parameter(description = "Strategy for matching existing stops", example = "AUTO")
            @RequestParam(defaultValue = "AUTO") StopBulkUpdateRequest.MatchingStrategy matchingStrategy,
            
            @Parameter(description = "Whether to create new stops if they don't exist", example = "false")
            @RequestParam(defaultValue = "false") Boolean createMissing,
            
            @Parameter(description = "Whether to perform partial updates (only non-empty CSV fields)", example = "false")
            @RequestParam(defaultValue = "false") Boolean partialUpdate,
            
            @Parameter(description = "Default country to use if not specified in CSV", example = "Sri Lanka")
            @RequestParam(required = false) String defaultCountry,
            
            @Parameter(description = "Whether to validate geographical coordinates", example = "true")
            @RequestParam(defaultValue = "true") Boolean validateCoordinates,
            
            Authentication authentication) {
        
        // Validate file
        if (csvFile.isEmpty()) {
            throw new IllegalArgumentException("CSV file is required and cannot be empty");
        }
        
        if (!"text/csv".equals(csvFile.getContentType()) && 
            !csvFile.getOriginalFilename().toLowerCase().endsWith(".csv")) {
            throw new IllegalArgumentException("File must be a CSV file");
        }
        
        // Build request object
        StopBulkUpdateRequest request = new StopBulkUpdateRequest();
        request.setUpdateStrategy(updateStrategy);
        request.setMatchingStrategy(matchingStrategy);
        request.setCreateMissing(createMissing);
        request.setPartialUpdate(partialUpdate);
        request.setDefaultCountry(defaultCountry);
        request.setValidateCoordinates(validateCoordinates);
        
        String userId = authentication != null ? authentication.getName() : "system";
        // Process bulk update
        StopBulkUpdateResponse response = stopImportExportService.bulkUpdateStops(csvFile, request, userId);
        
        return ResponseEntity.ok(response);
    }

    // === Helper Methods ===
    private String generateTemplate(String format) {
        return switch (format.toLowerCase()) {
            case "minimal" -> "name\nColombo Central\nKandy Terminal\nGalle Station\n";
            case "multilingual" -> "name,name_sinhala,name_tamil\nColombo Central,කොළඹ මධ්‍යම,கொழும்பு மத்திய\n";
            case "location" -> "name,latitude,longitude,city,state,country\nColombo Central,6.9344,79.8428,Colombo,Western Province,Sri Lanka\n";
            default -> "name,name_sinhala,description,latitude,longitude,address,city,state,zipCode,country,isAccessible\n" +
                      "Colombo Central,කොළඹ මධ්‍යම,Main intercity terminal,6.9344,79.8428,Olcott Mawatha,Colombo,Western Province,00100,Sri Lanka,true\n";
        };
    }
}
