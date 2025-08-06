package com.busmate.routeschedule.controller;

import com.busmate.routeschedule.dto.request.OperatorRequest;
import com.busmate.routeschedule.dto.response.OperatorResponse;
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
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/operators")
@RequiredArgsConstructor
@Tag(name = "6. Operator Management", description = "APIs for managing operators")
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
                     "Search is performed across operator name and region. " +
                     "Default: page=0, size=10, sort=name",
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
            
            @Parameter(description = "Search text to filter operators by name or region", example = "Metro")
            @RequestParam(required = false) String search,
            
            @Parameter(description = "Filter by operator type (PRIVATE, CTB)", example = "PRIVATE")
            @RequestParam(required = false) String operatorType,
            
            @Parameter(description = "Filter by status (pending, active, inactive, cancelled)", example = "active")
            @RequestParam(required = false) String status) {
        
        // Validate page size
        if (size > 100) {
            size = 100; // Maximum page size limit
        }
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                   Sort.by(sortBy).descending() : 
                   Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Parse enum values with validation
        OperatorTypeEnum operatorTypeEnum = null;
        StatusEnum statusEnum = null;
        
        if (operatorType != null && !operatorType.trim().isEmpty()) {
            try {
                operatorTypeEnum = OperatorTypeEnum.valueOf(operatorType.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        }
        
        if (status != null && !status.trim().isEmpty()) {
            try {
                statusEnum = StatusEnum.valueOf(status.toLowerCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        }
        
        Page<OperatorResponse> responses;
        if ((search != null && !search.trim().isEmpty()) || operatorTypeEnum != null || statusEnum != null) {
            String searchText = search != null ? search.trim() : null;
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
}
