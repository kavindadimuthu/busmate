package com.busmate.routeschedule.service.impl;

import com.busmate.routeschedule.dto.request.BusRequest;
import com.busmate.routeschedule.dto.response.BusResponse;
import com.busmate.routeschedule.entity.Bus;
import com.busmate.routeschedule.entity.Operator;
import com.busmate.routeschedule.enums.StatusEnum;
import com.busmate.routeschedule.exception.ConflictException;
import com.busmate.routeschedule.exception.ResourceNotFoundException;
import com.busmate.routeschedule.repository.BusPassengerServicePermitAssignmentRepository;
import com.busmate.routeschedule.repository.BusRepository;
import com.busmate.routeschedule.repository.OperatorRepository;
import com.busmate.routeschedule.service.BusService;
import com.busmate.routeschedule.util.MapperUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BusServiceImpl implements BusService {
    private final BusRepository busRepository;
    private final OperatorRepository operatorRepository;
    private final BusPassengerServicePermitAssignmentRepository busPermitAssignmentRepository;
    private final MapperUtils mapperUtils;

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
