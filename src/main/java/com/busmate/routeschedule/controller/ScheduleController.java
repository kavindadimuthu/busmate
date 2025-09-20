package com.busmate.routeschedule.controller;

import com.busmate.routeschedule.dto.request.ScheduleRequest;
import com.busmate.routeschedule.dto.request.ScheduleCalendarRequest;
import com.busmate.routeschedule.dto.request.ScheduleExceptionRequest;
import com.busmate.routeschedule.dto.response.ScheduleResponse;
import com.busmate.routeschedule.dto.response.TripResponse;
import com.busmate.routeschedule.enums.ScheduleTypeEnum;
import com.busmate.routeschedule.enums.ScheduleStatusEnum; // Changed import
import com.busmate.routeschedule.service.ScheduleService;
import com.busmate.routeschedule.service.TripService;
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
        summary = "Create a new schedule (basic)",
        description = "Creates a new schedule with basic information only. " +
                     "Use this for creating a schedule that will be configured later with stops, calendar, and exceptions.",
        operationId = "createSchedule"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Schedule created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "409", description = "Schedule name already exists for this route"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<ScheduleResponse> createSchedule(
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
        description = "Creates a new schedule with stops, calendar, and exceptions in one transaction. " +
                     "This is the recommended endpoint for creating fully configured schedules.",
        operationId = "createScheduleFull"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Complete schedule created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "409", description = "Schedule name already exists for this route"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<ScheduleResponse> createScheduleFull(
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

    // ========== BULK OPERATIONS ==========

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
        summary = "Import schedules from file",
        description = "Import multiple schedules from a CSV or Excel file. " +
                     "The file should contain schedule metadata, calendar settings, and stop timings.",
        operationId = "importSchedules"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Schedules imported successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid file format or data"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<List<ScheduleResponse>> importSchedules(
            @Parameter(description = "CSV or Excel file containing schedule data")
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        String userId = authentication.getName();
        List<ScheduleResponse> responses = scheduleService.importSchedules(file, userId);
        return new ResponseEntity<>(responses, HttpStatus.CREATED);
    }

    @PostMapping(value = "/validate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
        summary = "Validate schedule import file",
        description = "Validate a schedule import file without actually importing the data. " +
                     "Returns validation errors and warnings.",
        operationId = "validateScheduleImport"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "File validation completed"),
        @ApiResponse(responseCode = "400", description = "Invalid file format")
    })
    public ResponseEntity<List<Map<String, Object>>> validateScheduleImport(
            @Parameter(description = "CSV or Excel file to validate")
            @RequestParam("file") MultipartFile file) {
        List<Map<String, Object>> validationResults = scheduleService.validateScheduleImport(file);
        return ResponseEntity.ok(validationResults);
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