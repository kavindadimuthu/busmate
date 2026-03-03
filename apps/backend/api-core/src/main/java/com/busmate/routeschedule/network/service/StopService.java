package com.busmate.routeschedule.network.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import com.busmate.routeschedule.network.dto.request.StopBatchCreateRequest;
import com.busmate.routeschedule.network.dto.request.StopBulkUpdateRequest;
import com.busmate.routeschedule.network.dto.request.StopExportRequest;
import com.busmate.routeschedule.network.dto.request.StopRequest;
import com.busmate.routeschedule.network.dto.response.RouteGroupStopDetailResponse;
import com.busmate.routeschedule.network.dto.response.RouteStopDetailResponse;
import com.busmate.routeschedule.network.dto.response.StopBatchCreateResponse;
import com.busmate.routeschedule.network.dto.response.StopBulkUpdateResponse;
import com.busmate.routeschedule.network.dto.response.StopExistsResponse;
import com.busmate.routeschedule.network.dto.response.StopExportResponse;
import com.busmate.routeschedule.network.dto.response.StopFilterOptionsResponse;
import com.busmate.routeschedule.network.dto.response.StopImportResponse;
import com.busmate.routeschedule.network.dto.response.StopResponse;
import com.busmate.routeschedule.network.dto.response.StopStatisticsResponse;
import com.busmate.routeschedule.scheduling.dto.response.ScheduleStopDetailResponse;

public interface StopService {
    StopResponse createStop(StopRequest request, String userId);
    StopBatchCreateResponse createStopsBatch(StopBatchCreateRequest request, String userId);
    StopResponse getStopById(UUID id);
    StopExistsResponse checkStopExists(String id, String name);
    List<StopResponse> getAllStops();
    Page<StopResponse> getAllStops(Pageable pageable);
    Page<StopResponse> getAllStopsWithSearch(String searchText, Pageable pageable);
    StopResponse updateStop(UUID id, StopRequest request, String userId);
    void deleteStop(UUID id);
    
    // Filter options method - consolidated
    StopFilterOptionsResponse getFilterOptions();
    
    // New methods for route and schedule stop details
    List<RouteStopDetailResponse> getStopsByRoute(UUID routeId);
    List<RouteGroupStopDetailResponse> getStopsByRouteGroup(UUID routeGroupId);
    List<ScheduleStopDetailResponse> getStopsWithScheduleBySchedule(UUID scheduleId);
    
    // Statistics methods
    StopStatisticsResponse getStatistics();
    
    // Import methods - Intelligent import supporting multiple CSV formats
    StopImportResponse importStops(MultipartFile file, String userId, String defaultCountry);
    
    // Export methods - Flexible export supporting multiple formats and filters
    StopExportResponse exportStops(StopExportRequest request, String userId);
    
    // Bulk update methods - Flexible bulk update supporting CSV files with various matching strategies
    StopBulkUpdateResponse bulkUpdateStops(MultipartFile csvFile, StopBulkUpdateRequest request, String userId);
}