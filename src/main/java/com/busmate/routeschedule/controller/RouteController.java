package com.busmate.routeschedule.controller;

import com.busmate.routeschedule.dto.request.RouteGroupRequest;
import com.busmate.routeschedule.dto.request.RouteUnifiedImportRequest;
import com.busmate.routeschedule.dto.response.RouteGroupResponse;
import com.busmate.routeschedule.dto.response.RouteResponse;
import com.busmate.routeschedule.dto.response.RouteFilterOptionsResponse;
import com.busmate.routeschedule.dto.response.statistic.RouteStatisticsResponse;
import com.busmate.routeschedule.dto.response.importing.RouteUnifiedImportResponse;
import com.busmate.routeschedule.enums.DirectionEnum;
import com.busmate.routeschedule.service.RouteGroupService;
import com.busmate.routeschedule.service.RouteService;
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
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
@Tag(name = "02. Route Management", description = "APIs for managing routes and route groups")
public class RouteController {
    private final RouteService routeService;
    private final RouteGroupService routeGroupService;

    // ========== ROUTE APIs ==========

    // 1. READ ALL ROUTES WITH PAGINATION, SORTING, FILTERING AND SEARCH
    @GetMapping
    @Operation(
        summary = "Get all routes with pagination, sorting, filtering, and search",
        description = "Retrieve all routes with optional pagination, sorting, multi-column search, and advanced filtering. " +
                     "Search is performed across route name, description, route group name, start stop name, and end stop name. " +
                     "Default: page=0, size=10, sort=name",
        operationId = "getAllRoutes"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Routes retrieved successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid pagination, sorting, or filtering parameters")
    })
    public ResponseEntity<Page<RouteResponse>> getAllRoutes(
            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Page size (max 100)", example = "10")
            @RequestParam(defaultValue = "10") int size,
            
            @Parameter(description = "Sort by field name (name, createdAt, updatedAt, distanceKm, estimatedDurationMinutes)", example = "name")
            @RequestParam(defaultValue = "name") String sortBy,
            
            @Parameter(description = "Sort direction (asc or desc)", example = "asc")
            @RequestParam(defaultValue = "asc") String sortDir,
            
            @Parameter(description = "Search text to filter routes by name, description, route group name, start/end stop names", example = "Downtown")
            @RequestParam(required = false) String search,
            
            @Parameter(description = "Filter by route group ID")
            @RequestParam(required = false) UUID routeGroupId,
            
            @Parameter(description = "Filter by direction (INBOUND or OUTBOUND)")
            @RequestParam(required = false) DirectionEnum direction,
            
            @Parameter(description = "Filter by road type (NORMALWAY or EXPRESSWAY)")
            @RequestParam(required = false) com.busmate.routeschedule.enums.RoadTypeEnum roadType,
            
            @Parameter(description = "Minimum distance in kilometers", example = "5.0")
            @RequestParam(required = false) Double minDistance,
            
            @Parameter(description = "Maximum distance in kilometers", example = "50.0")
            @RequestParam(required = false) Double maxDistance,
            
            @Parameter(description = "Minimum estimated duration in minutes", example = "30")
            @RequestParam(required = false) Integer minDuration,
            
            @Parameter(description = "Maximum estimated duration in minutes", example = "120")
            @RequestParam(required = false) Integer maxDuration) {
        
        // Validate page size
        if (size > 100) {
            size = 100; // Maximum page size limit
        }
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                   Sort.by(sortBy).descending() : 
                   Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<RouteResponse> responses;
        
        // Determine which query method to use based on provided parameters
        boolean hasFilters = routeGroupId != null || direction != null || roadType != null ||
                           minDistance != null || maxDistance != null || 
                           minDuration != null || maxDuration != null;
        
        boolean hasSearch = search != null && !search.trim().isEmpty();
        
        if (hasSearch && hasFilters) {
            responses = routeService.getAllRoutesWithSearchAndFilters(
                search.trim(), routeGroupId, direction, roadType, minDistance, maxDistance, minDuration, maxDuration, pageable);
        } else if (hasSearch) {
            responses = routeService.getAllRoutesWithSearch(search.trim(), pageable);
        } else if (hasFilters) {
            responses = routeService.getAllRoutesWithFilters(
                routeGroupId, direction, roadType, minDistance, maxDistance, minDuration, maxDuration, pageable);
        } else {
            responses = routeService.getAllRoutes(pageable);
        }
        
        return ResponseEntity.ok(responses);
    }

    // 2. READ ALL ROUTES WITHOUT PAGINATION
    @GetMapping("/all")
    @Operation(
        summary = "Get all routes without pagination",
        description = "Retrieve all routes as a simple list without pagination. " +
                     "Use this endpoint carefully as it returns all routes at once.",
        operationId = "getAllRoutesAsList"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "All routes retrieved successfully")
    })
    public ResponseEntity<List<RouteResponse>> getAllRoutesAsList() {
        List<RouteResponse> responses = routeService.getAllRoutes();
        return ResponseEntity.ok(responses);
    }

    // 3. READ ROUTE BY ID
    @GetMapping("/{id}")
    @Operation(
        summary = "Get route by ID",
        description = "Retrieve a specific route by its unique identifier.",
        operationId = "getRouteById"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Route found and retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Route not found"),
        @ApiResponse(responseCode = "400", description = "Invalid UUID format")
    })
    public ResponseEntity<RouteResponse> getRouteById(
            @Parameter(description = "Route ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id) {
        RouteResponse response = routeService.getRouteById(id);
        return ResponseEntity.ok(response);
    }



    // 5. FILTER OPTIONS - Consolidated endpoint for all filter options
    @GetMapping("/filters/options")
    @Operation(
        summary = "Get all route filter options",
        description = "Retrieve all filter options in one consolidated response including directions, route groups, distance range, and duration range. " +
                     "This endpoint provides everything needed for the UI filtering functionality in a single API call.",
        operationId = "getRouteFilterOptions"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "All filter options retrieved successfully")
    })
    public ResponseEntity<RouteFilterOptionsResponse> getRouteFilterOptions() {
        RouteFilterOptionsResponse response = routeService.getFilterOptions();
        return ResponseEntity.ok(response);
    }

    // ========== ROUTE GROUP APIs ==========

    // 1. CREATE ROUTE GROUP
    @PostMapping("/groups")
    @Operation(
        summary = "Create a new route group",
        description = "Creates a new route group with the provided details and optional routes. Requires authentication.",
        operationId = "createRouteGroup"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Route group created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "409", description = "Route group already exists"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<RouteGroupResponse> createRouteGroup(
            @Valid @RequestBody RouteGroupRequest request, 
            Authentication authentication) {
        String userId = authentication.getName();
        RouteGroupResponse response = routeGroupService.createRouteGroup(request, userId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // 2. READ ALL ROUTE GROUPS WITH PAGINATION, SORTING AND SEARCH
    @GetMapping("/groups")
    @Operation(
        summary = "Get all route groups with pagination, sorting, and search",
        description = "Retrieve all route groups with optional pagination, sorting, and multi-column search. " +
                     "Search is performed across name and description columns. " +
                     "Default: page=0, size=10, sort=name",
        operationId = "getAllRouteGroups"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Route groups retrieved successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid pagination or sorting parameters")
    })
    public ResponseEntity<Page<RouteGroupResponse>> getAllRouteGroups(
            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Page size (max 100)", example = "10")
            @RequestParam(defaultValue = "10") int size,
            
            @Parameter(description = "Sort by field name (name, createdAt, updatedAt)", example = "name")
            @RequestParam(defaultValue = "name") String sortBy,
            
            @Parameter(description = "Sort direction (asc or desc)", example = "asc")
            @RequestParam(defaultValue = "asc") String sortDir,
            
            @Parameter(description = "Search text to filter route groups by name or description", example = "Express")
            @RequestParam(required = false) String search) {
        
        // Validate page size
        if (size > 100) {
            size = 100; // Maximum page size limit
        }
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                   Sort.by(sortBy).descending() : 
                   Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<RouteGroupResponse> responses;
        if (search != null && !search.trim().isEmpty()) {
            responses = routeGroupService.getAllRouteGroupsWithSearch(search.trim(), pageable);
        } else {
            responses = routeGroupService.getAllRouteGroups(pageable);
        }
        
        return ResponseEntity.ok(responses);
    }

    // 3. READ ALL ROUTE GROUPS WITHOUT PAGINATION
    @GetMapping("/groups/all")
    @Operation(
        summary = "Get all route groups without pagination",
        description = "Retrieve all route groups as a simple list without pagination. " +
                     "Use this endpoint carefully as it returns all route groups at once.",
        operationId = "getAllRouteGroupsAsList"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "All route groups retrieved successfully")
    })
    public ResponseEntity<List<RouteGroupResponse>> getAllRouteGroupsAsList() {
        List<RouteGroupResponse> responses = routeGroupService.getAllRouteGroups();
        return ResponseEntity.ok(responses);
    }

    // 4. READ ROUTE GROUP BY ID
    @GetMapping("/groups/{id}")
    @Operation(
        summary = "Get route group by ID",
        description = "Retrieve a specific route group by its unique identifier.",
        operationId = "getRouteGroupById"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Route group found and retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Route group not found"),
        @ApiResponse(responseCode = "400", description = "Invalid UUID format")
    })
    public ResponseEntity<RouteGroupResponse> getRouteGroupById(
            @Parameter(description = "Route Group ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id) {
        RouteGroupResponse response = routeGroupService.getRouteGroupById(id);
        return ResponseEntity.ok(response);
    }

    // 5. UPDATE ROUTE GROUP
    @PutMapping("/groups/{id}")
    @Operation(
        summary = "Update an existing route group",
        description = "Update an existing route group with new details. Requires authentication.",
        operationId = "updateRouteGroup"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Route group updated successfully"),
        @ApiResponse(responseCode = "404", description = "Route group not found"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "409", description = "Route group name already exists"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<RouteGroupResponse> updateRouteGroup(
            @Parameter(description = "Route Group ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id, 
            @Valid @RequestBody RouteGroupRequest request, 
            Authentication authentication) {
        String userId = authentication.getName();
        RouteGroupResponse response = routeGroupService.updateRouteGroup(id, request, userId);
        return ResponseEntity.ok(response);
    }

    // 6. DELETE ROUTE GROUP
    @DeleteMapping("/groups/{id}")
    @Operation(
        summary = "Delete a route group",
        description = "Permanently delete a route group and all its associated routes. This action cannot be undone. Requires authentication.",
        operationId = "deleteRouteGroup"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Route group deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Route group not found"),
        @ApiResponse(responseCode = "400", description = "Invalid UUID format"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Void> deleteRouteGroup(
            @Parameter(description = "Route Group ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id) {
        routeGroupService.deleteRouteGroup(id);
        return ResponseEntity.noContent().build();
    }

    // ========== STATISTICS APIs ==========

    // ROUTE STATISTICS - For KPI dashboard cards  
    @GetMapping("/statistics")
    @Operation(
        summary = "Get route statistics", 
        description = "Retrieve comprehensive route statistics for dashboard KPI cards including counts, distributions, distance/duration metrics, and route information.",
        operationId = "getRouteStatistics"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Statistics retrieved successfully")
    })
    public ResponseEntity<RouteStatisticsResponse> getRouteStatistics() {
        RouteStatisticsResponse response = routeService.getStatistics();
        return ResponseEntity.ok(response);
    }

    // ========== UNIFIED IMPORT APIs ==========

    // UNIFIED ROUTE IMPORT - Import route groups, routes, and route stops from single CSV
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
        summary = "Import complete route data from unified CSV file", 
        description = "Import route groups, routes, and route stops from a single CSV file with flexible options. " +
                     "CSV format includes all route-related entities in one row. Supports intelligent duplicate handling, " +
                     "validation options, and partial imports. The CSV should include columns for route group, route, and route stop information.",
        operationId = "importRoutesUnified"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Import completed (check response for detailed results)"),
        @ApiResponse(responseCode = "400", description = "Invalid file format or content"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<RouteUnifiedImportResponse> importRoutesUnified(
            @Parameter(description = "CSV file containing complete route data")
            @RequestParam("file") MultipartFile file,
            @Parameter(description = "Import options for handling duplicates and validation")
            @RequestParam(value = "routeGroupDuplicateStrategy", defaultValue = "REUSE") String routeGroupDuplicateStrategy,
            @RequestParam(value = "routeDuplicateStrategy", defaultValue = "SKIP") String routeDuplicateStrategy,
            @RequestParam(value = "validateStopsExist", defaultValue = "true") Boolean validateStopsExist,
            @RequestParam(value = "createMissingStops", defaultValue = "false") Boolean createMissingStops,
            @RequestParam(value = "allowPartialRouteStops", defaultValue = "true") Boolean allowPartialRouteStops,
            @RequestParam(value = "validateCoordinates", defaultValue = "false") Boolean validateCoordinates,
            @RequestParam(value = "continueOnError", defaultValue = "true") Boolean continueOnError,
            @RequestParam(value = "defaultRoadType", defaultValue = "NORMALWAY") String defaultRoadType,
            Authentication authentication) {
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        // Build import request
        RouteUnifiedImportRequest importRequest = new RouteUnifiedImportRequest();
        try {
            importRequest.setRouteGroupDuplicateStrategy(RouteUnifiedImportRequest.RouteGroupDuplicateStrategy.valueOf(routeGroupDuplicateStrategy));
            importRequest.setRouteDuplicateStrategy(RouteUnifiedImportRequest.RouteDuplicateStrategy.valueOf(routeDuplicateStrategy));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
        
        importRequest.setValidateStopsExist(validateStopsExist);
        importRequest.setCreateMissingStops(createMissingStops);
        importRequest.setAllowPartialRouteStops(allowPartialRouteStops);
        importRequest.setValidateCoordinates(validateCoordinates);
        importRequest.setContinueOnError(continueOnError);
        importRequest.setDefaultRoadType(defaultRoadType);
        
        String userId = authentication.getName();
        RouteUnifiedImportResponse response = routeService.importRoutesUnified(file, importRequest, userId);
        return ResponseEntity.ok(response);
    }

    // DOWNLOAD UNIFIED CSV TEMPLATE - For unified import template
    @GetMapping("/import/template")
    @Operation(
        summary = "Download unified CSV import template", 
        description = "Download a CSV template file with sample data for unified route import. " +
                     "This template includes all route-related entities (route groups, routes, route stops) in a single format.",
        operationId = "downloadUnifiedRouteImportTemplate"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Template downloaded successfully")
    })
    public ResponseEntity<String> downloadUnifiedRouteImportTemplate() {
        String csvTemplate = "route_group_name,route_group_name_sinhala,route_group_name_tamil,route_group_description," +
                           "route_name,route_name_sinhala,route_name_tamil,route_number,route_description," +
                           "road_type,route_through,route_through_sinhala,route_through_tamil,direction," +
                           "distance_km,estimated_duration_minutes,start_stop_id,end_stop_id," +
                           "stop_order,stop_id,stop_name_english,stop_name_sinhala,distance_from_start_km\n" +
                           
                           "\"Colombo - Kandy\",\"කොළඹ - මහනුවර\",\"கொழும்பு - கண்டி\",\"Main intercity routes from Colombo to central regions\"," +
                           "\"Colombo - Kandy Express\",\"කොළඹ - කෑන්ඩි එක්ස්ප්‍රස්\",\"கொழும்பு - கண்டி எக்ஸ்ப்ரெஸ்\",\"001\"," +
                           "\"Express route from Colombo to Kandy\",\"EXPRESSWAY\",\"via A1 Highway\",\"A1 අධිවේගී මාර්ගය හරහා\"," +
                           "\"A1 நெடுஞ்சாலை வழியாக\",\"OUTBOUND\",\"115.5\",\"180\"," +
                           "\"550e8400-e29b-41d4-a716-446655440001\",\"550e8400-e29b-41d4-a716-446655440002\"," +
                           "\"0\",\"550e8400-e29b-41d4-a716-446655440001\",\"Colombo Central\",\"කොළඹ මධ්‍යම\",\"0\"\n" +
                           
                           "\"Colombo - Kandy\",\"කොළඹ - මහනුවර\",\"கொழும்பு - கண்டி\",\"Main intercity routes from Colombo to central regions\"," +
                           "\"Colombo - Kandy Express\",\"කොළඹ - කෑන්ඩි එක්ස්ප්‍රස්\",\"கொழும்பு - கண்டி எக்ஸ்ப்ரெஸ்\",\"001\"," +
                           "\"Express route from Colombo to Kandy\",\"EXPRESSWAY\",\"via A1 Highway\",\"A1 අධිවේගී මාර්ගය හරහා\"," +
                           "\"A1 நெடுஞ்சாலை வழியாக\",\"OUTBOUND\",\"115.5\",\"180\"," +
                           "\"550e8400-e29b-41d4-a716-446655440001\",\"550e8400-e29b-41d4-a716-446655440002\"," +
                           "\"1\",\"550e8400-e29b-41d4-a716-446655440003\",\"Kadawatha\",\"කඩවත\",\"25.5\"\n" +
                           
                           "\"Galle - Matara\",\"ගාල්ල - මාතර\",\"காலி - மாத்தறை\",\"Southern coastal routes\"," +
                           "\"Galle - Matara Local\",\"ගාල්ල - මාතර දේශීය\",\"காலி - மாத்தறை உள்ளூர்\",\"002\"," +
                           "\"Local service along southern coast\",\"NORMALWAY\",\"via Coastal Road\",\"වෙරළබඩ මාර්ගය හරහා\"," +
                           "\"கடற்கரை சாலை வழியாக\",\"OUTBOUND\",\"45.2\",\"90\"," +
                           "\"550e8400-e29b-41d4-a716-446655440004\",\"550e8400-e29b-41d4-a716-446655440005\"," +
                           "\"0\",\"550e8400-e29b-41d4-a716-446655440004\",\"Galle Bus Station\",\"ගාල්ල බස් නැවතුම්පළ\",\"0\"\n";
        
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv; charset=UTF-8")
                .header("Content-Disposition", "attachment; filename=\"route_unified_import_template.csv\"")
                .body(csvTemplate);
    }
}