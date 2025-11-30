package com.busmate.routeschedule.service;

import com.busmate.routeschedule.dto.request.StopRequest;
import com.busmate.routeschedule.dto.response.StopResponse;
import com.busmate.routeschedule.dto.response.StopStatisticsResponse;
import com.busmate.routeschedule.dto.response.StopImportResponse;
import com.busmate.routeschedule.dto.response.SimpleStopImportResponse;
import com.busmate.routeschedule.dto.response.RouteStopDetailResponse;
import com.busmate.routeschedule.dto.response.ScheduleStopDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.UUID;

public interface StopService {
    StopResponse createStop(StopRequest request, String userId);
    StopResponse getStopById(UUID id);
    List<StopResponse> getAllStops();
    Page<StopResponse> getAllStops(Pageable pageable);
    Page<StopResponse> getAllStopsWithSearch(String searchText, Pageable pageable);
    StopResponse updateStop(UUID id, StopRequest request, String userId);
    void deleteStop(UUID id);
    
    // Filter options methods
    List<String> getDistinctStates();
    List<Boolean> getDistinctAccessibilityStatuses();
    
    // New methods for route and schedule stop details
    List<RouteStopDetailResponse> getStopsByRoute(UUID routeId);
    List<ScheduleStopDetailResponse> getStopsWithScheduleBySchedule(UUID scheduleId);
    
    // Statistics methods
    StopStatisticsResponse getStatistics();
    
    // Import methods
    StopImportResponse importStops(MultipartFile file, String userId);
    
    // Simple import method for CSV with minimal data (stop_id,stop_name format)
    SimpleStopImportResponse importSimpleStops(MultipartFile file, String userId, String defaultCountry);
}