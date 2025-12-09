package com.busmate.routeschedule.service.impl;

import com.busmate.routeschedule.dto.request.OperatorRequest;
import com.busmate.routeschedule.dto.request.OperatorImportRequest;
import com.busmate.routeschedule.dto.response.OperatorResponse;
import com.busmate.routeschedule.dto.response.filter.OperatorFilterOptionsResponse;
import com.busmate.routeschedule.dto.response.statistic.OperatorStatisticsResponse;
import com.busmate.routeschedule.dto.response.importing.OperatorImportResponse;
import com.busmate.routeschedule.entity.Operator;
import com.busmate.routeschedule.enums.OperatorTypeEnum;
import com.busmate.routeschedule.enums.StatusEnum;
import com.busmate.routeschedule.exception.ConflictException;
import com.busmate.routeschedule.exception.ResourceNotFoundException;
import com.busmate.routeschedule.repository.OperatorRepository;
import com.busmate.routeschedule.service.OperatorService;
import com.busmate.routeschedule.util.MapperUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.text.DecimalFormat;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OperatorServiceImpl implements OperatorService {
    private final OperatorRepository operatorRepository;
    private final MapperUtils mapperUtils;

    @Override
    public OperatorResponse createOperator(OperatorRequest request, String userId) {
        validateOperatorRequest(request);
        if (operatorRepository.existsByName(request.getName())) {
            throw new ConflictException("Operator with name " + request.getName() + " already exists");
        }

        Operator operator = mapToOperator(request, userId);
        Operator savedOperator = operatorRepository.save(operator);
        return mapToResponse(savedOperator);
    }

    @Override
    public OperatorResponse getOperatorById(UUID id) {
        Operator operator = operatorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Operator not found with id: " + id));
        return mapToResponse(operator);
    }

    @Override
    public List<OperatorResponse> getAllOperators() {
        return operatorRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<OperatorResponse> getAllOperators(Pageable pageable) {
        Page<Operator> operators = operatorRepository.findAll(pageable);
        return operators.map(this::mapToResponse);
    }

    @Override
    public Page<OperatorResponse> getAllOperatorsWithFilters(String searchText, OperatorTypeEnum operatorType, StatusEnum status, Pageable pageable) {
        String operatorTypeStr = operatorType != null ? operatorType.name() : null;
        String statusStr = status != null ? status.name() : null;
        
        Page<Operator> operators = operatorRepository.findAllWithFilters(searchText, operatorTypeStr, statusStr, pageable);
        return operators.map(this::mapToResponse);
    }

    @Override
    public OperatorResponse updateOperator(UUID id, OperatorRequest request, String userId) {
        Operator operator = operatorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Operator not found with id: " + id));

        validateOperatorRequest(request);
        if (!operator.getName().equals(request.getName()) &&
                operatorRepository.existsByName(request.getName())) {
            throw new ConflictException("Operator with name " + request.getName() + " already exists");
        }

        mapperUtils.map(request, operator);
        try {
            operator.setOperatorType(OperatorTypeEnum.valueOf(request.getOperatorType()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid operator type: " + request.getOperatorType());
        }
        try {
            operator.setStatus(StatusEnum.valueOf(request.getStatus()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid status: " + request.getStatus());
        }
        operator.setUpdatedBy(userId);

        Operator updatedOperator = operatorRepository.save(operator);
        return mapToResponse(updatedOperator);
    }

    @Override
    public void deleteOperator(UUID id) {
        if (!operatorRepository.existsById(id)) {
            throw new ResourceNotFoundException("Operator not found with id: " + id);
        }
        operatorRepository.deleteById(id);
    }

    @Override
    public OperatorFilterOptionsResponse getFilterOptions() {
        OperatorFilterOptionsResponse response = new OperatorFilterOptionsResponse();
        
        // Get operator types
        response.setOperatorTypes(Arrays.stream(OperatorTypeEnum.values())
                .map(Enum::name)
                .collect(Collectors.toList()));
        
        // Get status options
        response.setStatuses(Arrays.stream(StatusEnum.values())
                .map(Enum::name)
                .collect(Collectors.toList()));
        
        // Get regions from database
        response.setRegions(operatorRepository.findDistinctRegions());
        
        // Get sort options
        response.setSortOptions(Arrays.asList(
                "name", "operatorType", "region", "status", "createdAt", "updatedAt"
        ));
        
        return response;
    }

    @Override
    public OperatorStatisticsResponse getStatistics() {
        OperatorStatisticsResponse stats = new OperatorStatisticsResponse();
        
        // Total counts
        long totalOperators = operatorRepository.count();
        stats.setTotalOperators(totalOperators);
        
        // Status-based counts
        stats.setActiveOperators(operatorRepository.countByStatus(StatusEnum.active));
        stats.setInactiveOperators(operatorRepository.countByStatus(StatusEnum.inactive));
        stats.setPendingOperators(operatorRepository.countByStatus(StatusEnum.pending));
        stats.setCancelledOperators(operatorRepository.countByStatus(StatusEnum.cancelled));
        
        // Type-based counts
        stats.setPrivateOperators(operatorRepository.countByOperatorType(OperatorTypeEnum.PRIVATE));
        stats.setCtbOperators(operatorRepository.countByOperatorType(OperatorTypeEnum.CTB));
        
        // Regional distribution
        Map<String, Long> regionDistribution = operatorRepository.countByRegion().stream()
                .collect(Collectors.toMap(
                    row -> (String) row[0],
                    row -> (Long) row[1]
                ));
        stats.setOperatorsByRegion(regionDistribution);
        
        // Type distribution
        Map<String, Long> typeDistribution = operatorRepository.countByOperatorType().stream()
                .collect(Collectors.toMap(
                    row -> ((OperatorTypeEnum) row[0]).name(),
                    row -> (Long) row[1]
                ));
        stats.setOperatorsByType(typeDistribution);
        
        // Status distribution
        Map<String, Long> statusDistribution = operatorRepository.countByStatus().stream()
                .collect(Collectors.toMap(
                    row -> ((StatusEnum) row[0]).name(),
                    row -> (Long) row[1]
                ));
        stats.setOperatorsByStatus(statusDistribution);
        
        // Calculate derived statistics
        if (totalOperators > 0) {
            double activePercentage = (stats.getActiveOperators().doubleValue() / totalOperators) * 100;
            stats.setActiveOperatorPercentage(Double.parseDouble(new DecimalFormat("#.##").format(activePercentage)));
        }
        
        if (!regionDistribution.isEmpty()) {
            double avgPerRegion = totalOperators / (double) regionDistribution.size();
            stats.setAverageOperatorsPerRegion(Double.parseDouble(new DecimalFormat("#.##").format(avgPerRegion)));
            
            // Find most and least active regions
            List<Object[]> activeRegions = operatorRepository.findActiveOperatorsByRegion();
            if (!activeRegions.isEmpty()) {
                stats.setMostActiveRegion((String) activeRegions.get(0)[0]);
                stats.setLeastActiveRegion((String) activeRegions.get(activeRegions.size() - 1)[0]);
            }
        }
        
        return stats;
    }

    @Override
    public OperatorImportResponse importOperators(MultipartFile file, String userId) {
        OperatorImportResponse response = new OperatorImportResponse();
        List<OperatorImportResponse.ImportError> errors = new ArrayList<>();
        
        try {
            List<OperatorImportRequest> importRequests = parseCSVFile(file);
            response.setTotalRecords(importRequests.size());
            
            int successCount = 0;
            int failCount = 0;
            
            for (int i = 0; i < importRequests.size(); i++) {
                OperatorImportRequest importRequest = importRequests.get(i);
                try {
                    // Validate and convert to OperatorRequest
                    OperatorRequest operatorRequest = convertToOperatorRequest(importRequest);
                    
                    // Check for duplicates
                    if (operatorRepository.existsByName(operatorRequest.getName())) {
                        errors.add(createImportError(i + 2, "name", operatorRequest.getName(), 
                                "Operator with this name already exists", "Use a different name"));
                        failCount++;
                        continue;
                    }
                    
                    // Create the operator
                    createOperator(operatorRequest, userId);
                    successCount++;
                    
                } catch (Exception e) {
                    errors.add(createImportError(i + 2, "general", "", 
                            e.getMessage(), "Check data format and try again"));
                    failCount++;
                }
            }
            
            response.setSuccessfulImports(successCount);
            response.setFailedImports(failCount);
            response.setErrors(errors);
            
            if (successCount > 0 && failCount == 0) {
                response.setMessage("All operators imported successfully!");
            } else if (successCount > 0 && failCount > 0) {
                response.setMessage(String.format("%d operators imported successfully, %d failed.", successCount, failCount));
            } else {
                response.setMessage("Import failed. Please check the errors and try again.");
            }
            
        } catch (Exception e) {
            log.error("Error importing operators from file", e);
            response.setTotalRecords(0);
            response.setSuccessfulImports(0);
            response.setFailedImports(0);
            response.setMessage("Failed to process the file: " + e.getMessage());
            errors.add(createImportError(0, "file", file.getOriginalFilename(), 
                    "File processing error", "Ensure the file is a valid CSV format"));
            response.setErrors(errors);
        }
        
        return response;
    }

    private List<OperatorImportRequest> parseCSVFile(MultipartFile file) throws Exception {
        List<OperatorImportRequest> requests = new ArrayList<>();
        
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            boolean firstLine = true;
            
            while ((line = reader.readLine()) != null) {
                if (firstLine) {
                    firstLine = false;
                    continue; // Skip header
                }
                
                String[] fields = line.split(",");
                if (fields.length >= 1) {
                    String name = fields.length > 0 ? fields[0].trim() : "";
                    String operatorType = fields.length > 1 ? fields[1].trim() : "PRIVATE";
                    String region = fields.length > 2 ? fields[2].trim() : "";
                    String status = fields.length > 3 ? fields[3].trim() : "active";
                    
                    requests.add(new OperatorImportRequest(name, operatorType, region, status));
                }
            }
        }
        
        return requests;
    }

    private OperatorRequest convertToOperatorRequest(OperatorImportRequest importRequest) {
        OperatorRequest request = new OperatorRequest();
        request.setName(importRequest.getName());
        request.setOperatorType(importRequest.getOperatorType() != null ? 
                importRequest.getOperatorType().toUpperCase() : "PRIVATE");
        request.setRegion(importRequest.getRegion());
        request.setStatus(importRequest.getStatus() != null ? 
                importRequest.getStatus().toLowerCase() : "active");
        return request;
    }

    private OperatorImportResponse.ImportError createImportError(int rowNumber, String field, 
            String value, String errorMessage, String suggestion) {
        OperatorImportResponse.ImportError error = new OperatorImportResponse.ImportError();
        error.setRowNumber(rowNumber);
        error.setField(field);
        error.setValue(value);
        error.setErrorMessage(errorMessage);
        error.setSuggestion(suggestion);
        return error;
    }

    private void validateOperatorRequest(OperatorRequest request) {
        try {
            OperatorTypeEnum.valueOf(request.getOperatorType());
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid operator type: " + request.getOperatorType());
        }
        try {
            StatusEnum.valueOf(request.getStatus());
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid status: " + request.getStatus());
        }
    }

    private Operator mapToOperator(OperatorRequest request, String userId) {
        Operator operator = mapperUtils.map(request, Operator.class);
        try {
            operator.setOperatorType(OperatorTypeEnum.valueOf(request.getOperatorType()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid operator type: " + request.getOperatorType());
        }
        try {
            operator.setStatus(StatusEnum.valueOf(request.getStatus()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid status: " + request.getStatus());
        }
        operator.setCreatedBy(userId);
        operator.setUpdatedBy(userId);
        return operator;
    }

    private OperatorResponse mapToResponse(Operator operator) {
        return mapperUtils.map(operator, OperatorResponse.class);
    }
}
