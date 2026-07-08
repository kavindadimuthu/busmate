package com.busmate.routeschedule.network.service.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.busmate.routeschedule.network.dto.request.RouteRequest;
import com.busmate.routeschedule.network.dto.response.RouteFilterOptionsResponse;
import com.busmate.routeschedule.network.dto.response.RouteResponse;
import com.busmate.routeschedule.network.dto.response.RouteStatisticsResponse;
import com.busmate.routeschedule.network.entity.Route;
import com.busmate.routeschedule.network.entity.RouteGroup;
import com.busmate.routeschedule.network.entity.RouteStop;
import com.busmate.routeschedule.network.entity.Stop;
import com.busmate.routeschedule.network.enums.DirectionEnum;
import com.busmate.routeschedule.network.enums.RoadTypeEnum;
import com.busmate.routeschedule.network.mapper.RouteMapper;
import com.busmate.routeschedule.network.repository.RouteGroupRepository;
import com.busmate.routeschedule.network.repository.RouteRepository;
import com.busmate.routeschedule.network.repository.StopRepository;
import com.busmate.routeschedule.network.repository.projection.DistanceRange;
import com.busmate.routeschedule.network.repository.projection.DistanceStatistics;
import com.busmate.routeschedule.network.repository.projection.DurationRange;
import com.busmate.routeschedule.network.repository.projection.DurationStatistics;
import com.busmate.routeschedule.network.repository.projection.RouteGroupSummary;
import com.busmate.routeschedule.network.repository.projection.RouteStatisticsProjection;
import com.busmate.routeschedule.network.service.RouteService;
import com.busmate.routeschedule.shared.exception.ConflictException;
import com.busmate.routeschedule.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class RouteServiceImpl implements RouteService {
    private final RouteRepository routeRepository;
    private final RouteGroupRepository routeGroupRepository;
    private final StopRepository stopRepository;
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

    // ─────────────── Independent Route CRUD ───────────────

    @Override
    @Transactional
    public RouteResponse createRoute(RouteRequest request, String userId) {
        RouteGroup routeGroup = routeGroupRepository.findById(request.getRouteGroupId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Route group not found with id: " + request.getRouteGroupId()));

        if (routeRepository.existsByNameAndRouteGroup_Id(request.getName(), routeGroup.getId())) {
            throw new ConflictException(
                    "Route with name '" + request.getName() + "' already exists in route group '" + routeGroup.getName() + "'");
        }

        Stop startStop = stopRepository.findById(request.getStartStopId())
                .orElseThrow(() -> new ResourceNotFoundException("Start stop not found with id: " + request.getStartStopId()));
        Stop endStop = stopRepository.findById(request.getEndStopId())
                .orElseThrow(() -> new ResourceNotFoundException("End stop not found with id: " + request.getEndStopId()));

        Route route = new Route();
        applyRouteFields(route, request, routeGroup, startStop, endStop, userId, true);

        Route saved = routeRepository.save(route);
        return routeMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public RouteResponse updateRoute(UUID id, RouteRequest request, String userId) {
        Route route = routeRepository.findByIdWithStops(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + id));

        RouteGroup routeGroup = routeGroupRepository.findById(request.getRouteGroupId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Route group not found with id: " + request.getRouteGroupId()));

        // Validate name uniqueness within route group, excluding this route
        if (routeRepository.existsByNameAndRouteGroup_IdAndIdNot(request.getName(), routeGroup.getId(), id)) {
            throw new ConflictException(
                    "Route with name '" + request.getName() + "' already exists in route group '" + routeGroup.getName() + "'");
        }

        Stop startStop = stopRepository.findById(request.getStartStopId())
                .orElseThrow(() -> new ResourceNotFoundException("Start stop not found with id: " + request.getStartStopId()));
        Stop endStop = stopRepository.findById(request.getEndStopId())
                .orElseThrow(() -> new ResourceNotFoundException("End stop not found with id: " + request.getEndStopId()));

        applyRouteFields(route, request, routeGroup, startStop, endStop, userId, false);

        Route saved = routeRepository.save(route);
        return routeMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteRoute(UUID id) {
        Route route = routeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + id));
        routeRepository.delete(route);
    }

    /**
     * Applies all scalar fields from a {@link RouteRequest} onto an existing or new {@link Route} entity.
     * Route stops are replaced in full when present in the request.
     */
    private void applyRouteFields(Route route, RouteRequest request,
                                  RouteGroup routeGroup, Stop startStop, Stop endStop,
                                  String userId, boolean isNew) {
        route.setName(request.getName());
        route.setNameSinhala(request.getNameSinhala());
        route.setNameTamil(request.getNameTamil());
        route.setRouteNumber(request.getRouteNumber());
        route.setDescription(request.getDescription());
        route.setRouteThrough(request.getRouteThrough());
        route.setRouteThroughSinhala(request.getRouteThroughSinhala());
        route.setRouteThroughTamil(request.getRouteThroughTamil());
        route.setRouteGroup(routeGroup);
        route.setStartStop(startStop);
        route.setEndStop(endStop);
        route.setDistanceKm(request.getDistanceKm());
        route.setEstimatedDurationMinutes(request.getEstimatedDurationMinutes());
        route.setUpdatedBy(userId);
        if (isNew) {
            route.setCreatedBy(userId);
        }

        try {
            route.setDirection(DirectionEnum.valueOf(request.getDirection()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid direction: " + request.getDirection());
        }

        if (request.getRoadType() != null && !request.getRoadType().trim().isEmpty()) {
            try {
                route.setRoadType(RoadTypeEnum.valueOf(request.getRoadType()));
            } catch (IllegalArgumentException e) {
                throw new ConflictException("Invalid road type: " + request.getRoadType());
            }
        }

        // Replace route stops when provided
        if (request.getRouteStops() != null) {
            List<RouteStop> existingStops = route.getRouteStops();
            if (existingStops == null) {
                existingStops = new ArrayList<>();
                route.setRouteStops(existingStops);
            }
            existingStops.clear();

            for (RouteRequest.RouteStopRequest rs : request.getRouteStops()) {
                Stop stop = stopRepository.findById(rs.getStopId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Stop not found with id: " + rs.getStopId()));
                RouteStop routeStop = new RouteStop();
                routeStop.setRoute(route);
                routeStop.setStop(stop);
                routeStop.setStopOrder(rs.getStopOrder());
                routeStop.setDistanceFromStartKm(rs.getDistanceFromStartKm());
                routeStop.setDistanceFromStartKmUnverified(rs.getDistanceFromStartKmUnverified());
                routeStop.setDistanceFromStartKmCalculated(rs.getDistanceFromStartKmCalculated());
                existingStops.add(routeStop);
            }
        }
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

        // ── 1. Consolidated numeric aggregates (1 query instead of ~12) ─────────
        RouteStatisticsProjection agg = routeRepository.getRouteStatisticsConsolidated();
        if (agg != null) {
            stats.setTotalRoutes(agg.getTotalRoutes());
            stats.setOutboundRoutes(agg.getOutboundCount());
            stats.setInboundRoutes(agg.getInboundCount());
            stats.setRoutesWithStops(agg.getRoutesWithStops());
            stats.setRoutesWithoutStops(agg.getRoutesWithoutStops());
            stats.setTotalRouteGroups(agg.getTotalRouteGroups());

            if (agg.getAvgDistance() != null) {
                stats.setAverageDistanceKm(agg.getAvgDistance());
                stats.setMinDistanceKm(agg.getMinDistance());
                stats.setMaxDistanceKm(agg.getMaxDistance());
                stats.setTotalDistanceKm(agg.getSumDistance());
            }

            if (agg.getAvgDuration() != null) {
                stats.setAverageDurationMinutes(agg.getAvgDuration());
                stats.setMinDurationMinutes(agg.getMinDuration() != null ? agg.getMinDuration().doubleValue() : null);
                stats.setMaxDurationMinutes(agg.getMaxDuration() != null ? agg.getMaxDuration().doubleValue() : null);
                stats.setTotalDurationMinutes(agg.getSumDuration() != null ? agg.getSumDuration().doubleValue() : null);
            }
        }

        // ── 2. Routes by route group (1 query) ──────────────────────────────────
        Map<String, Long> routesByGroup = new LinkedHashMap<>();
        routeRepository.countRoutesByRouteGroup().forEach(result ->
                routesByGroup.put(result.getRouteGroupName(), result.getCount()));
        stats.setRoutesByRouteGroup(routesByGroup);

        // ── 3. Routes by direction (1 query) ────────────────────────────────────
        Map<String, Long> routesByDirection = new LinkedHashMap<>();
        routeRepository.countRoutesByDirection().forEach(result ->
                routesByDirection.put(
                        result.getDirection() != null ? result.getDirection().toString() : "UNKNOWN",
                        result.getCount()));
        stats.setRoutesByDirection(routesByDirection);

        // ── 4. Route name extremes – distance (2 queries) ───────────────────────
        List<String> longestRoutes = routeRepository.findLongestRouteNames();
        stats.setLongestRoute(!longestRoutes.isEmpty() ? longestRoutes.get(0) : null);

        List<String> shortestRoutes = routeRepository.findShortestRouteNames();
        stats.setShortestRoute(!shortestRoutes.isEmpty() ? shortestRoutes.get(0) : null);

        // ── 5. Route name extremes – duration (2 queries) ───────────────────────
        List<String> longestDurationRoutes = routeRepository.findLongestDurationRouteNames();
        stats.setLongestDurationRoute(!longestDurationRoutes.isEmpty() ? longestDurationRoutes.get(0) : null);

        List<String> shortestDurationRoutes = routeRepository.findShortestDurationRouteNames();
        stats.setShortestDurationRoute(!shortestDurationRoutes.isEmpty() ? shortestDurationRoutes.get(0) : null);

        // ── Derived: average routes per group ────────────────────────────────────
        if (stats.getTotalRouteGroups() != null && stats.getTotalRouteGroups() > 0
                && stats.getTotalRoutes() != null) {
            stats.setAverageRoutesPerGroup(
                    stats.getTotalRoutes().doubleValue() / stats.getTotalRouteGroups().doubleValue());
        }

        return stats;
    }
}
