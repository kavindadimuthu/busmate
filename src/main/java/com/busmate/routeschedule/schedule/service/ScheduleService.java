package com.busmate.routeschedule.schedule.service;

import com.busmate.routeschedule.schedule.dto.request.ScheduleRequest;
import com.busmate.routeschedule.schedule.dto.request.ScheduleCalendarRequest;
import com.busmate.routeschedule.schedule.dto.request.ScheduleExceptionRequest;
import com.busmate.routeschedule.schedule.dto.request.ScheduleCsvImportRequest;
import com.busmate.routeschedule.schedule.dto.response.ScheduleResponse;
import com.busmate.routeschedule.schedule.dto.response.ScheduleCsvImportResponse;
import com.busmate.routeschedule.schedule.enums.ScheduleTypeEnum;
import com.busmate.routeschedule.schedule.enums.ScheduleStatusEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface ScheduleService {
    // Core CRUD operations
    ScheduleResponse createSchedule(ScheduleRequest request, String userId);
    ScheduleResponse createScheduleFull(ScheduleRequest request, String userId);
    List<ScheduleResponse> createBulkSchedules(List<ScheduleRequest> requests, String userId);
    
    ScheduleResponse getScheduleById(UUID id);
    List<ScheduleResponse> getAllSchedules();
    Page<ScheduleResponse> getAllSchedules(Pageable pageable);
    Page<ScheduleResponse> getSchedulesByRoute(UUID routeId, ScheduleStatusEnum status, Pageable pageable); // Changed type
    Page<ScheduleResponse> getSchedulesWithFilters(
            UUID routeId, 
            UUID routeGroupId,
            ScheduleTypeEnum scheduleType,
            ScheduleStatusEnum status, // Changed type
            String searchText,
            Pageable pageable);
    
    ScheduleResponse updateSchedule(UUID id, ScheduleRequest request, String userId);
    ScheduleResponse updateScheduleFull(UUID id, ScheduleRequest request, String userId);
    void deleteSchedule(UUID id);
    
    // Status management
    ScheduleResponse updateScheduleStatus(UUID id, ScheduleStatusEnum status, String userId); // Changed type
    ScheduleResponse activateSchedule(UUID id, String userId);
    ScheduleResponse deactivateSchedule(UUID id, String userId);
    
    // Calendar management
    ScheduleResponse updateScheduleCalendar(UUID id, ScheduleCalendarRequest request, String userId);
    
    // Exception management
    ScheduleResponse addScheduleException(UUID id, ScheduleExceptionRequest request, String userId);
    ScheduleResponse removeScheduleException(UUID id, UUID exceptionId, String userId);
    List<ScheduleResponse.ScheduleExceptionResponse> getScheduleExceptions(UUID id);
    
    // Clone functionality
    ScheduleResponse cloneSchedule(UUID id, ScheduleRequest request, String userId);
    
    // CSV Import operations
    ScheduleCsvImportResponse importSchedulesFromCsv(MultipartFile file, ScheduleCsvImportRequest options, String userId);
    byte[] getScheduleImportTemplate();
    
    // Filter options
    List<ScheduleTypeEnum> getDistinctScheduleTypes();
    List<ScheduleStatusEnum> getDistinctStatuses();
    Map<String, Object> getScheduleStatistics();
}