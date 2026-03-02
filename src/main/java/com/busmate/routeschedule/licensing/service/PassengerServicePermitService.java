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
}
