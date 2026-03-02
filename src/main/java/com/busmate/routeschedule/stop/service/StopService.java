package com.busmate.routeschedule.stop.service;

import com.busmate.routeschedule.stop.dto.request.StopRequest;
import com.busmate.routeschedule.stop.dto.request.StopExportRequest;
import com.busmate.routeschedule.stop.dto.response.StopResponse;
import com.busmate.routeschedule.stop.dto.response.StopFilterOptionsResponse;
import com.busmate.routeschedule.stop.dto.response.StopStatisticsResponse;
import com.busmate.routeschedule.stop.dto.response.StopImportResponse;
import com.busmate.routeschedule.stop.dto.response.StopExportResponse;
import com.busmate.routeschedule.stop.dto.response.StopBulkUpdateResponse;

import com.busmate.routeschedule.stop.dto.request.StopBulkUpdateRequest;
import com.busmate.routeschedule.route.dto.response.RouteStopDetailResponse;
import com.busmate.routeschedule.route.dto.response.RouteGroupStopDetailResponse;
import com.busmate.routeschedule.schedule.dto.response.ScheduleStopDetailResponse;
import com.busmate.routeschedule.stop.dto.response.StopExistsResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.UUID;

public interface StopService {
    StopResponse createStop(StopRequest request, String userId);
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