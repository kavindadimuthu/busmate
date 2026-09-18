package com.busmate.routeschedule.licensing.service;

import com.busmate.routeschedule.licensing.dto.request.PassengerServicePermitRequest;
import com.busmate.routeschedule.licensing.dto.response.PassengerServicePermitResponse;
import com.busmate.routeschedule.licensing.dto.response.PassengerServicePermitFilterOptionsResponse;
import com.busmate.routeschedule.licensing.dto.response.PassengerServicePermitStatisticsResponse;
import com.busmate.routeschedule.licensing.dto.response.PassengerServicePermitImportResponse;
import com.busmate.routeschedule.shared.dto.PaginatedResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;
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
    
    // New methods for enhanced functionality
    PassengerServicePermitFilterOptionsResponse getFilterOptions();
    PassengerServicePermitStatisticsResponse getStatistics();
    PassengerServicePermitImportResponse importPermitsFromCsv(MultipartFile file, String userId);
    byte[] getImportTemplate();

    // INC-017: operator self-service and MOT suspension
    PaginatedResponse<PassengerServicePermitResponse> getPermitsForOperator(UUID operatorId, String status, String permitType, String search, Pageable pageable);
    PassengerServicePermitResponse createPermitForOperator(UUID operatorId, com.busmate.routeschedule.licensing.dto.request.OperatorPermitRequest request, String userId);
    PassengerServicePermitResponse updatePermitForOperator(UUID operatorId, UUID permitId, com.busmate.routeschedule.licensing.dto.request.OperatorPermitRequest request, String userId);
    /** @param operatorId the owning operator, or null when MOT withdraws it */
    PassengerServicePermitResponse withdrawPermit(UUID operatorId, UUID permitId, String reason, String userId);
    PassengerServicePermitResponse suspendPermit(UUID permitId, String reason, String userId);
    PassengerServicePermitResponse reinstatePermit(UUID permitId, String userId);
    long countUpcomingTrips(UUID permitId);
    com.busmate.routeschedule.licensing.entity.PassengerServicePermit requireOwnedPermit(UUID operatorId, UUID permitId);
}
