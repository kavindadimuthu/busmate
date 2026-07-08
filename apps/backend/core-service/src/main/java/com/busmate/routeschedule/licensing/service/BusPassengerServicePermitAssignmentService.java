package com.busmate.routeschedule.licensing.service;

import com.busmate.routeschedule.licensing.dto.request.BusPassengerServicePermitAssignmentRequest;
import com.busmate.routeschedule.licensing.dto.response.BusPassengerServicePermitAssignmentResponse;
import java.util.List;
import java.util.UUID;

public interface BusPassengerServicePermitAssignmentService {
    BusPassengerServicePermitAssignmentResponse createAssignment(BusPassengerServicePermitAssignmentRequest request, String userId);
    BusPassengerServicePermitAssignmentResponse getAssignmentById(UUID id);
    List<BusPassengerServicePermitAssignmentResponse> getAllAssignments();
    BusPassengerServicePermitAssignmentResponse updateAssignment(UUID id, BusPassengerServicePermitAssignmentRequest request, String userId);
    void deleteAssignment(UUID id);
}
