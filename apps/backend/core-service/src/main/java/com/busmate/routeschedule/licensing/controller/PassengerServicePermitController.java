package com.busmate.routeschedule.licensing.controller;

import com.busmate.routeschedule.licensing.dto.request.PassengerServicePermitRequest;
import com.busmate.routeschedule.licensing.dto.response.PassengerServicePermitResponse;
import com.busmate.routeschedule.licensing.dto.response.PassengerServicePermitFilterOptionsResponse;
import com.busmate.routeschedule.licensing.dto.response.PassengerServicePermitStatisticsResponse;
import com.busmate.routeschedule.licensing.dto.response.PassengerServicePermitImportResponse;
import com.busmate.routeschedule.shared.dto.PaginatedResponse;
import com.busmate.routeschedule.licensing.service.PassengerServicePermitService;
import com.busmate.routeschedule.licensing.service.PermitBusLinks;
import com.busmate.routeschedule.licensing.dto.request.StatusReasonRequest;
import com.busmate.routeschedule.licensing.dto.response.BusPassengerServicePermitAssignmentResponse;
import com.busmate.routeschedule.licensing.entity.BusPassengerServicePermitAssignment;
import com.busmate.routeschedule.shared.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.UUID;
import com.busmate.routeschedule.network.entity.Route;

@RestController
@PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
@RequestMapping("/api/permits")
@RequiredArgsConstructor
@Tag(name = "06. Permit Management", description = "APIs for managing passenger service permits")
public class PassengerServicePermitController {
    private final PassengerServicePermitService permitService;
    private final PermitBusLinks permitBusLinks;

    @PostMapping
    public ResponseEntity<PassengerServicePermitResponse> createPermit(@Valid @RequestBody PassengerServicePermitRequest request, Authentication authentication) {
        String userId = authentication.getName();
        PassengerServicePermitResponse response = permitService.createPermit(request, userId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get permit by ID", description = "Retrieve a specific passenger service permit by its ID")
    public ResponseEntity<PassengerServicePermitResponse> getPermitById(@PathVariable UUID id) {
        PassengerServicePermitResponse response = permitService.getPermitById(id);
        response.setUpcomingTripCount(permitService.countUpcomingTrips(id));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/all")
    @Operation(summary = "Get all permits", description = "Retrieve all passenger service permits without pagination")
    public ResponseEntity<List<PassengerServicePermitResponse>> getAllPermits() {
        List<PassengerServicePermitResponse> responses = permitService.getAllPermits();
        return ResponseEntity.ok(responses);
    }

    @GetMapping
    @Operation(summary = "Get permits with pagination", description = "Retrieve passenger service permits with pagination, filtering, and sorting options")
    public ResponseEntity<PaginatedResponse<PassengerServicePermitResponse>> getPermits(
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort field") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction (asc/desc)") @RequestParam(defaultValue = "desc") String sortDir,
            @Parameter(description = "Filter by status") @RequestParam(required = false) String status,
            @Parameter(description = "Filter by permit type") @RequestParam(required = false) String permitType,
            @Parameter(description = "Filter by operator name") @RequestParam(required = false) String operatorName,
            @Parameter(description = "Filter by route group name") @RequestParam(required = false) String routeGroupName) {
        
        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        PaginatedResponse<PassengerServicePermitResponse> response = permitService.getPermits(
                pageable, status, permitType, operatorName, routeGroupName);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/route-group/{routeGroupId}")
    @Operation(summary = "Get permits by route group", description = "Retrieve all passenger service permits for a specific route group")
    public ResponseEntity<List<PassengerServicePermitResponse>> getPermitsByRouteGroupId(
            @Parameter(description = "Route group ID") @PathVariable UUID routeGroupId) {
        List<PassengerServicePermitResponse> responses = permitService.getPermitsByRouteGroupId(routeGroupId);
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PassengerServicePermitResponse> updatePermit(@PathVariable UUID id, @Valid @RequestBody PassengerServicePermitRequest request, Authentication authentication) {
        String userId = authentication.getName();
        PassengerServicePermitResponse response = permitService.updatePermit(id, request, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePermit(@PathVariable UUID id) {
        permitService.deletePermit(id);
        return ResponseEntity.noContent().build();
    }

    // ========== ENHANCED PERMIT MANAGEMENT APIs ==========

    // Filter Options API - For frontend dropdowns and search filters
    @GetMapping("/filter-options")
    @Operation(
        summary = "Get available filter options", 
        description = "Retrieve all available filter options for permit management frontend including operators, route groups, statuses, permit types, and sort options.",
        operationId = "getPermitFilterOptions"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Filter options retrieved successfully")
    })
    public ResponseEntity<PassengerServicePermitFilterOptionsResponse> getPermitFilterOptions() {
        PassengerServicePermitFilterOptionsResponse response = permitService.getFilterOptions();
        return ResponseEntity.ok(response);
    }

    // Statistics API - For KPI cards and dashboard
    @GetMapping("/statistics")
    @Operation(
        summary = "Get permit statistics", 
        description = "Retrieve comprehensive permit statistics including total counts, status breakdowns, expiry alerts, and distribution by operators and route groups.",
        operationId = "getPermitStatistics"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Statistics retrieved successfully")
    })
    public ResponseEntity<PassengerServicePermitStatisticsResponse> getPermitStatistics() {
        PassengerServicePermitStatisticsResponse response = permitService.getStatistics();
        return ResponseEntity.ok(response);
    }

    // Import Template API - Download CSV template for bulk import
    @GetMapping("/import-template")
    @Operation(
        summary = "Download CSV import template", 
        description = "Download a CSV template file with sample data for bulk permit import. The template includes all required columns and example values.",
        operationId = "getPermitImportTemplate"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Template downloaded successfully")
    })
    public ResponseEntity<byte[]> getPermitImportTemplate() {
        byte[] template = permitService.getImportTemplate();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "permit-import-template.csv");
        headers.setContentLength(template.length);
        
        return new ResponseEntity<>(template, headers, HttpStatus.OK);
    }

    // Bulk Import API - Import permits from CSV file
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
        summary = "Import permits from CSV file", 
        description = "Bulk import passenger service permits from a CSV file. The file must follow the template format with columns: " +
                     "operatorName, routeGroupName, permitNumber, issueDate, expiryDate, maximumBusAssigned, permitType, status. " +
                     "Returns detailed results including successful imports, failures, and error details.",
        operationId = "importPermitsFromCsv"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Import completed (may include partial failures)"),
        @ApiResponse(responseCode = "400", description = "Invalid file format or empty file"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<PassengerServicePermitImportResponse> importPermitsFromCsv(
            @Parameter(description = "CSV file containing permit data") 
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        String userId = authentication.getName();
        PassengerServicePermitImportResponse response = permitService.importPermitsFromCsv(file, userId);
        return ResponseEntity.ok(response);
    }

    // ============================================================================
    // INC-017: MOT suspension, withdrawal and bus links
    // ============================================================================

    @PostMapping("/{id}/suspend")
    @Operation(summary = "Suspend a permit (MOT)", description = "The permit stops authorising new trip assignments until reinstated.")
    public ResponseEntity<PassengerServicePermitResponse> suspendPermit(
            @PathVariable UUID id, @Valid @RequestBody StatusReasonRequest request, Authentication authentication) {
        return ResponseEntity.ok(permitService.suspendPermit(id, request.getReason(), authentication.getName()));
    }

    @PostMapping("/{id}/reinstate")
    @Operation(summary = "Reinstate a suspended or withdrawn permit (MOT)")
    public ResponseEntity<PassengerServicePermitResponse> reinstatePermit(@PathVariable UUID id, Authentication authentication) {
        return ResponseEntity.ok(permitService.reinstatePermit(id, authentication.getName()));
    }

    @PostMapping("/{id}/withdraw")
    @Operation(summary = "Withdraw a permit (MOT); ends its bus links")
    public ResponseEntity<PassengerServicePermitResponse> withdrawPermit(
            @PathVariable UUID id, @Valid @RequestBody StatusReasonRequest request, Authentication authentication) {
        return ResponseEntity.ok(permitService.withdrawPermit(null, id, request.getReason(), authentication.getName()));
    }

    @GetMapping("/{id}/buses")
    @Operation(summary = "Buses linked to a permit, current and past")
    public ResponseEntity<List<BusPassengerServicePermitAssignmentResponse>> getPermitBuses(@PathVariable UUID id) {
        permitService.getPermitById(id);
        return ResponseEntity.ok(permitBusLinks.forPermit(id));
    }

    @PostMapping("/{id}/buses/{linkId}/end")
    @Operation(summary = "End a bus's link to a permit (MOT)")
    public ResponseEntity<Void> endPermitBusLink(@PathVariable UUID id, @PathVariable UUID linkId, Authentication authentication) {
        BusPassengerServicePermitAssignment link = permitBusLinks.require(linkId);
        if (!link.getPassengerServicePermit().getId().equals(id)) {
            throw new ResourceNotFoundException("Permit link not found with id: " + linkId);
        }
        permitBusLinks.end(link, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
