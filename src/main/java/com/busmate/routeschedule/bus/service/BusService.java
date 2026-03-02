package com.busmate.routeschedule.bus.service;

import com.busmate.routeschedule.bus.dto.request.BusRequest;
import com.busmate.routeschedule.bus.dto.response.BusResponse;
import com.busmate.routeschedule.bus.dto.response.BusFilterOptionsResponse;
import com.busmate.routeschedule.bus.dto.response.BusStatisticsResponse;
import com.busmate.routeschedule.bus.dto.response.BusImportResponse;
import com.busmate.routeschedule.common.enums.StatusEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface BusService {
    BusResponse createBus(BusRequest request, String userId);
    BusResponse getBusById(UUID id);
    List<BusResponse> getAllBuses();
    Page<BusResponse> getAllBuses(Pageable pageable);
    Page<BusResponse> getAllBusesWithFilters(String searchText, UUID operatorId, StatusEnum status, 
                                           Integer minCapacity, Integer maxCapacity, Pageable pageable);
    BusResponse updateBus(UUID id, BusRequest request, String userId);
    void deleteBus(UUID id);
    
    // New methods for enhanced functionality
    BusFilterOptionsResponse getFilterOptions();
    BusStatisticsResponse getStatistics();
    BusImportResponse importBuses(MultipartFile file, String userId);
}
