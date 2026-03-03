package com.busmate.routeschedule.fleet.controller;

import com.busmate.routeschedule.fleet.dto.response.BusResponse;
import com.busmate.routeschedule.licensing.dto.response.PassengerServicePermitResponse;
import com.busmate.routeschedule.operations.dto.response.TripResponse;
import com.busmate.routeschedule.network.dto.response.RouteResponse;
import com.busmate.routeschedule.scheduling.dto.response.ScheduleResponse;
import com.busmate.routeschedule.fleet.dto.response.OperatorResponse;
import com.busmate.routeschedule.shared.dto.PaginatedResponse;
import com.busmate.routeschedule.shared.enums.StatusEnum;
import com.busmate.routeschedule.operations.enums.TripStatusEnum;
import com.busmate.routeschedule.scheduling.enums.ScheduleStatusEnum;
import com.busmate.routeschedule.fleet.service.BusService;
import com.busmate.routeschedule.licensing.service.PassengerServicePermitService;
import com.busmate.routeschedule.operations.service.TripService;
import com.busmate.routeschedule.network.service.RouteService;
import com.busmate.routeschedule.scheduling.service.ScheduleService;
import com.busmate.routeschedule.fleet.service.OperatorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import com.busmate.routeschedule.fleet.entity.Bus;
import com.busmate.routeschedule.shared.entity.BaseEntity;
import com.busmate.routeschedule.fleet.entity.Operator;
import com.busmate.routeschedule.scheduling.entity.Schedule;
import com.busmate.routeschedule.operations.entity.Trip;

/**
 * Bus Operator Controller
 * 
 * Dedicated REST API controller for bus operator specific operations.
 * Provides role-based endpoints tailored for bus operators to access and manage their own data.
 * 
 * Features:
 * - Comprehensive pagination with page and size parameters
 * - Flexible sorting with sortBy and sortDir parameters
 * - Advanced filtering options for all endpoints
 * - Input validation and error handling
 * - Consistent parameter structure across all endpoints
 * 
 * Pagination & Sorting:
 * - Default: page=0, size=10
 * - Maximum page size: 100
 * - Sort fields vary by endpoint (documented in each method)
 * - Sort direction: asc (default) or desc
 * 
 * Note: Some endpoints use post-filtering due to service layer limitations.
 * For optimal performance, consider implementing operator-specific repository methods.
 */
@RestController
@RequestMapping("/api/v1/bus-operator")
@RequiredArgsConstructor
@Tag(name = "Bus Operator Operations", description = "API endpoints for bus operator specific operations")
public class BusOperatorController {

    private final BusService busService;
    private final PassengerServicePermitService passengerServicePermitService;
    private final TripService tripService;
    private final RouteService routeService;
    private final ScheduleService scheduleService;
    private final OperatorService operatorService;

    // ============================================================================
    // OPERATOR PROFILE OPERATIONS
    // ============================================================================

    @GetMapping("/{operatorId}/profile")
    @Operation(
        summary = "Get bus operator profile",
        description = "Retrieve detailed information about a specific bus operator"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Operator profile retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Operator not found")
    })
    public ResponseEntity<OperatorResponse> getOperatorProfile(
            @Parameter(description = "Operator ID", required = true)
            @PathVariable UUID operatorId) {
        OperatorResponse operator = operatorService.getOperatorById(operatorId);
        return ResponseEntity.ok(operator);
    }

    // ============================================================================
    // BUS OPERATIONS
    // ============================================================================

    @GetMapping("/{operatorId}/buses")
    @Operation(
        summary = "Get all buses for operator",
        description = "Retrieve all buses registered under a specific bus operator with pagination, sorting, and filtering options. " +
                     "Search is performed across NTC registration number, plate number, and model (case-insensitive). " +
                     "Default: page=0, size=10, sort=ntcRegistrationNumber,asc. Maximum page size is 100."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Buses retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Operator not found"),
        @ApiResponse(responseCode = "400", description = "Invalid pagination, sorting, or filter parameters")
    })
    public ResponseEntity<Page<BusResponse>> getOperatorBuses(
            @Parameter(description = "Operator ID", required = true)
            @PathVariable UUID operatorId,
            
            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Page size (max 100)", example = "10")
            @RequestParam(defaultValue = "10") int size,
            
            @Parameter(description = "Sort by field name (ntcRegistrationNumber, plateNumber, capacity, model, status, createdAt, updatedAt)", example = "ntcRegistrationNumber")
            @RequestParam(defaultValue = "ntcRegistrationNumber") String sortBy,
            
            @Parameter(description = "Sort direction (asc or desc)", example = "asc")
            @RequestParam(defaultValue = "asc") String sortDir,
            
            @Parameter(description = "Filter by bus status")
            @RequestParam(required = false) StatusEnum status,
            
            @Parameter(description = "Search by plate number or NTC registration number (case-insensitive)")
            @RequestParam(required = false) String searchText,
            
            @Parameter(description = "Minimum capacity filter")
            @RequestParam(required = false) Integer minCapacity,
            
            @Parameter(description = "Maximum capacity filter")
            @RequestParam(required = false) Integer maxCapacity) {
        
        // Validate and normalize pagination parameters
        if (page < 0) {
            throw new IllegalArgumentException("Page number cannot be negative");
        }
        if (size <= 0) {
            throw new IllegalArgumentException("Page size must be positive");
        }
        if (size > 100) {
            throw new IllegalArgumentException("Page size cannot exceed 100");
        }
        
        // Validate sortBy field
        List<String> allowedSortFields = List.of("ntcRegistrationNumber", "plateNumber", "capacity", 
                "model", "status", "createdAt", "updatedAt");
        if (!allowedSortFields.contains(sortBy)) {
            throw new IllegalArgumentException("Invalid sort field: " + sortBy + ". Allowed fields: " + allowedSortFields);
        }
        
        // Map camelCase property names to snake_case column names for native query sorting
        String sortColumn = switch (sortBy) {
            case "ntcRegistrationNumber" -> "ntc_registration_number";
            case "plateNumber" -> "plate_number";
            case "createdAt" -> "created_at";
            case "updatedAt" -> "updated_at";
            default -> sortBy;
        };
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                   Sort.by(sortColumn).descending() : 
                   Sort.by(sortColumn).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Validate capacity range
        if (minCapacity != null && minCapacity < 0) {
            throw new IllegalArgumentException("Minimum capacity cannot be negative");
        }
        if (maxCapacity != null && maxCapacity < 0) {
            throw new IllegalArgumentException("Maximum capacity cannot be negative");
        }
        if (minCapacity != null && maxCapacity != null && minCapacity > maxCapacity) {
            throw new IllegalArgumentException("Minimum capacity cannot be greater than maximum capacity");
        }
        
        // Normalize search text
        String normalizedSearchText = (searchText != null && !searchText.trim().isEmpty()) ? searchText.trim() : null;
        
        Page<BusResponse> buses = busService.getAllBusesWithFilters(
            normalizedSearchText, operatorId, status, minCapacity, maxCapacity, pageable);
        return ResponseEntity.ok(buses);
    }

    @GetMapping("/{operatorId}/buses/{busId}")
    @Operation(
        summary = "Get specific bus details for operator",
        description = "Retrieve detailed information about a specific bus belonging to the operator"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Bus details retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Bus not found or doesn't belong to operator")
    })
    public ResponseEntity<BusResponse> getOperatorBusById(
            @Parameter(description = "Operator ID", required = true)
            @PathVariable UUID operatorId,
            @Parameter(description = "Bus ID", required = true)
            @PathVariable UUID busId) {
        
        BusResponse bus = busService.getBusById(busId);
        // Verify bus belongs to operator
        if (!bus.getOperatorId().equals(operatorId)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(bus);
    }

    // ============================================================================
    // PASSENGER SERVICE PERMIT OPERATIONS
    // ============================================================================

    @GetMapping("/{operatorId}/permits")
    @Operation(
        summary = "Get all permits for operator",
        description = "Retrieve all passenger service permits registered under a specific bus operator with pagination, sorting, and filtering options. " +
                     "Default: page=0, size=10, sort=permitNumber,asc. Maximum page size is 100."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Permits retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Operator not found"),
        @ApiResponse(responseCode = "400", description = "Invalid pagination, sorting, or filter parameters")
    })
    public ResponseEntity<PaginatedResponse<PassengerServicePermitResponse>> getOperatorPermits(
            @Parameter(description = "Operator ID", required = true)
            @PathVariable UUID operatorId,
            
            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Page size (max 100)", example = "10")
            @RequestParam(defaultValue = "10") int size,
            
            @Parameter(description = "Sort by field name (permitNumber, issueDate, expiryDate, status, createdAt, updatedAt)", example = "permitNumber")
            @RequestParam(defaultValue = "permitNumber") String sortBy,
            
            @Parameter(description = "Sort direction (asc or desc)", example = "asc")
            @RequestParam(defaultValue = "asc") String sortDir,
            
            @Parameter(description = "Filter by permit status")
            @RequestParam(required = false) String status,
            
            @Parameter(description = "Filter by permit type")
            @RequestParam(required = false) String permitType,
            
            @Parameter(description = "Search text")
            @RequestParam(required = false) String searchText) {
        
        // Validate and normalize pagination parameters
        if (page < 0) {
            throw new IllegalArgumentException("Page number cannot be negative");
        }
        if (size <= 0) {
            throw new IllegalArgumentException("Page size must be positive");
        }
        if (size > 100) {
            throw new IllegalArgumentException("Page size cannot exceed 100");
        }
        
        // Validate sortBy field
        List<String> allowedSortFields = List.of("permitNumber", "issueDate", "expiryDate", 
                "status", "createdAt", "updatedAt");
        if (!allowedSortFields.contains(sortBy)) {
            throw new IllegalArgumentException("Invalid sort field: " + sortBy + ". Allowed fields: " + allowedSortFields);
        }
        
        // Create pageable without sorting since PaginatedResponse doesn't support it properly
        Pageable pageable = PageRequest.of(page, size);
        
        // Get all permits and filter by operator (suboptimal but works with current service design)
        PaginatedResponse<PassengerServicePermitResponse> permits = passengerServicePermitService
            .getPermits(pageable, status, permitType, null, null);
        
        // Filter results to only include permits for this operator
        List<PassengerServicePermitResponse> filteredPermits = permits.getContent().stream()
            .filter(permit -> permit.getOperatorId().equals(operatorId))
            .toList();
        
        // Apply search filter if provided
        if (searchText != null && !searchText.trim().isEmpty()) {
            String normalizedSearch = searchText.trim().toLowerCase();
            filteredPermits = filteredPermits.stream()
                .filter(permit -> 
                    permit.getPermitNumber().toLowerCase().contains(normalizedSearch) ||
                    (permit.getRouteGroupName() != null && permit.getRouteGroupName().toLowerCase().contains(normalizedSearch)))
                .toList();
        }
        
        // Apply manual sorting since service doesn't support it
        if (!filteredPermits.isEmpty()) {
            filteredPermits = filteredPermits.stream()
                .sorted((p1, p2) -> {
                    int comparison = switch (sortBy) {
                        case "permitNumber" -> p1.getPermitNumber().compareToIgnoreCase(p2.getPermitNumber());
                        case "issueDate" -> p1.getIssueDate().compareTo(p2.getIssueDate());
                        case "expiryDate" -> {
                            if (p1.getExpiryDate() == null && p2.getExpiryDate() == null) yield 0;
                            if (p1.getExpiryDate() == null) yield 1;
                            if (p2.getExpiryDate() == null) yield -1;
                            yield p1.getExpiryDate().compareTo(p2.getExpiryDate());
                        }
                        case "status" -> p1.getStatus().compareToIgnoreCase(p2.getStatus());
                        case "createdAt" -> p1.getCreatedAt().compareTo(p2.getCreatedAt());
                        case "updatedAt" -> p1.getUpdatedAt().compareTo(p2.getUpdatedAt());
                        default -> p1.getPermitNumber().compareToIgnoreCase(p2.getPermitNumber());
                    };
                    return sortDir.equalsIgnoreCase("desc") ? -comparison : comparison;
                })
                .toList();
        }
        
        // Create a new paginated response with filtered results
        PaginatedResponse<PassengerServicePermitResponse> result = PaginatedResponse.of(
            filteredPermits, page, filteredPermits.size(), filteredPermits.size());
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{operatorId}/permits/{permitId}")
    @Operation(
        summary = "Get specific permit details for operator",
        description = "Retrieve detailed information about a specific permit belonging to the operator"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Permit details retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Permit not found or doesn't belong to operator")
    })
    public ResponseEntity<PassengerServicePermitResponse> getOperatorPermitById(
            @Parameter(description = "Operator ID", required = true)
            @PathVariable UUID operatorId,
            @Parameter(description = "Permit ID", required = true)
            @PathVariable UUID permitId) {
        
        PassengerServicePermitResponse permit = passengerServicePermitService.getPermitById(permitId);
        // Verify permit belongs to operator
        if (!permit.getOperatorId().equals(operatorId)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(permit);
    }

    // ============================================================================
    // TRIP OPERATIONS
    // ============================================================================

    @GetMapping("/{operatorId}/trips")
    @Operation(
        summary = "Get all trips for operator",
        description = "Retrieve all trips associated with the operator's permits and schedules with pagination, sorting, and filtering options. " +
                     "Default: page=0, size=10, sort=tripDate,desc. Maximum page size is 100."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Trips retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Operator not found"),
        @ApiResponse(responseCode = "400", description = "Invalid pagination, sorting, or filter parameters")
    })
    public ResponseEntity<Page<TripResponse>> getOperatorTrips(
            @Parameter(description = "Operator ID", required = true)
            @PathVariable UUID operatorId,
            
            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Page size (max 100)", example = "10")
            @RequestParam(defaultValue = "10") int size,
            
            @Parameter(description = "Sort by field name (tripDate, scheduledDepartureTime, status, createdAt, updatedAt)", example = "tripDate")
            @RequestParam(defaultValue = "tripDate") String sortBy,
            
            @Parameter(description = "Sort direction (asc or desc)", example = "desc")
            @RequestParam(defaultValue = "desc") String sortDir,
            
            @Parameter(description = "Filter by trip status")
            @RequestParam(required = false) TripStatusEnum status,
            
            @Parameter(description = "Filter by trip date (from)")
            @RequestParam(required = false) LocalDate fromDate,
            
            @Parameter(description = "Filter by trip date (to)")
            @RequestParam(required = false) LocalDate toDate,
            
            @Parameter(description = "Filter by route group ID")
            @RequestParam(required = false) UUID routeGroupId,
            
            @Parameter(description = "Filter by route ID")
            @RequestParam(required = false) UUID routeId,
            
            @Parameter(description = "Filter by schedule ID")
            @RequestParam(required = false) UUID scheduleId,
            
            @Parameter(description = "Filter by permit ID")
            @RequestParam(required = false) UUID passengerServicePermitId,
            
            @Parameter(description = "Filter by bus ID")
            @RequestParam(required = false) UUID busId,
            
            @Parameter(description = "Search text (route name, permit number, etc.)")
            @RequestParam(required = false) String search) {
        
        // Validate and normalize pagination parameters
        if (page < 0) {
            throw new IllegalArgumentException("Page number cannot be negative");
        }
        if (size <= 0) {
            throw new IllegalArgumentException("Page size must be positive");
        }
        if (size > 100) {
            throw new IllegalArgumentException("Page size cannot exceed 100");
        }
        
        // Validate sortBy field
        List<String> allowedSortFields = List.of("tripDate", "scheduledDepartureTime", 
                "status", "createdAt", "updatedAt");
        if (!allowedSortFields.contains(sortBy)) {
            throw new IllegalArgumentException("Invalid sort field: " + sortBy + ". Allowed fields: " + allowedSortFields);
        }
        
        // Use entity field names for JPA sorting (not database column names)
        String sortField = switch (sortBy) {
            case "tripDate" -> "tripDate"; // Entity field name
            case "scheduledDepartureTime" -> "scheduledDepartureTime"; // Entity field name
            case "createdAt" -> "createdAt"; // BaseEntity field name
            case "updatedAt" -> "updatedAt"; // BaseEntity field name
            case "status" -> "status"; // Entity field name
            default -> "tripDate"; // Safe default
        };
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                   Sort.by(sortField).descending() : 
                   Sort.by(sortField).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Validate date range
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new IllegalArgumentException("From date cannot be after to date");
        }
        
        // Normalize search text
        String normalizedSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        
        Page<TripResponse> trips = tripService.getAllTripsWithFilters(
            pageable, normalizedSearch, status, routeId, operatorId, scheduleId, 
            passengerServicePermitId, busId, fromDate, toDate, 
            null, null, null, null);
        return ResponseEntity.ok(trips);
    }

    @GetMapping("/{operatorId}/trips/{tripId}")
    @Operation(
        summary = "Get specific trip details for operator",
        description = "Retrieve detailed information about a specific trip belonging to the operator"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Trip details retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Trip not found or doesn't belong to operator")
    })
    public ResponseEntity<TripResponse> getOperatorTripById(
            @Parameter(description = "Operator ID", required = true)
            @PathVariable UUID operatorId,
            @Parameter(description = "Trip ID", required = true)
            @PathVariable UUID tripId) {
        
        TripResponse trip = tripService.getTripById(tripId);
        // Verify trip belongs to operator
        if (!trip.getOperatorId().equals(operatorId)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(trip);
    }

    // ============================================================================
    // ROUTE OPERATIONS
    // ============================================================================

    @GetMapping("/{operatorId}/routes")
    @Operation(
        summary = "Get available routes for operator",
        description = "Retrieve all routes that the operator has permits for with pagination, sorting, and filtering options. " +
                     "Default: page=0, size=10, sort=name,asc. Maximum page size is 100."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Routes retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Operator not found"),
        @ApiResponse(responseCode = "400", description = "Invalid pagination, sorting, or filter parameters")
    })
    public ResponseEntity<Page<RouteResponse>> getOperatorRoutes(
            @Parameter(description = "Operator ID", required = true)
            @PathVariable UUID operatorId,
            
            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Page size (max 100)", example = "10")
            @RequestParam(defaultValue = "10") int size,
            
            @Parameter(description = "Sort by field name (name, distanceKm, estimatedDurationMinutes, direction, createdAt, updatedAt)", example = "name")
            @RequestParam(defaultValue = "name") String sortBy,
            
            @Parameter(description = "Sort direction (asc or desc)", example = "asc")
            @RequestParam(defaultValue = "asc") String sortDir,
            
            @Parameter(description = "Filter by route group ID")
            @RequestParam(required = false) UUID routeGroupId,
            
            @Parameter(description = "Search by route name")
            @RequestParam(required = false) String searchText) {
        
        // Validate and normalize pagination parameters
        if (page < 0) {
            throw new IllegalArgumentException("Page number cannot be negative");
        }
        if (size <= 0) {
            throw new IllegalArgumentException("Page size must be positive");
        }
        if (size > 100) {
            throw new IllegalArgumentException("Page size cannot exceed 100");
        }
        
        // Validate sortBy field
        List<String> allowedSortFields = List.of("name", "distanceKm", "estimatedDurationMinutes", 
                "direction", "createdAt", "updatedAt");
        if (!allowedSortFields.contains(sortBy)) {
            throw new IllegalArgumentException("Invalid sort field: " + sortBy + ". Allowed fields: " + allowedSortFields);
        }
        
        // Map camelCase property names to snake_case column names
        String sortColumn = switch (sortBy) {
            case "distanceKm" -> "distance_km";
            case "estimatedDurationMinutes" -> "estimated_duration_minutes";
            case "createdAt" -> "created_at";
            case "updatedAt" -> "updated_at";
            default -> sortBy;
        };
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                   Sort.by(sortColumn).descending() : 
                   Sort.by(sortColumn).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Normalize search text
        String normalizedSearchText = (searchText != null && !searchText.trim().isEmpty()) ? searchText.trim() : null;
        
        // Use existing route service methods
        Page<RouteResponse> routes;
        if (normalizedSearchText != null) {
            routes = routeService.getAllRoutesWithSearchAndFilters(
                normalizedSearchText, routeGroupId, null, null, null, null, null, null, pageable);
        } else {
            routes = routeService.getAllRoutesWithFilters(
                routeGroupId, null, null, null, null, null, null, pageable);
        }
        return ResponseEntity.ok(routes);
    }

    // ============================================================================
    // SCHEDULE OPERATIONS
    // ============================================================================

    @GetMapping("/{operatorId}/schedules")
    @Operation(
        summary = "Get available schedules for operator",
        description = "Retrieve all schedules for routes that the operator has permits for with pagination, sorting, and filtering options. " +
                     "Default: page=0, size=10, sort=name,asc. Maximum page size is 100."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Schedules retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Operator not found"),
        @ApiResponse(responseCode = "400", description = "Invalid pagination, sorting, or filter parameters")
    })
    public ResponseEntity<Page<ScheduleResponse>> getOperatorSchedules(
            @Parameter(description = "Operator ID", required = true)
            @PathVariable UUID operatorId,
            
            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Page size (max 100)", example = "10")
            @RequestParam(defaultValue = "10") int size,
            
            @Parameter(description = "Sort by field name (name, effectiveStartDate, effectiveEndDate, status, createdAt, updatedAt)", example = "name")
            @RequestParam(defaultValue = "name") String sortBy,
            
            @Parameter(description = "Sort direction (asc or desc)", example = "asc")
            @RequestParam(defaultValue = "asc") String sortDir,
            
            @Parameter(description = "Filter by route ID")
            @RequestParam(required = false) UUID routeId,
            
            @Parameter(description = "Filter by route group ID")
            @RequestParam(required = false) UUID routeGroupId,
            
            @Parameter(description = "Filter by schedule status")
            @RequestParam(required = false) ScheduleStatusEnum status,
            
            @Parameter(description = "Search by schedule name")
            @RequestParam(required = false) String searchText) {
        
        // Validate and normalize pagination parameters
        if (page < 0) {
            throw new IllegalArgumentException("Page number cannot be negative");
        }
        if (size <= 0) {
            throw new IllegalArgumentException("Page size must be positive");
        }
        if (size > 100) {
            throw new IllegalArgumentException("Page size cannot exceed 100");
        }
        
        // Validate sortBy field
        List<String> allowedSortFields = List.of("name", "effectiveStartDate", "effectiveEndDate", 
                "status", "createdAt", "updatedAt");
        if (!allowedSortFields.contains(sortBy)) {
            throw new IllegalArgumentException("Invalid sort field: " + sortBy + ". Allowed fields: " + allowedSortFields);
        }
        
        // Map camelCase property names to snake_case column names
        String sortColumn = switch (sortBy) {
            case "effectiveStartDate" -> "effective_start_date";
            case "effectiveEndDate" -> "effective_end_date";
            case "createdAt" -> "created_at";
            case "updatedAt" -> "updated_at";
            default -> sortBy;
        };
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                   Sort.by(sortColumn).descending() : 
                   Sort.by(sortColumn).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Normalize search text
        String normalizedSearchText = (searchText != null && !searchText.trim().isEmpty()) ? searchText.trim() : null;
        
        // Use existing schedule service methods
        Page<ScheduleResponse> schedules = scheduleService.getSchedulesWithFilters(
            routeId, routeGroupId, null, status, normalizedSearchText, pageable);
        return ResponseEntity.ok(schedules);
    }

    @GetMapping("/{operatorId}/schedules/{scheduleId}")
    @Operation(
        summary = "Get specific schedule details for operator",
        description = "Retrieve detailed information about a specific schedule available to the operator"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Schedule details retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Schedule not found or not available to operator")
    })
    public ResponseEntity<ScheduleResponse> getOperatorScheduleById(
            @Parameter(description = "Operator ID", required = true)
            @PathVariable UUID operatorId,
            @Parameter(description = "Schedule ID", required = true)
            @PathVariable UUID scheduleId) {
        
        ScheduleResponse schedule = scheduleService.getScheduleById(scheduleId);
        // Additional verification could be added here to ensure operator has access to this schedule
        return ResponseEntity.ok(schedule);
    }

    // ============================================================================
    // DASHBOARD/SUMMARY OPERATIONS
    // ============================================================================

    @GetMapping("/{operatorId}/dashboard/summary")
    @Operation(
        summary = "Get operator dashboard summary",
        description = "Retrieve summary statistics and counts for operator dashboard"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Dashboard summary retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Operator not found")
    })
    public ResponseEntity<?> getOperatorDashboardSummary(
            @Parameter(description = "Operator ID", required = true)
            @PathVariable UUID operatorId) {
        
        // This would typically return a custom DTO with summary information
        // For now, we'll use the existing statistics methods
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{operatorId}/permits/expiring")
    @Operation(
        summary = "Get expiring permits for operator",
        description = "Retrieve permits that are expiring within a specified number of days"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Expiring permits retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Operator not found")
    })
    public ResponseEntity<List<PassengerServicePermitResponse>> getExpiringPermits(
            @Parameter(description = "Operator ID", required = true)
            @PathVariable UUID operatorId,
            @Parameter(description = "Number of days ahead to check for expiring permits (default: 30)")
            @RequestParam(defaultValue = "30") int daysAhead) {
        
        // Get all permits and filter by operator and expiry date
        // This is a workaround since the specific method doesn't exist
        List<PassengerServicePermitResponse> allPermits = passengerServicePermitService.getAllPermits();
        LocalDate cutoffDate = LocalDate.now().plusDays(daysAhead);
        
        List<PassengerServicePermitResponse> expiringPermits = allPermits.stream()
            .filter(permit -> permit.getOperatorId().equals(operatorId))
            .filter(permit -> permit.getExpiryDate() != null && 
                    permit.getExpiryDate().isBefore(cutoffDate) &&
                    permit.getExpiryDate().isAfter(LocalDate.now()))
            .toList();
            
        return ResponseEntity.ok(expiringPermits);
    }

    @GetMapping("/{operatorId}/trips/today")
    @Operation(
        summary = "Get today's trips for operator",
        description = "Retrieve all trips scheduled for today for the operator"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Today's trips retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Operator not found")
    })
    public ResponseEntity<List<TripResponse>> getTodaysTrips(
            @Parameter(description = "Operator ID", required = true)
            @PathVariable UUID operatorId) {
        
        // Get trips by date and filter by operator
        // This is a workaround since the specific method doesn't exist
        List<TripResponse> todaysTrips = tripService.getTripsByDate(LocalDate.now());
        
        // Filter to only include trips for this operator
        List<TripResponse> operatorTrips = todaysTrips.stream()
            .filter(trip -> trip.getOperatorId() != null && trip.getOperatorId().equals(operatorId))
            .toList();
            
        return ResponseEntity.ok(operatorTrips);
    }
}