package com.busmate.routeschedule.network.service;

import com.busmate.routeschedule.network.dto.response.RouteResponse;
import com.busmate.routeschedule.network.dto.response.RouteFilterOptionsResponse;
import com.busmate.routeschedule.network.dto.response.RouteStatisticsResponse;
import com.busmate.routeschedule.network.dto.request.RouteUnifiedImportRequest;
import com.busmate.routeschedule.network.dto.response.RouteUnifiedImportResponse;
import com.busmate.routeschedule.network.dto.request.RouteExportRequest;
import com.busmate.routeschedule.network.dto.response.RouteExportResponse;
import com.busmate.routeschedule.network.enums.DirectionEnum;
import com.busmate.routeschedule.network.enums.RoadTypeEnum;
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
    
    // Statistics methods
    RouteStatisticsResponse getStatistics();
    
    // Unified Import methods
    RouteUnifiedImportResponse importRoutesUnified(MultipartFile file, RouteUnifiedImportRequest importRequest, String userId);
    
    // Export methods
    RouteExportResponse exportRoutes(RouteExportRequest request, String userId);
}