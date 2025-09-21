package com.busmate.routeschedule.service;

import com.busmate.routeschedule.dto.request.PassengerServicePermitRequest;
import com.busmate.routeschedule.dto.response.PassengerServicePermitResponse;
import com.busmate.routeschedule.dto.response.PaginatedResponse;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.UUID;

public interface PassengerServicePermitService {
    PassengerServicePermitResponse createPermit(PassengerServicePermitRequest request, String userId);
    PassengerServicePermitResponse getPermitById(UUID id);
    List<PassengerServicePermitResponse> getAllPermits();
    PaginatedResponse<PassengerServicePermitResponse> getPermits(Pageable pageable, String status, String permitType, String operatorName, String routeGroupName);
    List<PassengerServicePermitResponse> getPermitsByRouteGroupId(UUID routeGroupId);
    PassengerServicePermitResponse updatePermit(UUID id, PassengerServicePermitRequest request, String userId);
    void deletePermit(UUID id);
}
