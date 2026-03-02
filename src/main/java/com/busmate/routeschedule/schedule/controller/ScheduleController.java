package com.busmate.routeschedule.schedule.controller;

import com.busmate.routeschedule.schedule.dto.request.ScheduleRequest;
import com.busmate.routeschedule.schedule.dto.request.ScheduleCalendarRequest;
import com.busmate.routeschedule.schedule.dto.request.ScheduleExceptionRequest;
import com.busmate.routeschedule.schedule.dto.request.ScheduleCsvImportRequest;
import com.busmate.routeschedule.schedule.dto.response.ScheduleResponse;
import com.busmate.routeschedule.trip.dto.response.TripResponse;
import com.busmate.routeschedule.schedule.dto.response.ScheduleCsvImportResponse;
import com.busmate.routeschedule.schedule.enums.ScheduleTypeEnum;
import com.busmate.routeschedule.schedule.enums.ScheduleStatusEnum;
import com.busmate.routeschedule.schedule.service.ScheduleService;
import com.busmate.routeschedule.trip.service.TripService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.busmate.routeschedule.route.entity.Route;
import com.busmate.routeschedule.schedule.entity.Schedule;
import com.busmate.routeschedule.stop.entity.Stop;

@Slf4j
@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
@Tag(name = "03. Schedule Management", description = "APIs for managing bus schedules")
public class ScheduleController {
    private final ScheduleService scheduleService;
    private final TripService tripService;

    // ========== CORE SCHEDULE OPERATIONS ==========

    @PostMapping
    @Operation(
        summary = "Create a basic schedule",
        description = """
            Creates a new schedule with basic information only (name, route, dates, type).
            
            **Use this endpoint when:**
            - You want to create a schedule first and configure stops/calendar/exceptions later
            - You're implementing a multi-step schedule creation workflow
            - You only have basic schedule information available
            
            **What this API does:**
            - Creates a schedule entity with basic information
            - Does NOT create schedule stops, calendar, or exceptions
            - Returns the created schedule with empty lists for stops/calendar/exceptions
            - Optionally generates trips if 'generateTrips' is true (requires calendar to be set later)
            
            **Required fields:** name, routeId, scheduleType, effectiveStartDate
            **Optional fields:** effectiveEndDate, status, description, generateTrips
            **Ignored fields:** scheduleStops, calendar, exceptions (these will be ignored if provided)
            
            **Schedule Types:**
            - REGULAR: Normal daily service
            - SPECIAL: Special event or temporary service
            
            **Schedule Status:**
            - PENDING: Schedule created but not active
            - ACTIVE: Schedule is operational
            - INACTIVE: Schedule temporarily disabled  
            - CANCELLED: Schedule permanently cancelled
            """,
        operationId = "createSchedule"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Schedule created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input data - check required fields and data formats"),
        @ApiResponse(responseCode = "404", description = "Route not found with the provided routeId"),
        @ApiResponse(responseCode = "409", description = "Schedule name already exists for this route"),
        @ApiResponse(responseCode = "401", description = "Unauthorized - valid authentication required")
    })
    public ResponseEntity<ScheduleResponse> createSchedule(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "Complete with basic schedule information",
                required = true
            )
            @Valid @RequestBody ScheduleRequest request, 
            Authentication authentication) {
        try {
            String userId = authentication.getName();
            ScheduleResponse response = scheduleService.createSchedule(request, userId);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("Error creating schedule: {}", e.getMessage(), e);
            throw e;
        }
    }

    @PostMapping("/full")
    @Operation(
        summary = "Create a complete schedule with all components",
        description = """
            Creates a new schedule with all components (stops, calendar, exceptions) in a single transaction.
            
            **Use this endpoint when:**
            - You have all schedule information available at once
            - You want to create a fully operational schedule immediately
            - You prefer atomic operations (all-or-nothing approach)
            
            **What this API does:**
            - Creates the schedule with basic information
            - Creates all schedule stops with arrival/departure times
            - Creates the calendar (which days of week the schedule operates)
            - Creates any schedule exceptions (added/removed dates)
            - Returns the complete schedule with all components populated
            - Optionally generates trips if 'generateTrips' is true
            
            **Required fields:** name, routeId, scheduleType, effectiveStartDate
            **Optional but recommended:** scheduleStops, calendar, exceptions
            **Stops ordering:** Must be in correct sequence (stopOrder: 0, 1, 2, ...)
            
            **Calendar rules:**
            - At least one day must be true for trip generation
            - Days set to true indicate when the schedule operates
            
            **Exception types:**
            - ADDED: Service runs on this date even if calendar says no
            - REMOVED: Service doesn't run on this date even if calendar says yes
            """,
        operationId = "createScheduleFull"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Complete schedule created successfully with all components"),
        @ApiResponse(responseCode = "400", description = "Invalid input data - check stops order, time formats, or calendar settings"),
        @ApiResponse(responseCode = "404", description = "Route or stop not found with provided IDs"),
        @ApiResponse(responseCode = "409", description = "Schedule name already exists for this route"),
        @ApiResponse(responseCode = "401", description = "Unauthorized - valid authentication required")
    })
    public ResponseEntity<ScheduleResponse> createScheduleFull(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "Complete schedule information with all components",
                required = true
            )
            @Valid @RequestBody ScheduleRequest request, 
            Authentication authentication) {
        try {
            String userId = authentication.getName();
            ScheduleResponse response = scheduleService.createScheduleFull(request, userId);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("Error creating full schedule: {}", e.getMessage(), e);
            throw e;
        }
    }

    @PostMapping("/bulk")
    @Operation(
        summary = "Create multiple schedules",
        description = "Creates multiple schedules in a single operation. Useful for bulk imports.",
        operationId = "createBulkSchedules"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Schedules created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<List<ScheduleResponse>> createBulkSchedules(
            @Valid @RequestBody List<ScheduleRequest> requests, 
            Authentication authentication) {
        String userId = authentication.getName();
        List<ScheduleResponse> responses = scheduleService.createBulkSchedules(requests, userId);
        return new ResponseEntity<>(responses, HttpStatus.CREATED);
    }

    // ========== READ OPERATIONS ==========

    @GetMapping("/{id}")
    @Operation(
        summary = "Get schedule by ID",
        description = "Retrieve a specific schedule with all its details including stops, calendar, and exceptions.",
        operationId = "getScheduleById"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Schedule found and retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Schedule not found"),
        @ApiResponse(responseCode = "400", description = "Invalid UUID format")
    })
    public ResponseEntity<ScheduleResponse> getScheduleById(
            @Parameter(description = "Schedule ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id) {
        ScheduleResponse response = scheduleService.getScheduleById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(
        summary = "Get schedules with filtering, search, and pagination",
        description = "Retrieve schedules with optional filtering by route, route group, type, status, and search. " +
                     "Search is performed across schedule name, description, and route name. " +
                     "Default: page=0, size=10, sort=name",
        operationId = "getSchedules"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Schedules retrieved successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid pagination or filtering parameters")
    })
    public ResponseEntity<Page<ScheduleResponse>> getSchedules(
            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Page size (max 100)", example = "10")
            @RequestParam(defaultValue = "10") int size,
            
            @Parameter(description = "Sort by field name (name, createdAt, updatedAt, effectiveStartDate)", example = "name")
            @RequestParam(defaultValue = "name") String sortBy,
            
            @Parameter(description = "Sort direction (asc or desc)", example = "asc")
            @RequestParam(defaultValue = "asc") String sortDir,
            
            @Parameter(description = "Filter by specific route ID")
            @RequestParam(required = false) UUID routeId,
            
            @Parameter(description = "Filter by route group ID")
            @RequestParam(required = false) UUID routeGroupId,
            
            @Parameter(description = "Filter by schedule type (REGULAR or SPECIAL)")
            @RequestParam(required = false) ScheduleTypeEnum scheduleType,
            
            @Parameter(description = "Filter by status (ACTIVE or INACTIVE)")
            @RequestParam(required = false) ScheduleStatusEnum status, // Changed type
            
            @Parameter(description = "Search text to filter schedules by name, description, or route name")
            @RequestParam(required = false) String search) {
        
        // Validate page size
        if (size > 100) {
            size = 100;
        }
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                   Sort.by(sortBy).descending() : 
                   Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<ScheduleResponse> responses = scheduleService.getSchedulesWithFilters(
                routeId, routeGroupId, scheduleType, status, search, pageable);
        
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/all")
    @Operation(
        summary = "Get all schedules without pagination",
        description = "Retrieve all schedules as a simple list. Use carefully as it returns all schedules at once.",
        operationId = "getAllSchedules"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "All schedules retrieved successfully")
    })
    public ResponseEntity<List<ScheduleResponse>> getAllSchedules() {
        List<ScheduleResponse> responses = scheduleService.getAllSchedules();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/by-route/{routeId}")
    @Operation(
        summary = "Get schedules by route ID",
        description = "Retrieve all schedules for a specific route with optional status filtering.",
        operationId = "getSchedulesByRoute"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Schedules retrieved successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid UUID format")
    })
    public ResponseEntity<Page<ScheduleResponse>> getSchedulesByRoute(
            @Parameter(description = "Route ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID routeId,
            
            @Parameter(description = "Filter by status (ACTIVE or INACTIVE)")
            @RequestParam(required = false) ScheduleStatusEnum status, // Changed type
            
            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Page size (max 100)", example = "10")
            @RequestParam(defaultValue = "10") int size,
            
            @Parameter(description = "Sort by field name", example = "name")
            @RequestParam(defaultValue = "name") String sortBy,
            
            @Parameter(description = "Sort direction (asc or desc)", example = "asc")
            @RequestParam(defaultValue = "asc") String sortDir) {
        
        if (size > 100) {
            size = 100;
        }
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                   Sort.by(sortBy).descending() : 
                   Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<ScheduleResponse> responses = scheduleService.getSchedulesByRoute(routeId, status, pageable);
        return ResponseEntity.ok(responses);
    }

    // ========== UPDATE OPERATIONS ==========

    @PutMapping("/{id}")
    @Operation(
        summary = "Update schedule (basic)",
        description = "Update basic schedule information only.",
        operationId = "updateSchedule"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Schedule updated successfully"),
        @ApiResponse(responseCode = "404", description = "Schedule not found"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "409", description = "Schedule name already exists"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<ScheduleResponse> updateSchedule(
            @Parameter(description = "Schedule ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id, 
            @Valid @RequestBody ScheduleRequest request, 
            Authentication authentication) {
        String userId = authentication.getName();
        ScheduleResponse response = scheduleService.updateSchedule(id, request, userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/full")
    @Operation(
        summary = "Update complete schedule",
        description = "Update schedule with all components including stops, calendar, and exceptions.",
        operationId = "updateScheduleFull"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Complete schedule updated successfully"),
        @ApiResponse(responseCode = "404", description = "Schedule not found"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<ScheduleResponse> updateScheduleFull(
            @Parameter(description = "Schedule ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id, 
            @Valid @RequestBody ScheduleRequest request, 
            Authentication authentication) {
        String userId = authentication.getName();
        ScheduleResponse response = scheduleService.updateScheduleFull(id, request, userId);
        return ResponseEntity.ok(response);
    }

    // ========== STATUS MANAGEMENT ==========

    @PutMapping("/{id}/status")
    @Operation(
        summary = "Update schedule status",
        description = "Change the status of a schedule (ACTIVE/INACTIVE).",
        operationId = "updateScheduleStatus"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Schedule status updated successfully"),
        @ApiResponse(responseCode = "404", description = "Schedule not found"),
        @ApiResponse(responseCode = "400", description = "Invalid status"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<ScheduleResponse> updateScheduleStatus(
            @Parameter(description = "Schedule ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id,
            @Parameter(description = "New status", example = "ACTIVE")
            @RequestParam ScheduleStatusEnum status, // Changed type
            Authentication authentication) {
        String userId = authentication.getName();
        ScheduleResponse response = scheduleService.updateScheduleStatus(id, status, userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/activate")
    @Operation(
        summary = "Activate schedule",
        description = "Set schedule status to ACTIVE.",
        operationId = "activateSchedule"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Schedule activated successfully"),
        @ApiResponse(responseCode = "404", description = "Schedule not found"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<ScheduleResponse> activateSchedule(
            @Parameter(description = "Schedule ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id,
            Authentication authentication) {
        String userId = authentication.getName();
        ScheduleResponse response = scheduleService.activateSchedule(id, userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/deactivate")
    @Operation(
        summary = "Deactivate schedule",
        description = "Set schedule status to INACTIVE (temporarily disable).",
        operationId = "deactivateSchedule"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Schedule deactivated successfully"),
        @ApiResponse(responseCode = "404", description = "Schedule not found"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<ScheduleResponse> deactivateSchedule(
            @Parameter(description = "Schedule ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id,
            Authentication authentication) {
        String userId = authentication.getName();
        ScheduleResponse response = scheduleService.deactivateSchedule(id, userId);
        return ResponseEntity.ok(response);
    }

    // ========== CALENDAR MANAGEMENT ==========

    @PutMapping("/{id}/calendar")
    @Operation(
        summary = "Update schedule calendar",
        description = "Update the operating days for a schedule (which days of the week it runs).",
        operationId = "updateScheduleCalendar"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Schedule calendar updated successfully"),
        @ApiResponse(responseCode = "404", description = "Schedule not found"),
        @ApiResponse(responseCode = "400", description = "Invalid calendar data"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<ScheduleResponse> updateScheduleCalendar(
            @Parameter(description = "Schedule ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id,
            @Valid @RequestBody ScheduleCalendarRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        ScheduleResponse response = scheduleService.updateScheduleCalendar(id, request, userId);
        return ResponseEntity.ok(response);
    }

    // ========== EXCEPTION MANAGEMENT ==========

    @PostMapping("/{id}/exceptions")
    @Operation(
        summary = "Add schedule exception",
        description = "Add a date exception (holiday adjustment) to a schedule.",
        operationId = "addScheduleException"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Schedule exception added successfully"),
        @ApiResponse(responseCode = "404", description = "Schedule not found"),
        @ApiResponse(responseCode = "400", description = "Invalid exception data"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<ScheduleResponse> addScheduleException(
            @Parameter(description = "Schedule ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id,
            @Valid @RequestBody ScheduleExceptionRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        ScheduleResponse response = scheduleService.addScheduleException(id, request, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/exceptions/{exceptionId}")
    @Operation(
        summary = "Remove schedule exception",
        description = "Remove a specific exception from a schedule.",
        operationId = "removeScheduleException"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Schedule exception removed successfully"),
        @ApiResponse(responseCode = "404", description = "Schedule or exception not found"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<ScheduleResponse> removeScheduleException(
            @Parameter(description = "Schedule ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id,
            @Parameter(description = "Exception ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID exceptionId,
            Authentication authentication) {
        String userId = authentication.getName();
        ScheduleResponse response = scheduleService.removeScheduleException(id, exceptionId, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/exceptions")
    @Operation(
        summary = "Get schedule exceptions",
        description = "Retrieve all exceptions for a specific schedule.",
        operationId = "getScheduleExceptions"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Schedule exceptions retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Schedule not found")
    })
    public ResponseEntity<List<ScheduleResponse.ScheduleExceptionResponse>> getScheduleExceptions(
            @Parameter(description = "Schedule ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id) {
        List<ScheduleResponse.ScheduleExceptionResponse> responses = scheduleService.getScheduleExceptions(id);
        return ResponseEntity.ok(responses);
    }

    // ========== CLONE FUNCTIONALITY ==========

    @PostMapping("/{id}/clone")
    @Operation(
        summary = "Clone an existing schedule",
        description = "Create a copy of an existing schedule with modifications. " +
                     "Useful for creating similar schedules with slight changes (e.g., weekend version of weekday schedule).",
        operationId = "cloneSchedule"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Schedule cloned successfully"),
        @ApiResponse(responseCode = "404", description = "Source schedule not found"),
        @ApiResponse(responseCode = "400", description = "Invalid clone data"),
        @ApiResponse(responseCode = "409", description = "Schedule name already exists"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<ScheduleResponse> cloneSchedule(
            @Parameter(description = "Source Schedule ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id,
            @Valid @RequestBody ScheduleRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        ScheduleResponse response = scheduleService.cloneSchedule(id, request, userId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // ========== CSV IMPORT OPERATIONS ==========

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
        summary = "Import schedules from CSV file",
        description = """
            Import multiple schedules with their associated stops from a CSV file.
            
            **CSV Format:**
            Each row represents one stop within a schedule. Rows with the same schedule_name + route_id + effective_start_date
            are grouped together to create a single schedule with multiple stops.
            
            **Required Columns:**
            - schedule_name: Name of the schedule
            - route_id: UUID of the route this schedule belongs to
            - effective_start_date: Date when schedule becomes effective (YYYY-MM-DD)
            - route_stop_id: UUID of the route stop (from route_stop table)
            - stop_order: Order of the stop in the schedule
            
            **Optional Columns:**
            - schedule_type: REGULAR or SPECIAL (defaults to REGULAR)
            - effective_end_date: End date (YYYY-MM-DD)
            - status: PENDING, ACTIVE, INACTIVE, CANCELLED (defaults to ACTIVE)
            - description: Schedule description
            - arrival_time: Stop arrival time (HH:mm:ss)
            - departure_time: Stop departure time (HH:mm:ss)
            
            **Duplicate Handling Strategies:**
            - SKIP: Skip schedule if it already exists
            - UPDATE: Update existing schedule with new data
            - CREATE_WITH_SUFFIX: Create new schedule with suffix to avoid duplicate
            """,
        operationId = "importSchedulesFromCsv"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Import completed (check response for success/failure details)"),
        @ApiResponse(responseCode = "400", description = "Invalid file format or data"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<ScheduleCsvImportResponse> importSchedulesFromCsv(
            @Parameter(description = "CSV file containing schedule data", required = true)
            @RequestParam("file") MultipartFile file,
            
            @Parameter(description = "Strategy for handling duplicate schedules", 
                      schema = @io.swagger.v3.oas.annotations.media.Schema(
                          allowableValues = {"SKIP", "UPDATE", "CREATE_WITH_SUFFIX"},
                          defaultValue = "SKIP"
                      ))
            @RequestParam(value = "scheduleDuplicateStrategy", defaultValue = "SKIP") 
            ScheduleCsvImportRequest.ScheduleDuplicateStrategy scheduleDuplicateStrategy,
            
            @Parameter(description = "Strategy for handling duplicate schedule stops",
                      schema = @io.swagger.v3.oas.annotations.media.Schema(
                          allowableValues = {"SKIP", "UPDATE"},
                          defaultValue = "UPDATE"
                      ))
            @RequestParam(value = "scheduleStopDuplicateStrategy", defaultValue = "UPDATE") 
            ScheduleCsvImportRequest.ScheduleStopDuplicateStrategy scheduleStopDuplicateStrategy,
            
            @Parameter(description = "Validate that route_id exists in the system")
            @RequestParam(value = "validateRouteExists", defaultValue = "true") Boolean validateRouteExists,
            
            @Parameter(description = "Validate that route_stop_id exists and belongs to the route")
            @RequestParam(value = "validateRouteStopExists", defaultValue = "true") Boolean validateRouteStopExists,
            
            @Parameter(description = "Continue processing remaining rows when encountering errors")
            @RequestParam(value = "continueOnError", defaultValue = "true") Boolean continueOnError,
            
            @Parameter(description = "Allow partial schedule creation when some stops fail")
            @RequestParam(value = "allowPartialStops", defaultValue = "true") Boolean allowPartialStops,
            
            @Parameter(description = "Generate trips automatically for imported schedules")
            @RequestParam(value = "generateTrips", defaultValue = "false") Boolean generateTrips,
            
            @Parameter(description = "Default status for schedules without status specified",
                      schema = @io.swagger.v3.oas.annotations.media.Schema(
                          allowableValues = {"PENDING", "ACTIVE", "INACTIVE", "CANCELLED"},
                          defaultValue = "ACTIVE"
                      ))
            @RequestParam(value = "defaultStatus", defaultValue = "ACTIVE") String defaultStatus,
            
            @Parameter(description = "Default schedule type when not specified in CSV",
                      schema = @io.swagger.v3.oas.annotations.media.Schema(
                          allowableValues = {"REGULAR", "SPECIAL"},
                          defaultValue = "REGULAR"
                      ))
            @RequestParam(value = "defaultScheduleType", defaultValue = "REGULAR") String defaultScheduleType,
            
            @Parameter(description = "Validate arrival time is before or equal to departure time")
            @RequestParam(value = "validateTimeSequence", defaultValue = "true") Boolean validateTimeSequence,
            
            @Parameter(description = "Validate stop order sequence within each schedule")
            @RequestParam(value = "validateStopOrder", defaultValue = "true") Boolean validateStopOrder,
            
            Authentication authentication) {
        
        String userId = authentication.getName();
        
        // Build options from request parameters
        ScheduleCsvImportRequest options = new ScheduleCsvImportRequest();
        options.setScheduleDuplicateStrategy(scheduleDuplicateStrategy);
        options.setScheduleStopDuplicateStrategy(scheduleStopDuplicateStrategy);
        options.setValidateRouteExists(validateRouteExists);
        options.setValidateRouteStopExists(validateRouteStopExists);
        options.setContinueOnError(continueOnError);
        options.setAllowPartialStops(allowPartialStops);
        options.setGenerateTrips(generateTrips);
        options.setDefaultStatus(defaultStatus);
        options.setDefaultScheduleType(defaultScheduleType);
        options.setValidateTimeSequence(validateTimeSequence);
        options.setValidateStopOrder(validateStopOrder);
        
        ScheduleCsvImportResponse response = scheduleService.importSchedulesFromCsv(file, options, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping(value = "/import/template", produces = "text/csv")
    @Operation(
        summary = "Download CSV import template",
        description = """
            Download a sample CSV template for schedule import.
            
            The template includes:
            - All required and optional column headers
            - Example rows showing how to format data
            - Multiple schedules with multiple stops each
            
            **Column Descriptions:**
            - schedule_name: Unique name for the schedule within the route
            - route_id: UUID of the route (must exist in system)
            - schedule_type: REGULAR or SPECIAL
            - effective_start_date: Start date (YYYY-MM-DD format)
            - effective_end_date: End date (optional, YYYY-MM-DD format)
            - status: PENDING, ACTIVE, INACTIVE, or CANCELLED
            - description: Optional description text
            - route_stop_id: UUID of the route stop
            - stop_order: Integer order of the stop (1, 2, 3, ...)
            - arrival_time: Time format HH:mm:ss (e.g., 08:30:00)
            - departure_time: Time format HH:mm:ss (e.g., 08:35:00)
            """,
        operationId = "getScheduleImportTemplate"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Template downloaded successfully")
    })
    public ResponseEntity<byte[]> getScheduleImportTemplate() {
        byte[] template = scheduleService.getScheduleImportTemplate();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "schedule_import_template.csv");
        headers.setContentLength(template.length);
        
        return new ResponseEntity<>(template, headers, HttpStatus.OK);
    }

    // ========== DELETE OPERATION ==========

    @DeleteMapping("/{id}")
    @Operation(
        summary = "Delete a schedule",
        description = "Permanently delete a schedule. This action cannot be undone.",
        operationId = "deleteSchedule"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Schedule deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Schedule not found"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Void> deleteSchedule(
            @Parameter(description = "Schedule ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id) {
        scheduleService.deleteSchedule(id);
        return ResponseEntity.noContent().build();
    }

    // ========== FILTER OPTIONS ==========

    @GetMapping("/filter-options/schedule-types")
    @Operation(
        summary = "Get distinct schedule types",
        description = "Retrieve all distinct schedule types for filter dropdown options.",
        operationId = "getDistinctScheduleTypes"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Distinct schedule types retrieved successfully")
    })
    public ResponseEntity<List<ScheduleTypeEnum>> getDistinctScheduleTypes() {
        List<ScheduleTypeEnum> scheduleTypes = scheduleService.getDistinctScheduleTypes();
        return ResponseEntity.ok(scheduleTypes);
    }

    @GetMapping("/filter-options/statuses")
    @Operation(
        summary = "Get distinct statuses",
        description = "Retrieve all distinct statuses for filter dropdown options.",
        operationId = "getDistinctStatuses"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Distinct statuses retrieved successfully")
    })
    public ResponseEntity<List<ScheduleStatusEnum>> getDistinctStatuses() { // Changed return type
        List<ScheduleStatusEnum> statuses = scheduleService.getDistinctStatuses();
        return ResponseEntity.ok(statuses);
    }

    // ========== STATISTICS ==========

    @GetMapping("/statistics")
    @Operation(
        summary = "Get schedule statistics",
        description = "Retrieve statistical information about schedules (counts by type, status, etc.).",
        operationId = "getScheduleStatistics"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Schedule statistics retrieved successfully")
    })
    public ResponseEntity<Map<String, Object>> getScheduleStatistics() {
        Map<String, Object> statistics = scheduleService.getScheduleStatistics();
        return ResponseEntity.ok(statistics);
    }

    // ========== TRIP GENERATION ==========

    @PostMapping("/{id}/generate-trips")
    @Operation(
        summary = "Generate trips for schedule",
        description = "Generate trips for the specified schedule within a date range. " +
                     "If no date range is provided, trips will be generated for the entire schedule validity period.",
        operationId = "generateTripsForSchedule"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Trips generated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid date range or schedule configuration"),
        @ApiResponse(responseCode = "404", description = "Schedule not found"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<List<TripResponse>> generateTripsForSchedule(
            @PathVariable UUID id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            Authentication authentication) {
        try {
            String userId = authentication.getName();
            
            // If no dates provided, use schedule's validity period
            if (fromDate == null || toDate == null) {
                ScheduleResponse schedule = scheduleService.getScheduleById(id);
                fromDate = fromDate != null ? fromDate : schedule.getEffectiveStartDate();
                toDate = toDate != null ? toDate : schedule.getEffectiveEndDate();
            }
            
            List<TripResponse> responses = tripService.generateTripsForSchedule(id, fromDate, toDate, userId);
            return new ResponseEntity<>(responses, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("Error generating trips for schedule {}: {}", id, e.getMessage(), e);
            throw e;
        }
    }
}