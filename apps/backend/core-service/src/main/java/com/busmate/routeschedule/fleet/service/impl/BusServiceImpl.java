package com.busmate.routeschedule.fleet.service.impl;

import com.busmate.routeschedule.fleet.dto.request.BusRequest;
import com.busmate.routeschedule.fleet.dto.request.BusImportRequest;
import com.busmate.routeschedule.fleet.dto.response.BusResponse;
import com.busmate.routeschedule.fleet.dto.response.BusFilterOptionsResponse;
import com.busmate.routeschedule.fleet.dto.response.BusStatisticsResponse;
import com.busmate.routeschedule.fleet.dto.response.BusImportResponse;
import com.busmate.routeschedule.fleet.entity.Bus;
import com.busmate.routeschedule.fleet.entity.Operator;
import com.busmate.routeschedule.shared.enums.StatusEnum;
import com.busmate.routeschedule.fleet.enums.OperatorTypeEnum;
import com.busmate.routeschedule.shared.exception.ConflictException;
import com.busmate.routeschedule.shared.exception.ResourceNotFoundException;
import com.busmate.routeschedule.licensing.repository.BusPassengerServicePermitAssignmentRepository;
import com.busmate.routeschedule.fleet.repository.BusRepository;
import com.busmate.routeschedule.fleet.repository.OperatorRepository;
import com.busmate.routeschedule.fleet.service.BusService;
import com.busmate.routeschedule.shared.util.MapperUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
public class BusServiceImpl implements BusService {
    private final BusRepository busRepository;
    private final OperatorRepository operatorRepository;
    private final BusPassengerServicePermitAssignmentRepository busPermitAssignmentRepository;
    private final MapperUtils mapperUtils;
    private final ObjectMapper objectMapper;

    @Override
    public BusResponse createBus(BusRequest request, String userId) {
        validateBusRequest(request);
        Operator operator = validateAndGetOperator(request.getOperatorId());
        if (busRepository.existsByNtcRegistrationNumber(request.getNtcRegistrationNumber())) {
            throw new ConflictException("Bus with NTC registration number " + request.getNtcRegistrationNumber() + " already exists");
        }
        if (busRepository.existsByPlateNumber(request.getPlateNumber())) {
            throw new ConflictException("Bus with plate number " + request.getPlateNumber() + " already exists");
        }

        Bus bus = mapToBus(request, userId, operator);
        Bus savedBus = busRepository.save(bus);
        return mapToResponse(savedBus);
    }

    @Override
    public BusResponse getBusById(UUID id) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + id));
        return mapToResponse(bus);
    }

    @Override
    public List<BusResponse> getAllBuses() {
        return busRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<BusResponse> getAllBuses(Pageable pageable) {
        Page<Bus> buses = busRepository.findAll(pageable);
        return buses.map(this::mapToResponse);
    }

    @Override
    public Page<BusResponse> getAllBusesWithFilters(String searchText, UUID operatorId, StatusEnum status, 
                                                   Integer minCapacity, Integer maxCapacity, Pageable pageable) {
        String statusStr = status != null ? status.name() : null;
        
        Page<Bus> buses = busRepository.findAllWithFilters(searchText, operatorId, statusStr, 
                                                          minCapacity, maxCapacity, pageable);
        return buses.map(this::mapToResponse);
    }

    @Override
    public BusResponse updateBus(UUID id, BusRequest request, String userId) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + id));

        validateBusRequest(request);
        Operator operator = validateAndGetOperator(request.getOperatorId());
        if (!bus.getNtcRegistrationNumber().equals(request.getNtcRegistrationNumber()) &&
                busRepository.existsByNtcRegistrationNumber(request.getNtcRegistrationNumber())) {
            throw new ConflictException("Bus with NTC registration number " + request.getNtcRegistrationNumber() + " already exists");
        }
        if (!bus.getPlateNumber().equals(request.getPlateNumber()) &&
                busRepository.existsByPlateNumber(request.getPlateNumber())) {
            throw new ConflictException("Bus with plate number " + request.getPlateNumber() + " already exists");
        }

        // Manually update fields instead of using mapper to avoid ID conflicts
        bus.setNtcRegistrationNumber(request.getNtcRegistrationNumber());
        bus.setPlateNumber(request.getPlateNumber());
        bus.setCapacity(request.getCapacity());
        bus.setModel(request.getModel());
        bus.setFacilities(request.getFacilities());
        bus.setOperator(operator);
        
        try {
            bus.setStatus(StatusEnum.valueOf(request.getStatus()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid status: " + request.getStatus());
        }
        bus.setUpdatedBy(userId);
        // Don't set or modify the ID

        Bus updatedBus = busRepository.save(bus);
        return mapToResponse(updatedBus);
    }

    @Override
    public void deleteBus(UUID id) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + id));

        if (busPermitAssignmentRepository.existsByBusId(id)) {
            throw new ConflictException("Cannot delete bus with id " + id + " as it is referenced by permit assignments");
        }

        busRepository.deleteById(id);
    }

    @Override
    public BusFilterOptionsResponse getFilterOptions() {
        BusFilterOptionsResponse response = new BusFilterOptionsResponse();
        
        // Get status options
        response.setStatuses(Arrays.stream(StatusEnum.values())
                .map(Enum::name)
                .collect(Collectors.toList()));
        
        // Get operators with their details
        List<BusFilterOptionsResponse.OperatorOption> operators = busRepository.findDistinctOperators()
                .stream()
                .map(row -> {
                    BusFilterOptionsResponse.OperatorOption option = new BusFilterOptionsResponse.OperatorOption();
                    option.setId(row[0].toString());
                    option.setName((String) row[1]);
                    option.setType(((OperatorTypeEnum) row[2]).name());
                    return option;
                })
                .collect(Collectors.toList());
        response.setOperators(operators);
        
        // Get models from database
        response.setModels(busRepository.findDistinctModels());
        
        // Get capacity ranges
        response.setCapacityRanges(Arrays.asList("1-25", "26-35", "36-45", "46-55", "55+"));
        
        // Set capacity range info
        Map<String, Integer> capacityRange = new HashMap<>();
        Integer minCapacity = busRepository.findMinCapacity();
        Integer maxCapacity = busRepository.findMaxCapacity();
        if (minCapacity != null && maxCapacity != null) {
            capacityRange.put("min", minCapacity);
            capacityRange.put("max", maxCapacity);
        }
        response.setCapacityRange(capacityRange);
        
        // Get sort options
        response.setSortOptions(Arrays.asList(
                "ntcRegistrationNumber", "plateNumber", "model", "capacity", 
                "operatorName", "status", "createdAt", "updatedAt"
        ));
        
        return response;
    }

    @Override
    public BusStatisticsResponse getStatistics() {
        BusStatisticsResponse stats = new BusStatisticsResponse();
        
        // Total counts
        long totalBuses = busRepository.count();
        stats.setTotalBuses(totalBuses);
        
        // Status-based counts
        stats.setActiveBuses(busRepository.countByStatus(StatusEnum.active));
        stats.setInactiveBuses(busRepository.countByStatus(StatusEnum.inactive));
        stats.setPendingBuses(busRepository.countByStatus(StatusEnum.pending));
        stats.setCancelledBuses(busRepository.countByStatus(StatusEnum.cancelled));
        
        // Type-based counts from operators
        Map<String, Long> typeDistribution = busRepository.countByOperatorType().stream()
                .collect(Collectors.toMap(
                    row -> ((OperatorTypeEnum) row[0]).name(),
                    row -> (Long) row[1]
                ));
        stats.setPrivateBuses(typeDistribution.getOrDefault("PRIVATE", 0L));
        stats.setCtbBuses(typeDistribution.getOrDefault("CTB", 0L));
        
        // Operator distribution
        Map<String, Long> operatorDistribution = busRepository.countByOperator().stream()
                .collect(Collectors.toMap(
                    row -> (String) row[0],
                    row -> (Long) row[1]
                ));
        stats.setBusesByOperator(operatorDistribution);
        
        // Status distribution
        Map<String, Long> statusDistribution = busRepository.countByStatus().stream()
                .collect(Collectors.toMap(
                    row -> ((StatusEnum) row[0]).name(),
                    row -> (Long) row[1]
                ));
        stats.setBusesByStatus(statusDistribution);
        
        // Model distribution
        Map<String, Long> modelDistribution = busRepository.countByModel().stream()
                .collect(Collectors.toMap(
                    row -> (String) row[0],
                    row -> (Long) row[1]
                ));
        stats.setBusesByModel(modelDistribution);
        
        // Capacity range distribution
        Map<String, Long> capacityDistribution = busRepository.countByCapacityRange().stream()
                .collect(Collectors.toMap(
                    row -> (String) row[0],
                    row -> ((Number) row[1]).longValue()
                ));
        stats.setBusesByCapacityRange(capacityDistribution);
        
        // Capacity statistics
        Double avgCapacity = busRepository.findAverageCapacity();
        if (avgCapacity != null) {
            stats.setAverageCapacity(Double.parseDouble(new DecimalFormat("#.##").format(avgCapacity)));
        }
        
        Long totalCapacity = busRepository.findTotalCapacity();
        stats.setTotalCapacity(totalCapacity != null ? totalCapacity.intValue() : 0);
        
        stats.setMinCapacity(busRepository.findMinCapacity());
        stats.setMaxCapacity(busRepository.findMaxCapacity());
        
        // Derived statistics
        if (totalBuses > 0) {
            double activePercentage = (stats.getActiveBuses().doubleValue() / totalBuses) * 100;
            stats.setActiveBusPercentage(Double.parseDouble(new DecimalFormat("#.##").format(activePercentage)));
        }
        
        if (!operatorDistribution.isEmpty()) {
            double avgPerOperator = totalBuses / (double) operatorDistribution.size();
            stats.setAverageBusesPerOperator(Double.parseDouble(new DecimalFormat("#.##").format(avgPerOperator)));
            
            // Find most popular model and operator
            stats.setMostPopularModel(modelDistribution.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("N/A"));
            
            stats.setOperatorWithMostBuses(operatorDistribution.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("N/A"));
        }
        
        return stats;
    }

    @Override
    public BusImportResponse importBuses(MultipartFile file, String userId) {
        BusImportResponse response = new BusImportResponse();
        List<BusImportResponse.ImportError> errors = new ArrayList<>();
        
        try {
            List<BusImportRequest> importRequests = parseCSVFile(file);
            response.setTotalRecords(importRequests.size());
            
            int successCount = 0;
            int failCount = 0;
            
            for (int i = 0; i < importRequests.size(); i++) {
                BusImportRequest importRequest = importRequests.get(i);
                try {
                    // Validate and convert to BusRequest
                    BusRequest busRequest = convertToBusRequest(importRequest);
                    
                    // Check for duplicates
                    if (busRepository.existsByNtcRegistrationNumber(busRequest.getNtcRegistrationNumber())) {
                        errors.add(createImportError(i + 2, "ntcRegistrationNumber", busRequest.getNtcRegistrationNumber(), 
                                "Bus with this NTC registration number already exists", "Use a different NTC registration number"));
                        failCount++;
                        continue;
                    }
                    
                    if (busRepository.existsByPlateNumber(busRequest.getPlateNumber())) {
                        errors.add(createImportError(i + 2, "plateNumber", busRequest.getPlateNumber(), 
                                "Bus with this plate number already exists", "Use a different plate number"));
                        failCount++;
                        continue;
                    }
                    
                    // Create the bus
                    createBus(busRequest, userId);
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
                response.setMessage("All buses imported successfully!");
            } else if (successCount > 0 && failCount > 0) {
                response.setMessage(String.format("%d buses imported successfully, %d failed.", successCount, failCount));
            } else {
                response.setMessage("Import failed. Please check the errors and try again.");
            }
            
        } catch (Exception e) {
            log.error("Error importing buses from file", e);
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

    private List<BusImportRequest> parseCSVFile(MultipartFile file) throws Exception {
        List<BusImportRequest> requests = new ArrayList<>();
        
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            boolean firstLine = true;
            
            while ((line = reader.readLine()) != null) {
                if (firstLine) {
                    firstLine = false;
                    continue; // Skip header
                }
                
                String[] fields = line.split(",");
                if (fields.length >= 3) {
                    String operatorName = fields.length > 0 ? fields[0].trim() : "";
                    String ntcRegNumber = fields.length > 1 ? fields[1].trim() : "";
                    String plateNumber = fields.length > 2 ? fields[2].trim() : "";
                    Integer capacity = null;
                    try {
                        capacity = fields.length > 3 && !fields[3].trim().isEmpty() ? 
                                Integer.parseInt(fields[3].trim()) : null;
                    } catch (NumberFormatException e) {
                        // Will be handled during validation
                    }
                    String model = fields.length > 4 ? fields[4].trim() : "";
                    String facilities = fields.length > 5 ? fields[5].trim() : "";
                    String status = fields.length > 6 ? fields[6].trim() : "active";
                    
                    requests.add(new BusImportRequest(operatorName, ntcRegNumber, plateNumber, 
                            capacity, model, facilities, status));
                }
            }
        }
        
        return requests;
    }

    private BusRequest convertToBusRequest(BusImportRequest importRequest) throws Exception {
        BusRequest request = new BusRequest();
        
        // Find operator by name
        List<Operator> operators = operatorRepository.findAll().stream()
                .filter(op -> op.getName().equalsIgnoreCase(importRequest.getOperatorName()))
                .collect(Collectors.toList());
        
        if (operators.isEmpty()) {
            throw new ResourceNotFoundException("Operator not found with name: " + importRequest.getOperatorName());
        }
        
        request.setOperatorId(operators.get(0).getId());
        request.setNtcRegistrationNumber(importRequest.getNtcRegistrationNumber());
        request.setPlateNumber(importRequest.getPlateNumber());
        request.setCapacity(importRequest.getCapacity() != null ? importRequest.getCapacity() : 30);
        request.setModel(importRequest.getModel());
        request.setStatus(importRequest.getStatus() != null ? 
                importRequest.getStatus().toLowerCase() : "active");
        
        // Parse facilities JSON if provided
        if (importRequest.getFacilities() != null && !importRequest.getFacilities().trim().isEmpty()) {
            try {
                JsonNode facilitiesJson = objectMapper.readTree(importRequest.getFacilities());
                request.setFacilities(facilitiesJson);
            } catch (Exception e) {
                // Use as simple string if not valid JSON
                request.setFacilities(objectMapper.createObjectNode().put("description", importRequest.getFacilities()));
            }
        }
        
        return request;
    }

    private BusImportResponse.ImportError createImportError(int rowNumber, String field, 
            String value, String errorMessage, String suggestion) {
        BusImportResponse.ImportError error = new BusImportResponse.ImportError();
        error.setRowNumber(rowNumber);
        error.setField(field);
        error.setValue(value);
        error.setErrorMessage(errorMessage);
        error.setSuggestion(suggestion);
        return error;
    }

    private void validateBusRequest(BusRequest request) {
        if (request.getCapacity() <= 0) {
            throw new ConflictException("Capacity must be positive");
        }
        try {
            StatusEnum.valueOf(request.getStatus());
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid status: " + request.getStatus());
        }
    }

    private Operator validateAndGetOperator(UUID operatorId) {
        return operatorRepository.findById(operatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Operator not found with id: " + operatorId));
    }

    private Bus mapToBus(BusRequest request, String userId, Operator operator) {
        Bus bus = new Bus();
        // Manually map fields to avoid ID conflicts
        bus.setNtcRegistrationNumber(request.getNtcRegistrationNumber());
        bus.setPlateNumber(request.getPlateNumber());
        bus.setCapacity(request.getCapacity());
        bus.setModel(request.getModel());
        bus.setFacilities(request.getFacilities());
        bus.setOperator(operator);
        
        try {
            bus.setStatus(StatusEnum.valueOf(request.getStatus()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid status: " + request.getStatus());
        }
        bus.setCreatedBy(userId);
        bus.setUpdatedBy(userId);
        // Don't set the ID - let JPA generate it
        return bus;
    }

    private BusResponse mapToResponse(Bus bus) {
        BusResponse response = mapperUtils.map(bus, BusResponse.class);
        response.setOperatorId(bus.getOperator().getId());
        response.setOperatorName(bus.getOperator().getName());
        return response;
    }
}
