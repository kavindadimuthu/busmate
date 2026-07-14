package com.busmate.routeschedule.network.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.busmate.routeschedule.network.dto.request.RouteRequest;
import com.busmate.routeschedule.network.dto.response.RouteFilterOptionsResponse;
import com.busmate.routeschedule.network.dto.response.RouteResponse;
import com.busmate.routeschedule.network.dto.response.RouteStatisticsResponse;
import com.busmate.routeschedule.network.enums.DirectionEnum;
import com.busmate.routeschedule.network.enums.RoadTypeEnum;

public interface RouteService {
    RouteResponse getRouteById(UUID id);
    List<RouteResponse> getAllRoutes();
    Page<RouteResponse> getAllRoutes(Pageable pageable);

    // Independent route CRUD
    RouteResponse createRoute(RouteRequest request, String userId);
    RouteResponse updateRoute(UUID id, RouteRequest request, String userId);
    void deleteRoute(UUID id);

    /** Unified search+filter method – replaces the 3 former search/filter variants. */
    Page<RouteResponse> getAllRoutes(
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
}