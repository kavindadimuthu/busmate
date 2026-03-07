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

import com.busmate.routeschedule.network.dto.request.RouteExportRequest;
import com.busmate.routeschedule.network.dto.request.RouteGroupRequest;
import com.busmate.routeschedule.network.dto.request.RouteRequest;
import com.busmate.routeschedule.network.dto.request.RouteUnifiedImportRequest;
import com.busmate.routeschedule.network.dto.response.RouteExportResponse;
import com.busmate.routeschedule.network.dto.response.RouteFilterOptionsResponse;
import com.busmate.routeschedule.network.dto.response.RouteGroupResponse;
import com.busmate.routeschedule.network.dto.response.RouteResponse;
import com.busmate.routeschedule.network.dto.response.RouteStatisticsResponse;
import com.busmate.routeschedule.network.dto.response.RouteUnifiedImportResponse;
import com.busmate.routeschedule.network.enums.DirectionEnum;
import com.busmate.routeschedule.network.service.RouteGroupService;
import com.busmate.routeschedule.network.service.RouteImportExportService;
import com.busmate.routeschedule.network.service.RouteService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
@Tag(name = "02. Route Management", description = "APIs for managing routes and route groups")
public class RouteController {

    /** Allowed field names for route {@code sortBy} query parameter. */
    private static final Set<String> VALID_ROUTE_SORT_FIELDS = Set.of(
            "name", "nameSinhala", "nameTamil", "routeNumber",
            "distanceKm", "estimatedDurationMinutes",
            "direction", "roadType", "createdAt", "updatedAt");

    /** Allowed field names for route-group {@code sortBy} query parameter. */
    private static final Set<String> VALID_ROUTE_GROUP_SORT_FIELDS = Set.of(
            "name", "nameSinhala", "nameTamil",
            "createdAt", "updatedAt");

    private final RouteService routeService;
    private final RouteGroupService routeGroupService;
    private final RouteImportExportService routeImportExportService;

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
            @RequestParam(required = false) com.busmate.routeschedule.network.enums.RoadTypeEnum roadType,
            
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

        // Validate sort field
        if (!VALID_ROUTE_SORT_FIELDS.contains(sortBy)) {
            return ResponseEntity.badRequest().build();
        }
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                   Sort.by(sortBy).descending() : 
                   Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<RouteResponse> responses = routeService.getAllRoutes(
                (search != null && !search.trim().isEmpty()) ? search.trim() : null,
                routeGroupId, direction, roadType,
                minDistance, maxDistance, minDuration, maxDuration,
                pageable);
        
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



    // 4. CREATE STANDALONE ROUTE
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @Operation(
        summary = "Create an individual route",
        description = "Creates a standalone route linked to an existing route group. " +
                     "The routeGroupId in the request body determines the parent group. Requires authentication.",
        operationId = "createRoute"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Route created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "404", description = "Route group or stop not found"),
        @ApiResponse(responseCode = "409", description = "Route with same name already exists in the route group"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - requires MOT role")
    })
    public ResponseEntity<RouteResponse> createRoute(
            @Valid @RequestBody RouteRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        RouteResponse response = routeService.createRoute(request, userId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // 5. UPDATE STANDALONE ROUTE
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @Operation(
        summary = "Update an individual route",
        description = "Updates an existing route by its ID. All fields are replaced from the request body. Requires authentication.",
        operationId = "updateRoute"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Route updated successfully"),
        @ApiResponse(responseCode = "404", description = "Route, route group, or stop not found"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "409", description = "Route name conflict within route group"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - requires MOT role")
    })
    public ResponseEntity<RouteResponse> updateRoute(
            @Parameter(description = "Route ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id,
            @Valid @RequestBody RouteRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        RouteResponse response = routeService.updateRoute(id, request, userId);
        return ResponseEntity.ok(response);
    }

    // 6. DELETE STANDALONE ROUTE
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @Operation(
        summary = "Delete an individual route",
        description = "Permanently deletes a route and its associated route stops. This action cannot be undone. Requires authentication.",
        operationId = "deleteRoute"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Route deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Route not found"),
        @ApiResponse(responseCode = "400", description = "Invalid UUID format"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - requires MOT role")
    })
    public ResponseEntity<Void> deleteRoute(
            @Parameter(description = "Route ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id) {
        routeService.deleteRoute(id);
        return ResponseEntity.noContent().build();
    }

    // 7. FILTER OPTIONS - Consolidated endpoint for all filter options
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
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @Operation(
        summary = "Create a new route group",
        description = "Creates a new route group with the provided details and optional routes. Requires authentication.",
        operationId = "createRouteGroup"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Route group created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "409", description = "Route group already exists"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - requires MOT role")
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

        // Validate sort field
        if (!VALID_ROUTE_GROUP_SORT_FIELDS.contains(sortBy)) {
            return ResponseEntity.badRequest().build();
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
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
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
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - requires MOT role")
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
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @Operation(
        summary = "Delete a route group",
        description = "Permanently delete a route group and all its associated routes. This action cannot be undone. Requires authentication.",
        operationId = "deleteRouteGroup"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Route group deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Route group not found"),
        @ApiResponse(responseCode = "400", description = "Invalid UUID format"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - requires MOT role")
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
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
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
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - requires MOT role")
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
        RouteUnifiedImportResponse response = routeImportExportService.importRoutesUnified(file, importRequest, userId);
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

    // 9. EXPORT ROUTES - CSV ONLY WITH TWO MODES
    @PostMapping("/export")
    @Operation(
        summary = "Export routes in CSV format with rich filtering and two distinct modes",
        description = "Export routes data exclusively in CSV format with comprehensive filtering options and two distinct export modes:\n\n" +
                     "**MODE 1 - ROUTE_ONLY**: One row per route containing only start and end stop information.\n" +
                     "**MODE 2 - ROUTE_WITH_ALL_STOPS**: One row per stop (multiple rows per route) including all intermediate stops.\n\n" +
                     "Supports extensive filtering by route attributes, stop criteria, text search, and customizable field inclusion. " +
                     "Perfect for system integrations, BI dashboards, schedule imports, and route database migrations. " +
                     "All exports include UUIDs for efficient data integration.",
        operationId = "exportRoutes"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "CSV export completed successfully with comprehensive metadata"),
        @ApiResponse(responseCode = "400", description = "Invalid export request parameters or validation errors"),
        @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
        @ApiResponse(responseCode = "500", description = "Internal server error during CSV generation")
    })
    public ResponseEntity<byte[]> exportRoutes(
            @Parameter(description = "Export all routes (ignores other filters if true)", example = "false")
            @RequestParam(defaultValue = "false") Boolean exportAll,
            
            @Parameter(description = "Specific route IDs to export (comma-separated)")
            @RequestParam(required = false) List<UUID> routeIds,
            
            @Parameter(description = "Filter by route group IDs (comma-separated)")
            @RequestParam(required = false) List<UUID> routeGroupIds,
            
            @Parameter(description = "Filter by stops that routes travel through (comma-separated)")
            @RequestParam(required = false) List<UUID> travelsThroughStopIds,
            
            @Parameter(description = "Filter by start stop IDs (comma-separated)")
            @RequestParam(required = false) List<UUID> startStopIds,
            
            @Parameter(description = "Filter by end stop IDs (comma-separated)")
            @RequestParam(required = false) List<UUID> endStopIds,
            
            @Parameter(description = "Filter by direction (UP, DOWN) - comma-separated")
            @RequestParam(required = false) List<String> directions,
            
            @Parameter(description = "Filter by road type (NORMALWAY, EXPRESSWAY) - comma-separated")
            @RequestParam(required = false) List<String> roadTypes,
            
            @Parameter(description = "Filter by minimum distance in kilometers", example = "5.0")
            @RequestParam(required = false) Double minDistanceKm,
            
            @Parameter(description = "Filter by maximum distance in kilometers", example = "50.0")
            @RequestParam(required = false) Double maxDistanceKm,
            
            @Parameter(description = "Filter by minimum estimated duration in minutes", example = "30")
            @RequestParam(required = false) Integer minDurationMinutes,
            
            @Parameter(description = "Filter by maximum estimated duration in minutes", example = "120")
            @RequestParam(required = false) Integer maxDurationMinutes,
            
            @Parameter(description = "Search text to filter routes by name, route number, or description in all languages")
            @RequestParam(required = false) String searchText,
            
            @Parameter(description = "Export mode - determines CSV structure", example = "ROUTE_ONLY")
            @RequestParam(defaultValue = "ROUTE_ONLY") RouteExportRequest.ExportMode exportMode,
            
            @Parameter(description = "Export format", example = "CSV")
            @RequestParam(defaultValue = "CSV") RouteExportRequest.ExportFormat format,
            
            @Parameter(description = "Include multi-language fields (name_sinhala, name_tamil, etc.)", example = "true")
            @RequestParam(defaultValue = "true") Boolean includeMultiLanguageFields,
            
            @Parameter(description = "Include route group information", example = "true")
            @RequestParam(defaultValue = "true") Boolean includeRouteGroupInfo,
            
            @Parameter(description = "Include audit fields (created_at, updated_at, created_by, updated_by)", example = "false")
            @RequestParam(defaultValue = "false") Boolean includeAuditFields,
            
            @Parameter(description = "Custom fields to include in export (comma-separated, if specified only these fields will be exported)")
            @RequestParam(required = false) List<String> customFields,
            
            Authentication authentication) {
        
        // Build request object from parameters
        RouteExportRequest exportRequest = new RouteExportRequest();
        exportRequest.setExportAll(exportAll);
        exportRequest.setRouteIds(routeIds);
        exportRequest.setRouteGroupIds(routeGroupIds);
        exportRequest.setTravelsThroughStopIds(travelsThroughStopIds);
        exportRequest.setStartStopIds(startStopIds);
        exportRequest.setEndStopIds(endStopIds);
        exportRequest.setDirections(directions);
        exportRequest.setRoadTypes(roadTypes);
        exportRequest.setMinDistanceKm(minDistanceKm);
        exportRequest.setMaxDistanceKm(maxDistanceKm);
        exportRequest.setMinDurationMinutes(minDurationMinutes);
        exportRequest.setMaxDurationMinutes(maxDurationMinutes);
        exportRequest.setSearchText(searchText);
        exportRequest.setExportMode(exportMode);
        exportRequest.setFormat(format);
        exportRequest.setIncludeMultiLanguageFields(includeMultiLanguageFields);
        exportRequest.setIncludeRouteGroupInfo(includeRouteGroupInfo);
        exportRequest.setIncludeAuditFields(includeAuditFields);
        exportRequest.setCustomFields(customFields);
        
        String userId = authentication != null ? authentication.getName() : "anonymous";
        
        RouteExportResponse exportResponse = routeImportExportService.exportRoutes(exportRequest, userId);
        
        return ResponseEntity.ok()
                .header("Content-Type", exportResponse.getContentType())
                .header("Content-Disposition", "attachment; filename=\"" + exportResponse.getFileName() + "\"")
                .header("X-Export-Total-Records", exportResponse.getMetadata().getTotalRecordsFound().toString())
                .header("X-Export-Records", exportResponse.getMetadata().getRecordsExported().toString())
                .header("X-Export-Mode", exportResponse.getMetadata().getExportMode())
                .header("X-Export-Format", exportResponse.getMetadata().getFormat())
                .header("X-Export-Timestamp", exportResponse.getMetadata().getExportedAt().toString())
                .header("X-Export-By", exportResponse.getMetadata().getExportedBy())
                .body(exportResponse.getContent());
    }
}