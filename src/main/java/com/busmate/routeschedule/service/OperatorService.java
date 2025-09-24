package com.busmate.routeschedule.service;

import com.busmate.routeschedule.dto.request.OperatorRequest;
import com.busmate.routeschedule.dto.response.OperatorResponse;
import com.busmate.routeschedule.dto.response.OperatorFilterOptionsResponse;
import com.busmate.routeschedule.dto.response.OperatorStatisticsResponse;
import com.busmate.routeschedule.dto.response.OperatorImportResponse;
import com.busmate.routeschedule.enums.OperatorTypeEnum;
import com.busmate.routeschedule.enums.StatusEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface OperatorService {
    OperatorResponse createOperator(OperatorRequest request, String userId);
    OperatorResponse getOperatorById(UUID id);
    List<OperatorResponse> getAllOperators();
    Page<OperatorResponse> getAllOperators(Pageable pageable);
    Page<OperatorResponse> getAllOperatorsWithFilters(String searchText, OperatorTypeEnum operatorType, StatusEnum status, Pageable pageable);
    OperatorResponse updateOperator(UUID id, OperatorRequest request, String userId);
    void deleteOperator(UUID id);
    
    // New methods for enhanced functionality
    OperatorFilterOptionsResponse getFilterOptions();
    OperatorStatisticsResponse getStatistics();
    OperatorImportResponse importOperators(MultipartFile file, String userId);
}
