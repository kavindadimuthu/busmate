package com.busmate.routeschedule.controller;

import com.busmate.routeschedule.dto.request.RouteGroupRequest;
import com.busmate.routeschedule.dto.response.RouteGroupResponse;
import com.busmate.routeschedule.dto.response.RouteResponse;
import com.busmate.routeschedule.dto.response.RouteStatisticsResponse;
import com.busmate.routeschedule.dto.response.RouteImportResponse;
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
        boolean hasFilters = routeGroupId != null || direction != null || 
                           minDistance != null || maxDistance != null || 
                           minDuration != null || maxDuration != null;
        
        boolean hasSearch = search != null && !search.trim().isEmpty();
        
        if (hasSearch && hasFilters) {
            responses = routeService.getAllRoutesWithSearchAndFilters(
                search.trim(), routeGroupId, direction, minDistance, maxDistance, minDuration, maxDuration, pageable);
        } else if (hasSearch) {
            responses = routeService.getAllRoutesWithSearch(search.trim(), pageable);
        } else if (hasFilters) {
            responses = routeService.getAllRoutesWithFilters(
                routeGroupId, direction, minDistance, maxDistance, minDuration, maxDuration, pageable);
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

    // 4. GET ROUTES BY ROUTE GROUP ID
    @GetMapping("/by-group/{routeGroupId}")
    @Operation(
        summary = "Get routes by route group ID",
        description = "Retrieve all routes belonging to a specific route group.",
        operationId = "getRoutesByRouteGroupId"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Routes retrieved successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid UUID format")
    })
    public ResponseEntity<List<RouteResponse>> getRoutesByRouteGroupId(
            @Parameter(description = "Route Group ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID routeGroupId) {
        List<RouteResponse> responses = routeService.getRoutesByRouteGroupId(routeGroupId);
        return ResponseEntity.ok(responses);
    }

    // 5. FILTER OPTIONS - Get distinct values for filtering
    @GetMapping("/filter-options/directions")
    @Operation(
        summary = "Get distinct directions",
        description = "Retrieve all distinct directions available in the routes database for filter dropdown options.",
        operationId = "getDistinctDirections"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Distinct directions retrieved successfully")
    })
    public ResponseEntity<List<DirectionEnum>> getDistinctDirections() {
        List<DirectionEnum> directions = routeService.getDistinctDirections();
        return ResponseEntity.ok(directions);
    }

    @GetMapping("/filter-options/route-groups")
    @Operation(
        summary = "Get distinct route groups",
        description = "Retrieve all distinct route groups available in the routes database for filter dropdown options.",
        operationId = "getDistinctRouteGroups"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Distinct route groups retrieved successfully")
    })
    public ResponseEntity<List<Map<String, Object>>> getDistinctRouteGroups() {
        List<Map<String, Object>> routeGroups = routeService.getDistinctRouteGroups();
        return ResponseEntity.ok(routeGroups);
    }

    @GetMapping("/filter-options/distance-range")
    @Operation(
        summary = "Get distance range",
        description = "Retrieve the minimum and maximum distance values available in the routes database for range filter options.",
        operationId = "getDistanceRange"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Distance range retrieved successfully")
    })
    public ResponseEntity<Map<String, Object>> getDistanceRange() {
        Map<String, Object> range = routeService.getDistanceRange();
        return ResponseEntity.ok(range);
    }

    @GetMapping("/filter-options/duration-range")
    @Operation(
        summary = "Get duration range",
        description = "Retrieve the minimum and maximum duration values available in the routes database for range filter options.",
        operationId = "getDurationRange"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Duration range retrieved successfully")
    })
    public ResponseEntity<Map<String, Object>> getDurationRange() {
        Map<String, Object> range = routeService.getDurationRange();
        return ResponseEntity.ok(range);
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

    // ========== IMPORT APIs ==========

    // ROUTE IMPORT - For bulk route import from file
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
        summary = "Import routes from CSV file", 
        description = "Bulk import routes from a CSV file. Expected CSV format: name,description,routeGroupName,startStopName,endStopName,distanceKm,estimatedDurationMinutes,direction (header row required). " +
                     "Direction should be OUTBOUND or INBOUND. Route group and stops must already exist in the system. Requires authentication.",
        operationId = "importRoutes"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Import completed (check response for detailed results)"),
        @ApiResponse(responseCode = "400", description = "Invalid file format or content"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<RouteImportResponse> importRoutes(
            @Parameter(description = "CSV file containing route data")
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        String userId = authentication.getName();
        RouteImportResponse response = routeService.importRoutes(file, userId);
        return ResponseEntity.ok(response);
    }

    // DOWNLOAD CSV TEMPLATE - For import template
    @GetMapping("/import-template")
    @Operation(
        summary = "Download CSV import template", 
        description = "Download a CSV template file with sample data and correct format for route import.",
        operationId = "downloadRouteImportTemplate"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Template downloaded successfully")
    })
    public ResponseEntity<String> downloadRouteImportTemplate() {
        String csvTemplate = "name,description,routeGroupName,startStopName,endStopName,distanceKm,estimatedDurationMinutes,direction\n" +
                           "Colombo - Kandy Express,Express route from Colombo to Kandy,Main Routes,Colombo Central Bus Station,Kandy Bus Terminal,115.5,180,OUTBOUND\n" +
                           "Kandy - Colombo Express,Express route from Kandy to Colombo,Main Routes,Kandy Bus Terminal,Colombo Central Bus Station,115.5,180,INBOUND\n" +
                           "Galle - Matara Local,Local route from Galle to Matara,Southern Routes,Galle Bus Station,Matara Bus Terminal,45.2,90,OUTBOUND\n";
        
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv")
                .header("Content-Disposition", "attachment; filename=\"route_import_template.csv\"")
                .body(csvTemplate);
    }
}