package com.busmate.routeschedule.controller;

import com.busmate.routeschedule.dto.request.OperatorRequest;
import com.busmate.routeschedule.dto.response.OperatorResponse;
import com.busmate.routeschedule.dto.response.filter.OperatorFilterOptionsResponse;
import com.busmate.routeschedule.dto.response.statistic.OperatorStatisticsResponse;
import com.busmate.routeschedule.dto.response.importing.OperatorImportResponse;
import com.busmate.routeschedule.enums.OperatorTypeEnum;
import com.busmate.routeschedule.enums.StatusEnum;
import com.busmate.routeschedule.service.OperatorService;
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
@RequestMapping("/api/operators")
@RequiredArgsConstructor
@Tag(name = "04. Operator Management", description = "APIs for managing operators")
public class OperatorController {
    private final OperatorService operatorService;

    // 1. CREATE - First operation for logical flow
    @PostMapping
    @Operation(
        summary = "Create a new operator", 
        description = "Creates a new operator with the provided details. Requires authentication.",
        operationId = "createOperator"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Operator created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "409", description = "Operator with same name already exists"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<OperatorResponse> createOperator(
            @Valid @RequestBody OperatorRequest request, 
            Authentication authentication) {
        String userId = authentication.getName();
        OperatorResponse response = operatorService.createOperator(request, userId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // 2. READ ALL - Most commonly used operation with filters
    @GetMapping
    @Operation(
        summary = "Get all operators with pagination, sorting, and filtering", 
        description = "Retrieve all operators with optional pagination, sorting, search, and filtering by operator type and status. " +
                     "Search is performed across operator name and region (case-insensitive). " +
                     "Default: page=0, size=10, sort=name,asc. Maximum page size is 100.",
        operationId = "getAllOperators"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Operators retrieved successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid pagination, sorting, or filter parameters")
    })
    public ResponseEntity<Page<OperatorResponse>> getAllOperators(
            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Page size (max 100)", example = "10")
            @RequestParam(defaultValue = "10") int size,
            
            @Parameter(description = "Sort by field name (name, operatorType, region, status, createdAt, updatedAt)", example = "name")
            @RequestParam(defaultValue = "name") String sortBy,
            
            @Parameter(description = "Sort direction (asc or desc)", example = "asc")
            @RequestParam(defaultValue = "asc") String sortDir,
            
            @Parameter(description = "Search text to filter operators by name or region (case-insensitive)", example = "Western")
            @RequestParam(required = false) String search,
            
            @Parameter(description = "Filter by operator type (PRIVATE, CTB) - case insensitive", example = "PRIVATE")
            @RequestParam(required = false) String operatorType,
            
            @Parameter(description = "Filter by status (pending, active, inactive, cancelled) - case insensitive", example = "active")
            @RequestParam(required = false) String status) {
        
        // Validate and normalize parameters
        if (page < 0) page = 0;
        if (size <= 0) size = 10;
        if (size > 100) size = 100;
        
        // Validate sortBy field
        List<String> allowedSortFields = List.of("name", "operatorType", "region", "status", "createdAt", "updatedAt");
        if (!allowedSortFields.contains(sortBy)) {
            return ResponseEntity.badRequest().build();
        }
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                   Sort.by(sortBy).descending() : 
                   Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Parse and validate enum values
        OperatorTypeEnum operatorTypeEnum = null;
        StatusEnum statusEnum = null;
        
        if (operatorType != null && !operatorType.trim().isEmpty()) {
            try {
                operatorTypeEnum = OperatorTypeEnum.valueOf(operatorType.toUpperCase().trim());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        }
        
        if (status != null && !status.trim().isEmpty()) {
            try {
                statusEnum = StatusEnum.valueOf(status.toLowerCase().trim());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        }
        
        // Normalize search text
        String searchText = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        
        // Execute query
        Page<OperatorResponse> responses;
        if (searchText != null || operatorTypeEnum != null || statusEnum != null) {
            responses = operatorService.getAllOperatorsWithFilters(searchText, operatorTypeEnum, statusEnum, pageable);
        } else {
            responses = operatorService.getAllOperators(pageable);
        }
        
        return ResponseEntity.ok(responses);
    }

    // 3. READ ALL WITHOUT PAGINATION - Alternative read operation
    @GetMapping("/all")
    @Operation(
        summary = "Get all operators without pagination", 
        description = "Retrieve all operators as a simple list without pagination. " +
                     "Use this endpoint carefully as it returns all operators at once.",
        operationId = "getAllOperatorsAsList"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "All operators retrieved successfully")
    })
    public ResponseEntity<List<OperatorResponse>> getAllOperatorsAsList() {
        List<OperatorResponse> responses = operatorService.getAllOperators();
        return ResponseEntity.ok(responses);
    }

    // 4. READ BY ID - Specific read operation
    @GetMapping("/{id}")
    @Operation(
        summary = "Get operator by ID", 
        description = "Retrieve a specific operator by its unique identifier.",
        operationId = "getOperatorById"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Operator found and retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Operator not found"),
        @ApiResponse(responseCode = "400", description = "Invalid UUID format")
    })
    public ResponseEntity<OperatorResponse> getOperatorById(
            @Parameter(description = "Operator ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id) {
        OperatorResponse response = operatorService.getOperatorById(id);
        return ResponseEntity.ok(response);
    }

    // 5. UPDATE - Modification operation
    @PutMapping("/{id}")
    @Operation(
        summary = "Update an existing operator", 
        description = "Update an existing operator with new details. Requires authentication.",
        operationId = "updateOperator"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Operator updated successfully"),
        @ApiResponse(responseCode = "404", description = "Operator not found"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "409", description = "Operator name already exists"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<OperatorResponse> updateOperator(
            @Parameter(description = "Operator ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id, 
            @Valid @RequestBody OperatorRequest request, 
            Authentication authentication) {
        String userId = authentication.getName();
        OperatorResponse response = operatorService.updateOperator(id, request, userId);
        return ResponseEntity.ok(response);
    }

    // 6. DELETE - Destructive operation (last)
    @DeleteMapping("/{id}")
    @Operation(
        summary = "Delete an operator", 
        description = "Permanently delete an operator. This action cannot be undone. Requires authentication.",
        operationId = "deleteOperator"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Operator deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Operator not found"),
        @ApiResponse(responseCode = "400", description = "Invalid UUID format"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Void> deleteOperator(
            @Parameter(description = "Operator ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID id) {
        operatorService.deleteOperator(id);
        return ResponseEntity.noContent().build();
    }

    // ========== ENHANCED MANAGEMENT APIs ==========

    // 7. FILTER OPTIONS - For frontend dropdown/filter components
    @GetMapping("/filter-options")
    @Operation(
        summary = "Get available filter options", 
        description = "Retrieve all available filter options for operator management frontend including operator types, regions, statuses, and sort options.",
        operationId = "getFilterOptions"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Filter options retrieved successfully")
    })
    public ResponseEntity<OperatorFilterOptionsResponse> getFilterOptions() {
        OperatorFilterOptionsResponse response = operatorService.getFilterOptions();
        return ResponseEntity.ok(response);
    }

    // 8. STATISTICS - For KPI dashboard cards
    @GetMapping("/statistics")
    @Operation(
        summary = "Get operator statistics", 
        description = "Retrieve comprehensive operator statistics for dashboard KPI cards including counts, distributions, and calculated metrics.",
        operationId = "getOperatorStatistics"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Statistics retrieved successfully")
    })
    public ResponseEntity<OperatorStatisticsResponse> getOperatorStatistics() {
        OperatorStatisticsResponse response = operatorService.getStatistics();
        return ResponseEntity.ok(response);
    }

    // 9. IMPORT - For bulk operator import from file
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
        summary = "Import operators from CSV file", 
        description = "Bulk import operators from a CSV file. Expected CSV format: name,operatorType,region,status (header row required). " +
                     "OperatorType should be PRIVATE or CTB. Status should be active, inactive, pending, or cancelled. Requires authentication.",
        operationId = "importOperators"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Import completed (check response for detailed results)"),
        @ApiResponse(responseCode = "400", description = "Invalid file format or content"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<OperatorImportResponse> importOperators(
            @Parameter(description = "CSV file containing operator data")
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        String userId = authentication.getName();
        OperatorImportResponse response = operatorService.importOperators(file, userId);
        return ResponseEntity.ok(response);
    }

    // 10. DOWNLOAD CSV TEMPLATE - For import template
    @GetMapping("/import-template")
    @Operation(
        summary = "Download CSV import template", 
        description = "Download a CSV template file with sample data and correct format for operator import.",
        operationId = "downloadImportTemplate"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Template downloaded successfully")
    })
    public ResponseEntity<String> downloadImportTemplate() {
        String csvTemplate = "name,operatorType,region,status\n" +
                           "Sample Transport Company,PRIVATE,Western Province,active\n" +
                           "City Bus Service,CTB,Central Province,active\n" +
                           "Express Lines Pvt Ltd,PRIVATE,Southern Province,inactive\n";
        
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv")
                .header("Content-Disposition", "attachment; filename=\"operator_import_template.csv\"")
                .body(csvTemplate);
    }
}
