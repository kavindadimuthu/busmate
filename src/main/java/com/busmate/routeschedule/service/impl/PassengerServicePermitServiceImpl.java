package com.busmate.routeschedule.service.impl;

import com.busmate.routeschedule.dto.request.PassengerServicePermitRequest;
import com.busmate.routeschedule.dto.response.PassengerServicePermitResponse;
import com.busmate.routeschedule.dto.response.PassengerServicePermitFilterOptionsResponse;
import com.busmate.routeschedule.dto.response.PassengerServicePermitStatisticsResponse;
import com.busmate.routeschedule.dto.response.PassengerServicePermitImportResponse;
import com.busmate.routeschedule.dto.response.PaginatedResponse;
import com.busmate.routeschedule.entity.PassengerServicePermit;
import com.busmate.routeschedule.entity.Operator;
import com.busmate.routeschedule.entity.RouteGroup;
import com.busmate.routeschedule.enums.PassengerServicePermitTypeEnum;
import com.busmate.routeschedule.enums.StatusEnum;
import com.busmate.routeschedule.enums.OperatorTypeEnum;
import com.busmate.routeschedule.exception.ConflictException;
import com.busmate.routeschedule.exception.ResourceNotFoundException;
//import com.busmate.routeschedule.repository.BusPassengerServicePermitAssignmentRepository;
import com.busmate.routeschedule.repository.PassengerServicePermitRepository;
import com.busmate.routeschedule.repository.OperatorRepository;
import com.busmate.routeschedule.repository.RouteGroupRepository;
import com.busmate.routeschedule.service.PassengerServicePermitService;
import com.busmate.routeschedule.util.MapperUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.persistence.criteria.Predicate;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PassengerServicePermitServiceImpl implements PassengerServicePermitService {
    private final PassengerServicePermitRepository permitRepository;
    private final OperatorRepository operatorRepository;
    private final RouteGroupRepository routeGroupRepository;
//    private final BusPassengerServicePermitAssignmentRepository busPermitAssignmentRepository;
    private final MapperUtils mapperUtils;

    @Override
    public PassengerServicePermitResponse createPermit(PassengerServicePermitRequest request, String userId) {
        validatePermitRequest(request);
        Operator operator = validateAndGetOperator(request.getOperatorId());
        RouteGroup routeGroup = validateAndGetRouteGroup(request.getRouteGroupId());
        if (permitRepository.existsByPermitNumber(request.getPermitNumber())) {
            throw new ConflictException("Permit with number " + request.getPermitNumber() + " already exists");
        }

        PassengerServicePermit permit = mapToPermit(request, userId, operator, routeGroup);
        PassengerServicePermit savedPermit = permitRepository.save(permit);
        return mapToResponse(savedPermit);
    }

    @Override
    public PassengerServicePermitResponse getPermitById(UUID id) {
        PassengerServicePermit permit = permitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permit not found with id: " + id));
        return mapToResponse(permit);
    }

    @Override
    public List<PassengerServicePermitResponse> getAllPermits() {
        return permitRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PaginatedResponse<PassengerServicePermitResponse> getPermits(Pageable pageable, String status, String permitType, String operatorName, String routeGroupName) {
        Specification<PassengerServicePermit> specification = createSpecification(status, permitType, operatorName, routeGroupName);
        Page<PassengerServicePermit> permitPage = permitRepository.findAll(specification, pageable);
        
        List<PassengerServicePermitResponse> content = permitPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        
        return PaginatedResponse.of(content, pageable.getPageNumber(), pageable.getPageSize(), permitPage.getTotalElements());
    }

    @Override
    public List<PassengerServicePermitResponse> getPermitsByRouteGroupId(UUID routeGroupId) {
        // Validate that route group exists
        routeGroupRepository.findById(routeGroupId)
                .orElseThrow(() -> new ResourceNotFoundException("Route group not found with id: " + routeGroupId));
        
        return permitRepository.findByRouteGroupId(routeGroupId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PassengerServicePermitResponse updatePermit(UUID id, PassengerServicePermitRequest request, String userId) {
        PassengerServicePermit permit = permitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permit not found with id: " + id));

        validatePermitRequest(request);
        Operator operator = validateAndGetOperator(request.getOperatorId());
        RouteGroup routeGroup = validateAndGetRouteGroup(request.getRouteGroupId());
        if (!permit.getPermitNumber().equals(request.getPermitNumber()) &&
                permitRepository.existsByPermitNumber(request.getPermitNumber())) {
            throw new ConflictException("Permit with number " + request.getPermitNumber() + " already exists");
        }

        // Store the original ID to avoid overwriting it
        UUID originalId = permit.getId();
        
        // Update fields manually instead of using mapperUtils to avoid ID conflicts
        permit.setPermitNumber(request.getPermitNumber());
        permit.setIssueDate(request.getIssueDate());
        permit.setExpiryDate(request.getExpiryDate());
        permit.setMaximumBusAssigned(request.getMaximumBusAssigned());
        permit.setOperator(operator);
        permit.setRouteGroup(routeGroup);
        
        try {
            permit.setStatus(StatusEnum.valueOf(request.getStatus()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid status: " + request.getStatus());
        }
        try {
            permit.setPermitType(PassengerServicePermitTypeEnum.valueOf(request.getPermitType()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid permit type: " + request.getPermitType());
        }
        
        // Ensure the ID remains unchanged
        permit.setId(originalId);
        permit.setUpdatedBy(userId);

        PassengerServicePermit updatedPermit = permitRepository.save(permit);
        return mapToResponse(updatedPermit);
    }

    @Override
    public void deletePermit(UUID id) {
        PassengerServicePermit permit = permitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permit not found with id: " + id));

//        if (busPermitAssignmentRepository.existsByPermitId(id)) {
//            throw new ConflictException("Cannot delete permit with id " + id + " as it is referenced by bus assignments");
//        }

        permitRepository.deleteById(id);
    }

    private void validatePermitRequest(PassengerServicePermitRequest request) {
        if (request.getExpiryDate() != null && request.getExpiryDate().isBefore(request.getIssueDate())) {
            throw new ConflictException("Expiry date cannot be before issue date");
        }
        if (request.getMaximumBusAssigned() <= 0) {
            throw new ConflictException("Maximum bus assigned must be positive");
        }
        try {
            StatusEnum.valueOf(request.getStatus());
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid status: " + request.getStatus());
        }
        try {
            PassengerServicePermitTypeEnum.valueOf(request.getPermitType());
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid permit type: " + request.getPermitType());
        }
    }

    private Operator validateAndGetOperator(UUID operatorId) {
        return operatorRepository.findById(operatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Operator not found with id: " + operatorId));
    }

    private RouteGroup validateAndGetRouteGroup(UUID routeGroupId) {
        return routeGroupRepository.findById(routeGroupId)
                .orElseThrow(() -> new ResourceNotFoundException("Route group not found with id: " + routeGroupId));
    }

    private PassengerServicePermit mapToPermit(PassengerServicePermitRequest request, String userId, Operator operator, RouteGroup routeGroup) {
        PassengerServicePermit permit = mapperUtils.map(request, PassengerServicePermit.class);
        permit.setId(null); // Ensure ID is null for new entities
        permit.setOperator(operator);
        permit.setRouteGroup(routeGroup);
        try {
            permit.setStatus(StatusEnum.valueOf(request.getStatus()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid status: " + request.getStatus());
        }
        try {
            permit.setPermitType(PassengerServicePermitTypeEnum.valueOf(request.getPermitType()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid permit type: " + request.getPermitType());
        }
        permit.setCreatedBy(userId);
        permit.setUpdatedBy(userId);
        return permit;
    }

    private PassengerServicePermitResponse mapToResponse(PassengerServicePermit permit) {
        PassengerServicePermitResponse response = mapperUtils.map(permit, PassengerServicePermitResponse.class);
        response.setOperatorId(permit.getOperator().getId());
        response.setOperatorName(permit.getOperator().getName());
        response.setRouteGroupId(permit.getRouteGroup().getId());
        response.setRouteGroupName(permit.getRouteGroup().getName());
        return response;
    }

    private Specification<PassengerServicePermit> createSpecification(String status, String permitType, String operatorName, String routeGroupName) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            if (status != null && !status.trim().isEmpty()) {
                try {
                    StatusEnum statusEnum = StatusEnum.valueOf(status.toUpperCase());
                    predicates.add(criteriaBuilder.equal(root.get("status"), statusEnum));
                } catch (IllegalArgumentException e) {
                    // Invalid status, ignore or throw exception
                }
            }
            
            if (permitType != null && !permitType.trim().isEmpty()) {
                try {
                    PassengerServicePermitTypeEnum permitTypeEnum = PassengerServicePermitTypeEnum.valueOf(permitType.toUpperCase());
                    predicates.add(criteriaBuilder.equal(root.get("permitType"), permitTypeEnum));
                } catch (IllegalArgumentException e) {
                    // Invalid permit type, ignore or throw exception
                }
            }
            
            if (operatorName != null && !operatorName.trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("operator").get("name")), 
                    "%" + operatorName.toLowerCase() + "%"
                ));
            }
            
            if (routeGroupName != null && !routeGroupName.trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("routeGroup").get("name")), 
                    "%" + routeGroupName.toLowerCase() + "%"
                ));
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    @Override
    public PassengerServicePermitFilterOptionsResponse getFilterOptions() {
        PassengerServicePermitFilterOptionsResponse response = new PassengerServicePermitFilterOptionsResponse();
        
        // Get available statuses
        response.setStatuses(Arrays.stream(StatusEnum.values())
                .map(status -> status.name().toLowerCase())
                .collect(Collectors.toList()));
        
        // Get available permit types
        response.setPermitTypes(Arrays.stream(PassengerServicePermitTypeEnum.values())
                .map(Enum::name)
                .collect(Collectors.toList()));
        
        // Get all operators with their details
        List<Operator> operators = operatorRepository.findAll();
        response.setOperators(operators.stream()
                .map(operator -> {
                    PassengerServicePermitFilterOptionsResponse.OperatorOption option = 
                        new PassengerServicePermitFilterOptionsResponse.OperatorOption();
                    option.setId(operator.getId().toString());
                    option.setName(operator.getName());
                    option.setType(operator.getOperatorType().name());
                    option.setRegion(operator.getRegion());
                    return option;
                })
                .collect(Collectors.toList()));
        
        // Get all route groups
        List<RouteGroup> routeGroups = routeGroupRepository.findAll();
        response.setRouteGroups(routeGroups.stream()
                .map(routeGroup -> {
                    PassengerServicePermitFilterOptionsResponse.RouteGroupOption option = 
                        new PassengerServicePermitFilterOptionsResponse.RouteGroupOption();
                    option.setId(routeGroup.getId().toString());
                    option.setName(routeGroup.getName());
                    option.setDescription(routeGroup.getDescription());
                    return option;
                })
                .collect(Collectors.toList()));
        
        // Set sort options
        response.setSortOptions(Arrays.asList(
            "permitNumber", "issueDate", "expiryDate", "status", 
            "permitType", "operatorName", "routeGroupName", "createdAt", "updatedAt"
        ));
        
        return response;
    }

    @Override
    public PassengerServicePermitStatisticsResponse getStatistics() {
        PassengerServicePermitStatisticsResponse response = new PassengerServicePermitStatisticsResponse();
        
        // Get basic counts
        long totalPermits = permitRepository.count();
        response.setTotalPermits(totalPermits);
        
        // Count by status
        response.setActivePermits(permitRepository.countByStatus(StatusEnum.active));
        response.setPendingPermits(permitRepository.countByStatus(StatusEnum.pending));
        response.setInactivePermits(permitRepository.countByStatus(StatusEnum.inactive));
        response.setCancelledPermits(permitRepository.countByStatus(StatusEnum.cancelled));
        
        // Calculate expiry statistics
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysFromNow = today.plusDays(30);
        
        List<PassengerServicePermit> expiringSoon = permitRepository.findByExpiryDateBetween(today, thirtyDaysFromNow);
        response.setExpiringSoonPermits((long) expiringSoon.size());
        
        List<PassengerServicePermit> expired = permitRepository.findByExpiryDateBefore(today);
        response.setExpiredPermits((long) expired.size());
        
        // Group by permit type
        Map<String, Long> permitsByType = new HashMap<>();
        for (PassengerServicePermitTypeEnum type : PassengerServicePermitTypeEnum.values()) {
            long count = permitRepository.countByPermitType(type);
            permitsByType.put(type.name(), count);
        }
        response.setPermitsByType(permitsByType);
        
        // Group by status
        Map<String, Long> permitsByStatus = new HashMap<>();
        for (StatusEnum status : StatusEnum.values()) {
            long count = permitRepository.countByStatus(status);
            permitsByStatus.put(status.name().toLowerCase(), count);
        }
        response.setPermitsByStatus(permitsByStatus);
        
        // Group by operator
        Map<String, Long> permitsByOperator = permitRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                    permit -> permit.getOperator().getName(),
                    Collectors.counting()));
        response.setPermitsByOperator(permitsByOperator);
        
        // Group by route group
        Map<String, Long> permitsByRouteGroup = permitRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                    permit -> permit.getRouteGroup().getName(),
                    Collectors.counting()));
        response.setPermitsByRouteGroup(permitsByRouteGroup);
        
        // Expiring permits list
        List<PassengerServicePermitStatisticsResponse.ExpiringPermit> expiringList = expiringSoon.stream()
                .map(permit -> {
                    PassengerServicePermitStatisticsResponse.ExpiringPermit exp = 
                        new PassengerServicePermitStatisticsResponse.ExpiringPermit();
                    exp.setId(permit.getId().toString());
                    exp.setPermitNumber(permit.getPermitNumber());
                    exp.setOperatorName(permit.getOperator().getName());
                    exp.setRouteGroupName(permit.getRouteGroup().getName());
                    exp.setExpiryDate(permit.getExpiryDate().toString());
                    exp.setDaysUntilExpiry((int) ChronoUnit.DAYS.between(today, permit.getExpiryDate()));
                    return exp;
                })
                .sorted((a, b) -> Integer.compare(a.getDaysUntilExpiry(), b.getDaysUntilExpiry()))
                .collect(Collectors.toList());
        response.setExpiringSoonList(expiringList);
        
        return response;
    }

    @Override
    public PassengerServicePermitImportResponse importPermitsFromCsv(MultipartFile file, String userId) {
        PassengerServicePermitImportResponse response = new PassengerServicePermitImportResponse();
        response.setErrors(new ArrayList<>());
        
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }
        
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            
            List<String> lines = reader.lines().collect(Collectors.toList());
            
            if (lines.isEmpty()) {
                response.setMessage("File is empty");
                return response;
            }
            
            // Skip header line
            if (lines.size() <= 1) {
                response.setMessage("No data rows found in file");
                return response;
            }
            
            String[] headers = lines.get(0).split(",");
            List<String> dataLines = lines.subList(1, lines.size());
            
            response.setTotalRecords(dataLines.size());
            
            int successCount = 0;
            int failCount = 0;
            
            for (int i = 0; i < dataLines.size(); i++) {
                try {
                    String line = dataLines.get(i);
                    String[] values = line.split(",");
                    
                    if (values.length < 8) {
                        addImportError(response, i + 2, "general", line, 
                            "Insufficient columns. Expected: permitNumber,operatorName,routeGroupName,permitType,status,issueDate,expiryDate,maximumBusAssigned", 
                            "Ensure all required columns are present");
                        failCount++;
                        continue;
                    }
                    
                    // Parse CSV row
                    PassengerServicePermitRequest request = new PassengerServicePermitRequest();
                    
                    // Set permit number
                    String permitNumber = values[0].trim();
                    if (permitNumber.isEmpty()) {
                        addImportError(response, i + 2, "permitNumber", permitNumber, 
                            "Permit number cannot be empty", "Provide a valid permit number");
                        failCount++;
                        continue;
                    }
                    
                    // Find operator by name
                    String operatorName = values[1].trim();
                    Optional<Operator> operatorOpt = operatorRepository.findByNameIgnoreCase(operatorName);
                    if (!operatorOpt.isPresent()) {
                        addImportError(response, i + 2, "operatorName", operatorName, 
                            "Operator not found: " + operatorName, 
                            "Check operator name or create the operator first");
                        failCount++;
                        continue;
                    }
                    request.setOperatorId(operatorOpt.get().getId());
                    
                    // Find route group by name
                    String routeGroupName = values[2].trim();
                    Optional<RouteGroup> routeGroupOpt = routeGroupRepository.findByNameIgnoreCase(routeGroupName);
                    if (!routeGroupOpt.isPresent()) {
                        addImportError(response, i + 2, "routeGroupName", routeGroupName, 
                            "Route group not found: " + routeGroupName, 
                            "Check route group name or create the route group first");
                        failCount++;
                        continue;
                    }
                    request.setRouteGroupId(routeGroupOpt.get().getId());
                    if (permitNumber.isEmpty()) {
                        addImportError(response, i + 2, "permitNumber", permitNumber, 
                            "Permit number cannot be empty", "Provide a valid permit number");
                        failCount++;
                        continue;
                    }
                    
                    // Check if permit number already exists
                    if (permitRepository.existsByPermitNumber(permitNumber)) {
                        addImportError(response, i + 2, "permitNumber", permitNumber, 
                            "Permit number already exists: " + permitNumber, 
                            "Use a unique permit number");
                        failCount++;
                        continue;
                    }
                    request.setPermitNumber(permitNumber);
                    
                    // Parse issue date
                    try {
                        LocalDate issueDate = LocalDate.parse(values[5].trim(), DateTimeFormatter.ISO_LOCAL_DATE);
                        request.setIssueDate(issueDate);
                    } catch (DateTimeParseException e) {
                        addImportError(response, i + 2, "issueDate", values[5].trim(), 
                            "Invalid issue date format: " + values[5].trim(), 
                            "Use YYYY-MM-DD format");
                        failCount++;
                        continue;
                    }
                    
                    // Parse expiry date (optional)
                    if (!values[6].trim().isEmpty()) {
                        try {
                            LocalDate expiryDate = LocalDate.parse(values[6].trim(), DateTimeFormatter.ISO_LOCAL_DATE);
                            request.setExpiryDate(expiryDate);
                        } catch (DateTimeParseException e) {
                            addImportError(response, i + 2, "expiryDate", values[6].trim(), 
                                "Invalid expiry date format: " + values[6].trim(), 
                                "Use YYYY-MM-DD format or leave empty");
                            failCount++;
                            continue;
                        }
                    }
                    
                    // Parse maximum bus assigned
                    try {
                        int maxBus = Integer.parseInt(values[7].trim());
                        if (maxBus <= 0) {
                            addImportError(response, i + 2, "maximumBusAssigned", values[7].trim(), 
                                "Maximum bus assigned must be positive", "Provide a positive number");
                            failCount++;
                            continue;
                        }
                        request.setMaximumBusAssigned(maxBus);
                    } catch (NumberFormatException e) {
                        addImportError(response, i + 2, "maximumBusAssigned", values[7].trim(), 
                            "Invalid maximum bus assigned: " + values[7].trim(), 
                            "Provide a valid positive number");
                        failCount++;
                        continue;
                    }
                    
                    // Parse permit type
                    String permitType = values[3].trim().toUpperCase();
                    try {
                        PassengerServicePermitTypeEnum.valueOf(permitType);
                        request.setPermitType(permitType);
                    } catch (IllegalArgumentException e) {
                        addImportError(response, i + 2, "permitType", values[3].trim(), 
                            "Invalid permit type: " + values[3].trim(), 
                            "Valid types: " + Arrays.toString(PassengerServicePermitTypeEnum.values()));
                        failCount++;
                        continue;
                    }
                    
                    // Parse status
                    String status = values[4].trim().toLowerCase();
                    try {
                        StatusEnum.valueOf(status);
                        request.setStatus(status);
                    } catch (IllegalArgumentException e) {
                        addImportError(response, i + 2, "status", values[4].trim(), 
                            "Invalid status: " + values[4].trim(), 
                            "Valid statuses: " + Arrays.toString(StatusEnum.values()));
                        failCount++;
                        continue;
                    }
                    
                    // Create permit
                    createPermit(request, userId);
                    successCount++;
                    
                } catch (Exception e) {
                    addImportError(response, i + 2, "general", "", 
                        "Unexpected error: " + e.getMessage(), 
                        "Check data format and try again");
                    failCount++;
                }
            }
            
            response.setSuccessfulImports(successCount);
            response.setFailedImports(failCount);
            
            if (failCount == 0) {
                response.setMessage("All permits imported successfully!");
            } else if (successCount == 0) {
                response.setMessage("Import failed. Please check the errors and try again.");
            } else {
                response.setMessage("Import completed with " + successCount + 
                    " successful imports and " + failCount + " failures.");
            }
            
        } catch (Exception e) {
            throw new RuntimeException("Error reading CSV file: " + e.getMessage(), e);
        }
        
        return response;
    }

    @Override
    public byte[] getImportTemplate() {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
             PrintWriter writer = new PrintWriter(outputStream, false, StandardCharsets.UTF_8)) {
            
            // Write CSV header
            writer.println("operatorName,routeGroupName,permitNumber,issueDate,expiryDate,maximumBusAssigned,permitType,status");
            
            // Write sample data
            writer.println("Sri Lanka Transport Board - Western Province,Colombo - Kandy Route,PSP-001,2025-01-01,2026-01-01,10,NORMAL,active");
            writer.println("Royal Express Transport,Colombo - Galle Route,PSP-002,2025-02-01,2026-02-01,5,LUXURY,active");
            writer.println("Highway Express Pvt Ltd,Highway Route 1,PSP-003,2025-03-01,2026-03-01,15,EXTRA_LUXURY_HIGHWAY,pending");
            
            writer.flush();
            return outputStream.toByteArray();
            
        } catch (Exception e) {
            throw new RuntimeException("Error generating CSV template", e);
        }
    }

    private void addImportError(PassengerServicePermitImportResponse response, int rowNumber, 
                               String field, String value, String errorMessage, String suggestion) {
        PassengerServicePermitImportResponse.ImportError error = 
            new PassengerServicePermitImportResponse.ImportError();
        error.setRowNumber(rowNumber);
        error.setField(field);
        error.setValue(value);
        error.setErrorMessage(errorMessage);
        error.setSuggestion(suggestion);
        response.getErrors().add(error);
    }
}
