package com.busmate.routeschedule.service;

import com.busmate.routeschedule.dto.request.StopRequest;
import com.busmate.routeschedule.dto.response.StopResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
}