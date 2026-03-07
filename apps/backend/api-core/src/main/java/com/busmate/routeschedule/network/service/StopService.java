package com.busmate.routeschedule.network.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.busmate.routeschedule.network.dto.request.StopBatchCreateRequest;
import com.busmate.routeschedule.network.dto.request.StopRequest;
import com.busmate.routeschedule.network.dto.response.RouteGroupStopDetailResponse;
import com.busmate.routeschedule.network.dto.response.RouteStopDetailResponse;
import com.busmate.routeschedule.network.dto.response.StopBatchCreateResponse;
import com.busmate.routeschedule.network.dto.response.StopExistsResponse;
import com.busmate.routeschedule.network.dto.response.StopFilterOptionsResponse;
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
}