package com.busmate.routeschedule.service.impl;

import com.busmate.routeschedule.dto.response.RouteResponse;
import com.busmate.routeschedule.entity.Route;
import com.busmate.routeschedule.entity.Stop;
import com.busmate.routeschedule.enums.DirectionEnum;
import com.busmate.routeschedule.exception.ResourceNotFoundException;
import com.busmate.routeschedule.repository.RouteRepository;
import com.busmate.routeschedule.repository.StopRepository;
import com.busmate.routeschedule.service.RouteService;
import com.busmate.routeschedule.util.MapperUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RouteServiceImpl implements RouteService {
    private final RouteRepository routeRepository;
    private final StopRepository stopRepository;
    private final MapperUtils mapperUtils;

    @Override
    public RouteResponse getRouteById(UUID id) {
        Route route = routeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + id));
        return mapToResponse(route);
    }

    @Override
    public List<RouteResponse> getAllRoutes() {
        return routeRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<RouteResponse> getAllRoutes(Pageable pageable) {
        Page<Route> routes = routeRepository.findAll(pageable);
        return routes.map(this::mapToResponse);
    }

    @Override
    public Page<RouteResponse> getAllRoutesWithSearch(String searchText, Pageable pageable) {
        Page<Route> routes = routeRepository.findAllWithSearch(searchText, pageable);
        return routes.map(this::mapToResponse);
    }

    @Override
    public Page<RouteResponse> getAllRoutesWithFilters(
            UUID routeGroupId,
            DirectionEnum direction,
            Double minDistance,
            Double maxDistance,
            Integer minDuration,
            Integer maxDuration,
            Pageable pageable) {
        Page<Route> routes = routeRepository.findAllWithFilters(
                routeGroupId, direction, minDistance, maxDistance, minDuration, maxDuration, pageable);
        return routes.map(this::mapToResponse);
    }

    @Override
    public Page<RouteResponse> getAllRoutesWithSearchAndFilters(
            String searchText,
            UUID routeGroupId,
            DirectionEnum direction,
            Double minDistance,
            Double maxDistance,
            Integer minDuration,
            Integer maxDuration,
            Pageable pageable) {
        Page<Route> routes = routeRepository.findAllWithSearchAndFilters(
                searchText, routeGroupId, direction, minDistance, maxDistance, minDuration, maxDuration, pageable);
        return routes.map(this::mapToResponse);
    }

    @Override
    public List<DirectionEnum> getDistinctDirections() {
        return routeRepository.findDistinctDirections();
    }

    @Override
    public List<Map<String, Object>> getDistinctRouteGroups() {
        List<Object[]> results = routeRepository.findDistinctRouteGroups();
        return results.stream().map(result -> {
            Map<String, Object> routeGroup = new HashMap<>();
            routeGroup.put("id", result[0]);
            routeGroup.put("name", result[1]);
            return routeGroup;
        }).collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> getDistanceRange() {
        List<Object[]> results = routeRepository.findDistanceRange();
        Map<String, Object> range = new HashMap<>();
        if (!results.isEmpty() && results.get(0) != null) {
            Object[] result = results.get(0);
            range.put("min", result[0]);
            range.put("max", result[1]);
        } else {
            range.put("min", 0.0);
            range.put("max", 0.0);
        }
        return range;
    }

    @Override
    public Map<String, Object> getDurationRange() {
        List<Object[]> results = routeRepository.findDurationRange();
        Map<String, Object> range = new HashMap<>();
        if (!results.isEmpty() && results.get(0) != null) {
            Object[] result = results.get(0);
            range.put("min", result[0]);
            range.put("max", result[1]);
        } else {
            range.put("min", 0);
            range.put("max", 0);
        }
        return range;
    }

    @Override
    public List<RouteResponse> getRoutesByRouteGroupId(UUID routeGroupId) {
        List<Route> routes = routeRepository.findByRouteGroup_Id(routeGroupId);
        return routes.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private RouteResponse mapToResponse(Route route) {
        RouteResponse response = mapperUtils.map(route, RouteResponse.class);
        
        if (route.getRouteGroup() != null) {
            response.setRouteGroupId(route.getRouteGroup().getId());
            response.setRouteGroupName(route.getRouteGroup().getName());
        }

        Stop startStop = stopRepository.findById(route.getStartStopId()).orElse(null);
        if (startStop != null) {
            response.setStartStopName(startStop.getName());
            response.setStartStopLocation(mapperUtils.map(startStop.getLocation(), com.busmate.routeschedule.dto.common.LocationDto.class));
        }

        Stop endStop = stopRepository.findById(route.getEndStopId()).orElse(null);
        if (endStop != null) {
            response.setEndStopName(endStop.getName());
            response.setEndStopLocation(mapperUtils.map(endStop.getLocation(), com.busmate.routeschedule.dto.common.LocationDto.class));
        }

        if (route.getRouteStops() != null) {
            List<RouteResponse.RouteStopResponse> routeStopResponses = route.getRouteStops().stream().map(rs -> {
                RouteResponse.RouteStopResponse rsResponse = new RouteResponse.RouteStopResponse();
                rsResponse.setStopId(rs.getStop().getId());
                rsResponse.setStopName(rs.getStop().getName());
                rsResponse.setLocation(mapperUtils.map(rs.getStop().getLocation(), com.busmate.routeschedule.dto.common.LocationDto.class));
                rsResponse.setStopOrder(rs.getStopOrder());
                rsResponse.setDistanceFromStartKm(rs.getDistanceFromStartKm());
                return rsResponse;
            }).collect(Collectors.toList());
            response.setRouteStops(routeStopResponses);
        }

        return response;
    }
}