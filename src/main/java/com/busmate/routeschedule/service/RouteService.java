package com.busmate.routeschedule.service;

import com.busmate.routeschedule.dto.response.RouteResponse;
import com.busmate.routeschedule.enums.DirectionEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
            Double minDistance,
            Double maxDistance,
            Integer minDuration,
            Integer maxDuration,
            Pageable pageable);
    Page<RouteResponse> getAllRoutesWithSearchAndFilters(
            String searchText,
            UUID routeGroupId,
            DirectionEnum direction,
            Double minDistance,
            Double maxDistance,
            Integer minDuration,
            Integer maxDuration,
            Pageable pageable);
    
    // Filter options methods
    List<DirectionEnum> getDistinctDirections();
    List<Map<String, Object>> getDistinctRouteGroups();
    Map<String, Object> getDistanceRange();
    Map<String, Object> getDurationRange();
    List<RouteResponse> getRoutesByRouteGroupId(UUID routeGroupId);
}