package com.busmate.routeschedule.service;

import com.busmate.routeschedule.dto.response.RouteResponse;
import com.busmate.routeschedule.dto.response.RouteFilterOptionsResponse;
import com.busmate.routeschedule.dto.response.statistic.RouteStatisticsResponse;
import com.busmate.routeschedule.dto.request.RouteUnifiedImportRequest;
import com.busmate.routeschedule.dto.response.importing.RouteUnifiedImportResponse;
import com.busmate.routeschedule.enums.DirectionEnum;
import com.busmate.routeschedule.enums.RoadTypeEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface RouteService {
    RouteResponse getRouteById(UUID id);
    List<RouteResponse> getAllRoutes();
    Page<RouteResponse> getAllRoutes(Pageable pageable);
    Page<RouteResponse> getAllRoutesWithSearch(String searchText, Pageable pageable);
    Page<RouteResponse> getAllRoutesWithFilters(
            UUID routeGroupId,
            DirectionEnum direction,
            RoadTypeEnum roadType,
            Double minDistance,
            Double maxDistance,
            Integer minDuration,
            Integer maxDuration,
            Pageable pageable);
    Page<RouteResponse> getAllRoutesWithSearchAndFilters(
            String searchText,
            UUID routeGroupId,
            DirectionEnum direction,
            RoadTypeEnum roadType,
            Double minDistance,
            Double maxDistance,
            Integer minDuration,
            Integer maxDuration,
            Pageable pageable);
    
    // Filter options method - consolidated
    RouteFilterOptionsResponse getFilterOptions();
    List<RouteResponse> getRoutesByRouteGroupId(UUID routeGroupId);
    
    // Statistics methods
    RouteStatisticsResponse getStatistics();
    
    // Unified Import methods
    RouteUnifiedImportResponse importRoutesUnified(MultipartFile file, RouteUnifiedImportRequest importRequest, String userId);
}