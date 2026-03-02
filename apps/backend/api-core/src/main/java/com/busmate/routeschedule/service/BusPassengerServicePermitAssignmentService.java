package com.busmate.routeschedule.service;

import com.busmate.routeschedule.dto.request.BusPassengerServicePermitAssignmentRequest;
import com.busmate.routeschedule.dto.response.BusPassengerServicePermitAssignmentResponse;
import java.util.List;
import java.util.UUID;

public interface BusPassengerServicePermitAssignmentService {
    BusPassengerServicePermitAssignmentResponse createAssignment(BusPassengerServicePermitAssignmentRequest request, String userId);
    BusPassengerServicePermitAssignmentResponse getAssignmentById(UUID id);
    List<BusPassengerServicePermitAssignmentResponse> getAllAssignments();
    BusPassengerServicePermitAssignmentResponse updateAssignment(UUID id, BusPassengerServicePermitAssignmentRequest request, String userId);
    void deleteAssignment(UUID id);
}
