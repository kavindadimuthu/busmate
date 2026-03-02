package com.busmate.routeschedule.service.impl;

import com.busmate.routeschedule.dto.request.BusPassengerServicePermitAssignmentRequest;
import com.busmate.routeschedule.dto.response.BusPassengerServicePermitAssignmentResponse;
import com.busmate.routeschedule.entity.Bus;
import com.busmate.routeschedule.entity.PassengerServicePermit;
import com.busmate.routeschedule.entity.BusPassengerServicePermitAssignment;
import com.busmate.routeschedule.enums.RequestStatusEnum;
import com.busmate.routeschedule.enums.StatusEnum;
import com.busmate.routeschedule.exception.ConflictException;
import com.busmate.routeschedule.exception.ResourceNotFoundException;
import com.busmate.routeschedule.repository.BusPassengerServicePermitAssignmentRepository;
import com.busmate.routeschedule.repository.BusRepository;
import com.busmate.routeschedule.repository.PassengerServicePermitRepository;
import com.busmate.routeschedule.service.BusPassengerServicePermitAssignmentService;
import com.busmate.routeschedule.util.MapperUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BusPassengerServicePermitAssignmentServiceImpl implements BusPassengerServicePermitAssignmentService {
    private final BusPassengerServicePermitAssignmentRepository assignmentRepository;
    private final BusRepository busRepository;
    private final PassengerServicePermitRepository permitRepository;
    private final MapperUtils mapperUtils;

    @Override
    public BusPassengerServicePermitAssignmentResponse createAssignment(BusPassengerServicePermitAssignmentRequest request, String userId) {
        validateAssignmentRequest(request);
        Bus bus = validateAndGetBus(request.getBusId());
        PassengerServicePermit permit = validateAndGetPermit(request.getPassengerServicePermitId());
        validateBusPermitCompatibility(bus, permit);
        validateBusLimit(permit);

        if (assignmentRepository.existsByBusIdAndPassengerServicePermitIdAndStartDate(
                request.getBusId(), request.getPassengerServicePermitId(), request.getStartDate())) {
            throw new ConflictException("Assignment already exists for bus " + request.getBusId() +
                    ", permit " + request.getPassengerServicePermitId() + ", and start date " + request.getStartDate());
        }

        BusPassengerServicePermitAssignment assignment = mapToAssignment(request, userId, bus, permit);
        BusPassengerServicePermitAssignment savedAssignment = assignmentRepository.save(assignment);
        return mapToResponse(savedAssignment);
    }

    @Override
    public BusPassengerServicePermitAssignmentResponse getAssignmentById(UUID id) {
        BusPassengerServicePermitAssignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));
        return mapToResponse(assignment);
    }

    @Override
    public List<BusPassengerServicePermitAssignmentResponse> getAllAssignments() {
        return assignmentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public BusPassengerServicePermitAssignmentResponse updateAssignment(UUID id, BusPassengerServicePermitAssignmentRequest request, String userId) {
        BusPassengerServicePermitAssignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));

        validateAssignmentRequest(request);
        Bus bus = validateAndGetBus(request.getBusId());
        PassengerServicePermit permit = validateAndGetPermit(request.getPassengerServicePermitId());
        validateBusPermitCompatibility(bus, permit);
        validateBusLimit(permit, id);

        if (!assignment.getBus().getId().equals(request.getBusId()) ||
                !assignment.getPassengerServicePermit().getId().equals(request.getPassengerServicePermitId()) ||
                !assignment.getStartDate().equals(request.getStartDate())) {
            if (assignmentRepository.existsByBusIdAndPassengerServicePermitIdAndStartDate(
                    request.getBusId(), request.getPassengerServicePermitId(), request.getStartDate())) {
                throw new ConflictException("Assignment already exists for bus " + request.getBusId() +
                        ", permit " + request.getPassengerServicePermitId() + ", and start date " + request.getStartDate());
            }
        }

        // Store the original ID to avoid overwriting
        UUID originalId = assignment.getId();

        // Update fields manually to avoid ID conflicts
        assignment.setBus(bus);
        assignment.setPassengerServicePermit(permit);
        assignment.setStartDate(request.getStartDate());
        assignment.setEndDate(request.getEndDate());
        try {
            assignment.setRequestStatus(request.getRequestStatus() != null ?
                    RequestStatusEnum.valueOf(request.getRequestStatus()) : null);
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid request status: " + request.getRequestStatus());
        }
        try {
            assignment.setStatus(StatusEnum.valueOf(request.getStatus()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid status: " + request.getStatus());
        }

        // Ensure the ID remains unchanged
        assignment.setId(originalId);
        assignment.setUpdatedBy(userId);

        BusPassengerServicePermitAssignment updatedAssignment = assignmentRepository.save(assignment);
        return mapToResponse(updatedAssignment);
    }

    @Override
    public void deleteAssignment(UUID id) {
        BusPassengerServicePermitAssignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));

        assignmentRepository.deleteById(id);
    }

    private void validateAssignmentRequest(BusPassengerServicePermitAssignmentRequest request) {
        if (request.getEndDate() != null && request.getEndDate().isBefore(request.getStartDate())) {
            throw new ConflictException("End date cannot be before start date");
        }
        if (request.getRequestStatus() != null) {
            try {
                RequestStatusEnum.valueOf(request.getRequestStatus());
            } catch (IllegalArgumentException e) {
                throw new ConflictException("Invalid request status: " + request.getRequestStatus());
            }
        }
        try {
            StatusEnum.valueOf(request.getStatus());
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid status: " + request.getStatus());
        }
    }

    private Bus validateAndGetBus(UUID busId) {
        return busRepository.findById(busId)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + busId));
    }

    private PassengerServicePermit validateAndGetPermit(UUID permitId) {
        return permitRepository.findById(permitId)
                .orElseThrow(() -> new ResourceNotFoundException("Permit not found with id: " + permitId));
    }

    private void validateBusPermitCompatibility(Bus bus, PassengerServicePermit permit) {
        if (!bus.getOperator().getId().equals(permit.getOperator().getId())) {
            throw new ConflictException("Bus and permit must belong to the same operator");
        }
    }

    private void validateBusLimit(PassengerServicePermit permit, UUID... excludeAssignmentId) {
        long activeAssignments = assignmentRepository.countActiveAssignmentsByPermitId(permit.getId());
        if (excludeAssignmentId.length > 0) {
            BusPassengerServicePermitAssignment existing = assignmentRepository.findById(excludeAssignmentId[0]).orElse(null);
            if (existing != null && existing.getStatus() == StatusEnum.active &&
                    (existing.getEndDate() == null || !existing.getEndDate().isBefore(LocalDate.now()))) {
                activeAssignments--;
            }
        }
        if (activeAssignments >= permit.getMaximumBusAssigned()) {
            throw new ConflictException("Permit " + permit.getPermitNumber() + " has reached its maximum bus assignment limit of " +
                    permit.getMaximumBusAssigned());
        }
    }

    private BusPassengerServicePermitAssignment mapToAssignment(BusPassengerServicePermitAssignmentRequest request, String userId, Bus bus, PassengerServicePermit permit) {
        BusPassengerServicePermitAssignment assignment = mapperUtils.map(request, BusPassengerServicePermitAssignment.class);
        assignment.setId(null); // Ensure ID is null for new entities
        assignment.setBus(bus);
        assignment.setPassengerServicePermit(permit);
        try {
            assignment.setRequestStatus(request.getRequestStatus() != null ?
                    RequestStatusEnum.valueOf(request.getRequestStatus()) : null);
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid request status: " + request.getRequestStatus());
        }
        try {
            assignment.setStatus(StatusEnum.valueOf(request.getStatus()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid status: " + request.getStatus());
        }
        assignment.setCreatedBy(userId);
        assignment.setUpdatedBy(userId);
        return assignment;
    }

    private BusPassengerServicePermitAssignmentResponse mapToResponse(BusPassengerServicePermitAssignment assignment) {
        BusPassengerServicePermitAssignmentResponse response = mapperUtils.map(assignment, BusPassengerServicePermitAssignmentResponse.class);
        response.setBusId(assignment.getBus().getId());
        response.setBusPlateNumber(assignment.getBus().getPlateNumber());
        response.setPassengerServicePermitId(assignment.getPassengerServicePermit().getId());
        response.setPermitNumber(assignment.getPassengerServicePermit().getPermitNumber());
        return response;
    }
}
