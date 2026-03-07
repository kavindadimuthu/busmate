package com.busmate.routeschedule.network.service.impl;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.busmate.routeschedule.network.dto.response.RouteFilterOptionsResponse;
import com.busmate.routeschedule.network.dto.response.RouteResponse;
import com.busmate.routeschedule.network.dto.response.RouteStatisticsResponse;
import com.busmate.routeschedule.network.entity.Route;
import com.busmate.routeschedule.network.enums.DirectionEnum;
import com.busmate.routeschedule.network.enums.RoadTypeEnum;
import com.busmate.routeschedule.network.mapper.RouteMapper;
import com.busmate.routeschedule.network.repository.RouteGroupRepository;
import com.busmate.routeschedule.network.repository.RouteRepository;
import com.busmate.routeschedule.network.repository.projection.DistanceRange;
import com.busmate.routeschedule.network.repository.projection.DistanceStatistics;
import com.busmate.routeschedule.network.repository.projection.DurationRange;
import com.busmate.routeschedule.network.repository.projection.DurationStatistics;
import com.busmate.routeschedule.network.repository.projection.RouteGroupSummary;
import com.busmate.routeschedule.network.service.RouteService;
import com.busmate.routeschedule.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class RouteServiceImpl implements RouteService {
    private final RouteRepository routeRepository;
    private final RouteGroupRepository routeGroupRepository;
    private final RouteMapper routeMapper;

    @Override
    public RouteResponse getRouteById(UUID id) {
        Route route = routeRepository.findByIdWithStops(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + id));
        return routeMapper.toResponse(route);
    }

    @Override
    public List<RouteResponse> getAllRoutes() {
        return routeRepository.findAll().stream()
                .map(routeMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<RouteResponse> getAllRoutes(Pageable pageable) {
        return getAllRoutes(null, null, null, null, null, null, null, null, pageable);
    }

    @Override
    public Page<RouteResponse> getAllRoutes(
            String searchText,
            UUID routeGroupId,
            DirectionEnum direction,
            RoadTypeEnum roadType,
            Double minDistance,
            Double maxDistance,
            Integer minDuration,
            Integer maxDuration,
            Pageable pageable) {
        return routeRepository.findAllFiltered(
                searchText, routeGroupId, direction, roadType,
                minDistance, maxDistance, minDuration, maxDuration, pageable)
                .map(routeMapper::toResponse);
    }

    private List<DirectionEnum> getDistinctDirections() {
        return routeRepository.findDistinctDirections();
    }

    private List<com.busmate.routeschedule.network.enums.RoadTypeEnum> getDistinctRoadTypes() {
        return routeRepository.findDistinctRoadTypes();
    }

    private List<Map<String, Object>> getDistinctRouteGroups() {
        List<RouteGroupSummary> results = routeRepository.findDistinctRouteGroups();
        return results.stream().map(result -> {
            Map<String, Object> routeGroup = new HashMap<>();
            routeGroup.put("id", result.getId());
            routeGroup.put("name", result.getName());
            return routeGroup;
        }).collect(Collectors.toList());
    }

    private Map<String, Object> getDistanceRange() {
        DistanceRange result = routeRepository.findDistanceRange();
        Map<String, Object> range = new HashMap<>();
        if (result != null) {
            range.put("min", result.getMin());
            range.put("max", result.getMax());
        } else {
            range.put("min", 0.0);
            range.put("max", 0.0);
        }
        return range;
    }

    private Map<String, Object> getDurationRange() {
        DurationRange result = routeRepository.findDurationRange();
        Map<String, Object> range = new HashMap<>();
        if (result != null) {
            range.put("min", result.getMin());
            range.put("max", result.getMax());
        } else {
            range.put("min", 0);
            range.put("max", 0);
        }
        return range;
    }

    @Override
    public RouteFilterOptionsResponse getFilterOptions() {
        RouteFilterOptionsResponse response = new RouteFilterOptionsResponse();
        
        // Get directions
        response.setDirections(getDistinctDirections());
        
        // Get road types
        response.setRoadTypes(getDistinctRoadTypes());
        
        // Get route groups
        List<Map<String, Object>> routeGroups = getDistinctRouteGroups();
        response.setRouteGroups(routeGroups);
        
        // Get distance range
        DistanceRange distanceResult = routeRepository.findDistanceRange();
        RouteFilterOptionsResponse.RangeFilter distanceRange = new RouteFilterOptionsResponse.RangeFilter();
        if (distanceResult != null && distanceResult.getMin() != null) {
            distanceRange.setMin(distanceResult.getMin());
            distanceRange.setMax(distanceResult.getMax());
            
            // Calculate average and count for additional metadata
            DistanceStatistics distanceStats = routeRepository.getDistanceStatistics();
            if (distanceStats != null && distanceStats.getAvg() != null) {
                distanceRange.setAverage(distanceStats.getAvg());
                distanceRange.setCount(routeRepository.count()); // Total routes count
            }
        } else {
            distanceRange.setMin(0.0);
            distanceRange.setMax(0.0);
            distanceRange.setAverage(0.0);
            distanceRange.setCount(0L);
        }
        response.setDistanceRange(distanceRange);
        
        // Get duration range
        DurationRange durationResult = routeRepository.findDurationRange();
        RouteFilterOptionsResponse.RangeFilter durationRange = new RouteFilterOptionsResponse.RangeFilter();
        if (durationResult != null && durationResult.getMin() != null) {
            durationRange.setMin(durationResult.getMin().doubleValue());
            durationRange.setMax(durationResult.getMax().doubleValue());
            
            // Calculate average and count for additional metadata
            DurationStatistics durationStats = routeRepository.getDurationStatistics();
            if (durationStats != null && durationStats.getAvg() != null) {
                durationRange.setAverage(durationStats.getAvg());
                durationRange.setCount(routeRepository.count()); // Total routes count
            }
        } else {
            durationRange.setMin(0.0);
            durationRange.setMax(0.0);
            durationRange.setAverage(0.0);
            durationRange.setCount(0L);
        }
        response.setDurationRange(durationRange);
        
        // Set metadata
        RouteFilterOptionsResponse.FilterMetadata metadata = new RouteFilterOptionsResponse.FilterMetadata();
        metadata.setTotalRoutes(Math.toIntExact(routeRepository.count()));
        metadata.setTotalRouteGroups(routeGroups.size());
        metadata.setTotalDirections(response.getDirections().size());
        metadata.setHasDistanceData(distanceRange.getCount() > 0);
        metadata.setHasDurationData(durationRange.getCount() > 0);
        metadata.setDataSource("routes");
        response.setMetadata(metadata);
        
        return response;
    }

    private RouteResponse mapToResponse(Route route) {
        return routeMapper.toResponse(route);
    }

    @Override
    public RouteStatisticsResponse getStatistics() {
        RouteStatisticsResponse stats = new RouteStatisticsResponse();
        
        // Basic counts
        stats.setTotalRoutes(routeRepository.count());
        stats.setOutboundRoutes(routeRepository.countByDirection(DirectionEnum.OUTBOUND));
        stats.setInboundRoutes(routeRepository.countByDirection(DirectionEnum.INBOUND));
        stats.setRoutesWithStops(routeRepository.countRoutesWithStops());
        stats.setRoutesWithoutStops(routeRepository.countRoutesWithoutStops());
        stats.setTotalRouteGroups(routeRepository.countDistinctRouteGroups());
        
        // Routes by route group
        Map<String, Long> routesByGroup = new LinkedHashMap<>();
        routeRepository.countRoutesByRouteGroup().forEach(result -> 
            routesByGroup.put(result.getRouteGroupName(), result.getCount()));
        stats.setRoutesByRouteGroup(routesByGroup);
        
        // Routes by direction
        Map<String, Long> routesByDirection = new LinkedHashMap<>();
        routeRepository.countRoutesByDirection().forEach(result -> 
            routesByDirection.put(result.getDirection() != null ? result.getDirection().toString() : "UNKNOWN", result.getCount()));
        stats.setRoutesByDirection(routesByDirection);
        
        // Distance statistics
        DistanceStatistics distanceStats = routeRepository.getDistanceStatistics();
        if (distanceStats != null && distanceStats.getAvg() != null) {
            stats.setAverageDistanceKm(distanceStats.getAvg());
            stats.setTotalDistanceKm(distanceStats.getSum());
        }
        
        DistanceRange distanceRange = routeRepository.findDistanceRange();
        if (distanceRange != null && distanceRange.getMin() != null) {
            stats.setMinDistanceKm(distanceRange.getMin());
            stats.setMaxDistanceKm(distanceRange.getMax());
        }
        
        // Duration statistics
        DurationStatistics durationStats = routeRepository.getDurationStatistics();
        if (durationStats != null && durationStats.getAvg() != null) {
            stats.setAverageDurationMinutes(durationStats.getAvg());
            stats.setTotalDurationMinutes(durationStats.getSum().doubleValue());
        }
        
        DurationRange durationRange = routeRepository.findDurationRange();
        if (durationRange != null && durationRange.getMin() != null) {
            stats.setMinDurationMinutes(durationRange.getMin().doubleValue());
            stats.setMaxDurationMinutes(durationRange.getMax().doubleValue());
        }
        
        // Route name statistics
        List<String> longestRoutes = routeRepository.findLongestRouteNames();
        stats.setLongestRoute(!longestRoutes.isEmpty() ? longestRoutes.get(0) : null);
        
        List<String> shortestRoutes = routeRepository.findShortestRouteNames();
        stats.setShortestRoute(!shortestRoutes.isEmpty() ? shortestRoutes.get(0) : null);
        
        List<String> longestDurationRoutes = routeRepository.findLongestDurationRouteNames();
        stats.setLongestDurationRoute(!longestDurationRoutes.isEmpty() ? longestDurationRoutes.get(0) : null);
        
        List<String> shortestDurationRoutes = routeRepository.findShortestDurationRouteNames();
        stats.setShortestDurationRoute(!shortestDurationRoutes.isEmpty() ? shortestDurationRoutes.get(0) : null);
        
        // Average routes per group
        if (stats.getTotalRouteGroups() > 0) {
            stats.setAverageRoutesPerGroup(stats.getTotalRoutes().doubleValue() / stats.getTotalRouteGroups().doubleValue());
        }
        
        return stats;
    }
}
