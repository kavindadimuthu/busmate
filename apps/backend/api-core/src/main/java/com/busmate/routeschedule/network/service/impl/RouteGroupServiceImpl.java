package com.busmate.routeschedule.network.service.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.busmate.routeschedule.network.dto.request.RouteGroupRequest;
import com.busmate.routeschedule.network.dto.response.RouteGroupResponse;
import com.busmate.routeschedule.network.dto.response.RouteResponse;
import com.busmate.routeschedule.network.entity.Route;
import com.busmate.routeschedule.network.entity.RouteGroup;
import com.busmate.routeschedule.network.entity.RouteStop;
import com.busmate.routeschedule.network.entity.Stop;
import com.busmate.routeschedule.network.enums.DirectionEnum;
import com.busmate.routeschedule.network.mapper.RouteGroupMapper;
import com.busmate.routeschedule.network.mapper.RouteMapper;
import com.busmate.routeschedule.network.repository.RouteGroupRepository;
import com.busmate.routeschedule.network.repository.RouteRepository;
import com.busmate.routeschedule.network.repository.RouteStopRepository;
import com.busmate.routeschedule.network.repository.StopRepository;
import com.busmate.routeschedule.network.service.RouteGroupService;
import com.busmate.routeschedule.shared.exception.ConflictException;
import com.busmate.routeschedule.shared.exception.ResourceNotFoundException;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RouteGroupServiceImpl implements RouteGroupService {
    private final RouteGroupRepository routeGroupRepository;
    private final RouteRepository routeRepository;
    private final StopRepository stopRepository;
    private final RouteStopRepository routeStopRepository;
    private final RouteMapper routeMapper;
    private final RouteGroupMapper routeGroupMapper;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public RouteGroupResponse createRouteGroup(RouteGroupRequest request, String userId) {
        if (routeGroupRepository.existsByName(request.getName())) {
            throw new ConflictException("Route group with name " + request.getName() + " already exists");
        }

        RouteGroup routeGroup = new RouteGroup();
        routeGroup.setName(request.getName());
        routeGroup.setNameSinhala(request.getNameSinhala());
        routeGroup.setNameTamil(request.getNameTamil());
        routeGroup.setDescription(request.getDescription());
        routeGroup.setCreatedBy(userId);
        routeGroup.setUpdatedBy(userId);

        if (request.getRoutes() != null && !request.getRoutes().isEmpty()) {
            List<Route> routes = request.getRoutes().stream().map(r -> {
                Stop startStop = stopRepository.findById(r.getStartStopId())
                        .orElseThrow(() -> new ResourceNotFoundException("Start stop not found with id: " + r.getStartStopId()));
                Stop endStop = stopRepository.findById(r.getEndStopId())
                        .orElseThrow(() -> new ResourceNotFoundException("End stop not found with id: " + r.getEndStopId()));
                
                Route route = new Route();
                route.setName(r.getName());
                route.setNameSinhala(r.getNameSinhala());
                route.setNameTamil(r.getNameTamil());
                route.setRouteNumber(r.getRouteNumber());
                route.setDescription(r.getDescription());
                route.setRouteThrough(r.getRouteThrough());
                route.setRouteThroughSinhala(r.getRouteThroughSinhala());
                route.setRouteThroughTamil(r.getRouteThroughTamil());
                route.setRouteGroup(routeGroup);
                route.setStartStop(startStop);
                route.setEndStop(endStop);
                route.setDistanceKm(r.getDistanceKm());
                route.setEstimatedDurationMinutes(r.getEstimatedDurationMinutes());
                
                try {
                    route.setDirection(DirectionEnum.valueOf(r.getDirection()));
                } catch (IllegalArgumentException e) {
                    throw new ConflictException("Invalid direction: " + r.getDirection());
                }
                
                if (r.getRoadType() != null && !r.getRoadType().trim().isEmpty()) {
                    try {
                        route.setRoadType(com.busmate.routeschedule.network.enums.RoadTypeEnum.valueOf(r.getRoadType()));
                    } catch (IllegalArgumentException e) {
                        throw new ConflictException("Invalid road type: " + r.getRoadType());
                    }
                }
                
                if (r.getRouteStops() != null && !r.getRouteStops().isEmpty()) {
                    List<RouteStop> routeStops = r.getRouteStops().stream().map(rs -> {
                        Stop stop = stopRepository.findById(rs.getStopId())
                                .orElseThrow(() -> new ResourceNotFoundException("Stop not found with id: " + rs.getStopId()));
                        RouteStop routeStop = new RouteStop();
                        routeStop.setRoute(route);
                        routeStop.setStop(stop);
                        routeStop.setStopOrder(rs.getStopOrder());
                        routeStop.setDistanceFromStartKm(rs.getDistanceFromStartKm());
                        routeStop.setDistanceFromStartKmUnverified(rs.getDistanceFromStartKmUnverified());
                        routeStop.setDistanceFromStartKmCalculated(rs.getDistanceFromStartKmCalculated());
                        return routeStop;
                    }).collect(Collectors.toList());
                    route.setRouteStops(routeStops);
                }
                return route;
            }).collect(Collectors.toList());
            routeGroup.setRoutes(routes);
        }

        RouteGroup savedRouteGroup = routeGroupRepository.save(routeGroup);
        return mapToResponse(savedRouteGroup);
    }

    @Override
    public RouteGroupResponse getRouteGroupById(UUID id) {
        RouteGroup routeGroup = routeGroupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route group not found with id: " + id));
        return mapToResponse(routeGroup);
    }

    @Override
    public List<RouteGroupResponse> getAllRouteGroups() {
        return routeGroupRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<RouteGroupResponse> getAllRouteGroups(Pageable pageable) {
        Page<RouteGroup> routeGroups = routeGroupRepository.findAll(pageable);
        return routeGroups.map(this::mapToResponse);
    }

    @Override
    public Page<RouteGroupResponse> getAllRouteGroupsWithSearch(String searchText, Pageable pageable) {
        Page<RouteGroup> routeGroups = routeGroupRepository.findAllWithSearch(searchText, pageable);
        return routeGroups.map(this::mapToResponse);
    }

    @Override
    @Transactional
    public RouteGroupResponse updateRouteGroup(UUID id, RouteGroupRequest request, String userId) {
        // Fix null version fields in the database BEFORE Hibernate loads entities.
        // Hibernate's EntityEntry tracks the DB-loaded version internally; Java setters cannot fix it.
        // Native SQL ensures Hibernate loads version=0 instead of null, preventing NPE on flush.
        fixNullVersions(id);

        RouteGroup routeGroup = routeGroupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route group not found with id: " + id));

        // Check if the name is being changed and if it already exists for a different route group
        if (!routeGroup.getName().equals(request.getName()) &&
                routeGroupRepository.existsByNameAndIdNot(request.getName(), id)) {
            throw new ConflictException("Route group with name " + request.getName() + " already exists");
        }

        routeGroup.setName(request.getName());
        routeGroup.setNameSinhala(request.getNameSinhala());
        routeGroup.setNameTamil(request.getNameTamil());
        routeGroup.setDescription(request.getDescription());
        routeGroup.setUpdatedBy(userId);

        if (request.getRoutes() != null) {
            updateRoutes(routeGroup, request.getRoutes(), userId);
        }

        RouteGroup updatedRouteGroup = routeGroupRepository.save(routeGroup);
        return mapToResponse(updatedRouteGroup);
    }

    @Override
    @Transactional
    public void deleteRouteGroup(UUID id) {
        RouteGroup routeGroup = routeGroupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route group not found with id: " + id));

        routeGroupRepository.delete(routeGroup);
    }

    private void updateRoutes(RouteGroup routeGroup, List<RouteGroupRequest.RouteRequest> routeRequests, String userId) {
        List<Route> existingRoutes = routeGroup.getRoutes();
        if (existingRoutes == null) {
            existingRoutes = new ArrayList<>();
            routeGroup.setRoutes(existingRoutes);
        }

        Map<UUID, Route> existingRoutesById = existingRoutes.stream()
                .filter(route -> route.getId() != null)
                .collect(Collectors.toMap(Route::getId, route -> route));

        Set<UUID> requestRouteIds = routeRequests.stream()
                .map(RouteGroupRequest.RouteRequest::getId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());

        List<Route> updatedRoutes = new ArrayList<>();

        for (RouteGroupRequest.RouteRequest routeRequest : routeRequests) {
            if (routeRequest.getId() != null) {
                Route existingRoute = existingRoutesById.get(routeRequest.getId());
                if (existingRoute != null) {
                    if (!existingRoute.getRouteGroup().getId().equals(routeGroup.getId())) {
                        throw new ConflictException("Route with id " + routeRequest.getId() + " does not belong to route group " + routeGroup.getId());
                    }
                    
                    // Check if the route name is being changed and if it already exists for a different route in the same group
                    if (!existingRoute.getName().equals(routeRequest.getName()) &&
                            routeRepository.existsByNameAndRouteGroup_IdAndIdNot(routeRequest.getName(), routeGroup.getId(), routeRequest.getId())) {
                        throw new ConflictException("Route with name '" + routeRequest.getName() + "' already exists in this route group");
                    }
                    
                    updateExistingRoute(existingRoute, routeRequest, userId);
                    updatedRoutes.add(existingRoute);
                } else {
                    throw new ResourceNotFoundException("Route with id " + routeRequest.getId() + " not found");
                }
            } else {
                if (routeRepository.existsByNameAndRouteGroup_Id(routeRequest.getName(), routeGroup.getId())) {
                    throw new ConflictException("Route with name '" + routeRequest.getName() + "' already exists in this route group");
                }
                
                Route newRoute = createNewRoute(routeRequest, routeGroup, userId);
                updatedRoutes.add(newRoute);
            }
        }

        // Remove routes that are no longer in the request
        List<Route> routesToRemove = new ArrayList<>();
        for (Route route : existingRoutes) {
            if (route.getId() != null && !requestRouteIds.contains(route.getId())) {
                routesToRemove.add(route);
            }
        }
        existingRoutes.removeAll(routesToRemove);
        
        // Add only truly new routes (existing ones were already updated in-place)
        for (Route route : updatedRoutes) {
            if (route.getId() == null) {
                existingRoutes.add(route);
            }
        }
    }

    /**
     * Fix null version fields in the database using native SQL.
     * This must run BEFORE Hibernate loads the entities, because Hibernate's EntityEntry
     * tracks the DB-loaded version internally. Java setters (entity.setVersion(0L)) do NOT
     * update EntityEntry — so Hibernate still sees null and throws NPE on flush.
     * By fixing the data via native SQL first, Hibernate will load version=0 and track it correctly.
     */
    private void fixNullVersions(UUID routeGroupId) {
        int rgFixed = entityManager.createNativeQuery(
                "UPDATE route_group SET version = 0 WHERE id = :id AND version IS NULL")
                .setParameter("id", routeGroupId)
                .executeUpdate();

        int routeFixed = entityManager.createNativeQuery(
                "UPDATE route SET version = 0 WHERE route_group_id = :rgId AND version IS NULL")
                .setParameter("rgId", routeGroupId)
                .executeUpdate();

        int stopFixed = entityManager.createNativeQuery(
                "UPDATE stop SET version = 0 WHERE version IS NULL AND id IN " +
                "(SELECT DISTINCT rs.stop_id FROM route_stop rs " +
                "JOIN route r ON rs.route_id = r.id WHERE r.route_group_id = :rgId)")
                .setParameter("rgId", routeGroupId)
                .executeUpdate();

        if (rgFixed > 0 || routeFixed > 0 || stopFixed > 0) {
            // Flush the native SQL and clear the persistence context so findById loads fresh data
            entityManager.flush();
            entityManager.clear();
        }
    }

    private RouteGroupResponse mapToResponse(RouteGroup routeGroup) {
        return routeGroupMapper.toResponse(routeGroup);
    }

    private RouteResponse mapRouteToResponse(Route route) {
        return routeMapper.toResponse(route);
    }

    private void updateExistingRoute(Route existingRoute, RouteGroupRequest.RouteRequest routeRequest, String userId) {
        Stop startStop = stopRepository.findById(routeRequest.getStartStopId())
                .orElseThrow(() -> new ResourceNotFoundException("Start stop not found with id: " + routeRequest.getStartStopId()));
        Stop endStop = stopRepository.findById(routeRequest.getEndStopId())
                .orElseThrow(() -> new ResourceNotFoundException("End stop not found with id: " + routeRequest.getEndStopId()));

        existingRoute.setName(routeRequest.getName());
        existingRoute.setNameSinhala(routeRequest.getNameSinhala());
        existingRoute.setNameTamil(routeRequest.getNameTamil());
        existingRoute.setRouteNumber(routeRequest.getRouteNumber());
        existingRoute.setDescription(routeRequest.getDescription());
        existingRoute.setRouteThrough(routeRequest.getRouteThrough());
        existingRoute.setRouteThroughSinhala(routeRequest.getRouteThroughSinhala());
        existingRoute.setRouteThroughTamil(routeRequest.getRouteThroughTamil());
        existingRoute.setStartStop(startStop);
        existingRoute.setEndStop(endStop);
        existingRoute.setDistanceKm(routeRequest.getDistanceKm());
        existingRoute.setEstimatedDurationMinutes(routeRequest.getEstimatedDurationMinutes());
        existingRoute.setUpdatedBy(userId);
        
        try {
            existingRoute.setDirection(DirectionEnum.valueOf(routeRequest.getDirection()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid direction: " + routeRequest.getDirection());
        }
        
        if (routeRequest.getRoadType() != null && !routeRequest.getRoadType().trim().isEmpty()) {
            try {
                existingRoute.setRoadType(com.busmate.routeschedule.network.enums.RoadTypeEnum.valueOf(routeRequest.getRoadType()));
            } catch (IllegalArgumentException e) {
                throw new ConflictException("Invalid road type: " + routeRequest.getRoadType());
            }
        }

        updateRouteStops(existingRoute, routeRequest.getRouteStops());
    }

    private void updateRouteStops(Route route, List<RouteGroupRequest.RouteRequest.RouteStopRequest> routeStopRequests) {
        if (routeStopRequests == null) {
            routeStopRequests = new ArrayList<>();
        }

        List<RouteStop> existingRouteStops = route.getRouteStops();
        if (existingRouteStops == null) {
            existingRouteStops = new ArrayList<>();
            route.setRouteStops(existingRouteStops);
        }

        Map<UUID, RouteStop> existingRouteStopsById = existingRouteStops.stream()
                .filter(rs -> rs.getId() != null)
                .collect(Collectors.toMap(RouteStop::getId, rs -> rs));

        // Also create a map by stop ID and stop order for matching route stops without IDs
        Map<String, RouteStop> existingRouteStopsByStopIdAndOrder = new HashMap<>();
        for (RouteStop rs : existingRouteStops) {
            if (rs.getStop() != null && rs.getStop().getId() != null) {
                String key = rs.getStop().getId() + "_" + rs.getStopOrder();
                existingRouteStopsByStopIdAndOrder.put(key, rs);
            }
        }

        Set<UUID> requestRouteStopIds = routeStopRequests.stream()
                .map(RouteGroupRequest.RouteRequest.RouteStopRequest::getId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());

        List<RouteStop> updatedRouteStops = new ArrayList<>();

        for (RouteGroupRequest.RouteRequest.RouteStopRequest routeStopRequest : routeStopRequests) {
            if (routeStopRequest.getId() != null) {
                RouteStop existingRouteStop = existingRouteStopsById.get(routeStopRequest.getId());
                if (existingRouteStop != null) {
                    if (!existingRouteStop.getRoute().getId().equals(route.getId())) {
                        throw new ConflictException("Route stop with id " + routeStopRequest.getId() + " does not belong to route " + route.getId());
                    }
                    
                    Stop stop = stopRepository.findById(routeStopRequest.getStopId())
                            .orElseThrow(() -> new ResourceNotFoundException("Stop not found with id: " + routeStopRequest.getStopId()));
                    
                    existingRouteStop.setStop(stop);
                    existingRouteStop.setStopOrder(routeStopRequest.getStopOrder());
                    existingRouteStop.setDistanceFromStartKm(routeStopRequest.getDistanceFromStartKm());
                    existingRouteStop.setDistanceFromStartKmUnverified(routeStopRequest.getDistanceFromStartKmUnverified());
                    existingRouteStop.setDistanceFromStartKmCalculated(routeStopRequest.getDistanceFromStartKmCalculated());
                    updatedRouteStops.add(existingRouteStop);
                } else {
                    throw new ResourceNotFoundException("Route stop with id " + routeStopRequest.getId() + " not found");
                }
            } else {
                // No ID provided - try to match by stop ID and order to avoid duplicates
                String matchKey = routeStopRequest.getStopId() + "_" + routeStopRequest.getStopOrder();
                RouteStop existingByMatch = existingRouteStopsByStopIdAndOrder.get(matchKey);
                
                if (existingByMatch != null) {
                    // Found an existing route stop with the same stop and order - reuse it
                    Stop stop = stopRepository.findById(routeStopRequest.getStopId())
                            .orElseThrow(() -> new ResourceNotFoundException("Stop not found with id: " + routeStopRequest.getStopId()));
                    
                    existingByMatch.setStop(stop);
                    existingByMatch.setStopOrder(routeStopRequest.getStopOrder());
                    existingByMatch.setDistanceFromStartKm(routeStopRequest.getDistanceFromStartKm());
                    existingByMatch.setDistanceFromStartKmUnverified(routeStopRequest.getDistanceFromStartKmUnverified());
                    existingByMatch.setDistanceFromStartKmCalculated(routeStopRequest.getDistanceFromStartKmCalculated());
                    updatedRouteStops.add(existingByMatch);
                    // Add to requestRouteStopIds so it won't be removed
                    requestRouteStopIds.add(existingByMatch.getId());
                } else {
                    // Truly new route stop
                    Stop stop = stopRepository.findById(routeStopRequest.getStopId())
                            .orElseThrow(() -> new ResourceNotFoundException("Stop not found with id: " + routeStopRequest.getStopId()));
                    
                    RouteStop newRouteStop = new RouteStop();
                    newRouteStop.setRoute(route);
                    newRouteStop.setStop(stop);
                    newRouteStop.setStopOrder(routeStopRequest.getStopOrder());
                    newRouteStop.setDistanceFromStartKm(routeStopRequest.getDistanceFromStartKm());
                    newRouteStop.setDistanceFromStartKmUnverified(routeStopRequest.getDistanceFromStartKmUnverified());
                    newRouteStop.setDistanceFromStartKmCalculated(routeStopRequest.getDistanceFromStartKmCalculated());
                    updatedRouteStops.add(newRouteStop);
                }
            }
        }

        // Remove route stops that are no longer in the request
        List<RouteStop> routeStopsToRemove = new ArrayList<>();
        for (RouteStop rs : existingRouteStops) {
            if (rs.getId() != null && !requestRouteStopIds.contains(rs.getId())) {
                routeStopsToRemove.add(rs);
            }
        }
        existingRouteStops.removeAll(routeStopsToRemove);
        
        // Add only truly new route stops (existing ones were already updated in-place)
        for (RouteStop rs : updatedRouteStops) {
            if (rs.getId() == null) {
                existingRouteStops.add(rs);
            }
        }
    }

    private Route createNewRoute(RouteGroupRequest.RouteRequest routeRequest, RouteGroup routeGroup, String userId) {
        Stop startStop = stopRepository.findById(routeRequest.getStartStopId())
                .orElseThrow(() -> new ResourceNotFoundException("Start stop not found with id: " + routeRequest.getStartStopId()));
        Stop endStop = stopRepository.findById(routeRequest.getEndStopId())
                .orElseThrow(() -> new ResourceNotFoundException("End stop not found with id: " + routeRequest.getEndStopId()));
        
        Route route = new Route();
        route.setName(routeRequest.getName());
        route.setNameSinhala(routeRequest.getNameSinhala());
        route.setNameTamil(routeRequest.getNameTamil());
        route.setRouteNumber(routeRequest.getRouteNumber());
        route.setDescription(routeRequest.getDescription());
        route.setRouteThrough(routeRequest.getRouteThrough());
        route.setRouteThroughSinhala(routeRequest.getRouteThroughSinhala());
        route.setRouteThroughTamil(routeRequest.getRouteThroughTamil());
        route.setRouteGroup(routeGroup);
        route.setStartStop(startStop);
        route.setEndStop(endStop);
        route.setDistanceKm(routeRequest.getDistanceKm());
        route.setEstimatedDurationMinutes(routeRequest.getEstimatedDurationMinutes());
        route.setCreatedBy(userId);
        route.setUpdatedBy(userId);
        
        try {
            route.setDirection(DirectionEnum.valueOf(routeRequest.getDirection()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid direction: " + routeRequest.getDirection());
        }
        
        if (routeRequest.getRoadType() != null && !routeRequest.getRoadType().trim().isEmpty()) {
            try {
                route.setRoadType(com.busmate.routeschedule.network.enums.RoadTypeEnum.valueOf(routeRequest.getRoadType()));
            } catch (IllegalArgumentException e) {
                throw new ConflictException("Invalid road type: " + routeRequest.getRoadType());
            }
        }
        
        if (routeRequest.getRouteStops() != null && !routeRequest.getRouteStops().isEmpty()) {
            List<RouteStop> routeStops = routeRequest.getRouteStops().stream().map(rs -> {
                Stop stop = stopRepository.findById(rs.getStopId())
                        .orElseThrow(() -> new ResourceNotFoundException("Stop not found with id: " + rs.getStopId()));
                RouteStop routeStop = new RouteStop();
                routeStop.setRoute(route);
                routeStop.setStop(stop);
                routeStop.setStopOrder(rs.getStopOrder());
                routeStop.setDistanceFromStartKm(rs.getDistanceFromStartKm());
                routeStop.setDistanceFromStartKmUnverified(rs.getDistanceFromStartKmUnverified());
                routeStop.setDistanceFromStartKmCalculated(rs.getDistanceFromStartKmCalculated());
                return routeStop;
            }).collect(Collectors.toList());
            route.setRouteStops(routeStops);
        }
        
        return route;
    }
}