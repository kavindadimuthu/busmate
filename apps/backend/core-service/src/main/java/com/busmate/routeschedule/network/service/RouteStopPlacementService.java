package com.busmate.routeschedule.network.service;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.busmate.routeschedule.network.dto.request.PlaceRouteStopRequest;
import com.busmate.routeschedule.network.dto.response.RouteResponse;
import com.busmate.routeschedule.network.entity.Route;
import com.busmate.routeschedule.network.entity.RouteStop;
import com.busmate.routeschedule.network.entity.Stop;
import com.busmate.routeschedule.network.mapper.RouteMapper;
import com.busmate.routeschedule.network.repository.RouteRepository;
import com.busmate.routeschedule.network.repository.StopRepository;
import com.busmate.routeschedule.shared.exception.BadRequestException;
import com.busmate.routeschedule.shared.exception.ConflictException;
import com.busmate.routeschedule.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Adds or removes one stop of a route's list (ADR-023: a route may be known only in part, and learns its stops
 * one at a time). Updating a route replaces its whole list, which deletes and recreates every route stop and so
 * breaks any schedule time attached to one; this changes only the rows it must.
 */
@Service
@RequiredArgsConstructor
public class RouteStopPlacementService {

    private final RouteRepository routes;
    private final StopRepository stops;
    private final RouteMapper mapper;

    @Transactional
    public RouteResponse place(UUID routeId, PlaceRouteStopRequest request, String auditId) {
        Route route = requireRouteWithStops(routeId);
        Stop stop = stops.findById(request.stopId())
                .orElseThrow(() -> new ResourceNotFoundException("Stop not found with id: " + request.stopId()));
        List<RouteStop> current = ordered(route);

        // Everything is checked before anything changes: a query after a change would flush it first.
        if (current.stream().anyMatch(rs -> rs.getStop().getId().equals(stop.getId()))) {
            throw new ConflictException("'" + stop.getName() + "' is already a stop of this route");
        }
        int order;
        if (current.isEmpty()) {
            if (request.afterRouteStopId() != null) {
                throw new BadRequestException("The route has no stops yet, so there is nothing to come after");
            }
            order = 1;
        } else {
            if (request.afterRouteStopId() == null) {
                throw new BadRequestException("Say which stop it comes after");
            }
            RouteStop after = current.stream().filter(rs -> rs.getId().equals(request.afterRouteStopId())).findFirst()
                    .orElseThrow(() -> new BadRequestException("That stop is not on this route"));
            if (route.getEndStop() != null && after.getStop().getId().equals(route.getEndStop().getId())) {
                throw new BadRequestException("The route ends at " + route.getEndStop().getName()
                        + ", so a stop cannot come after it");
            }
            order = after.getStopOrder() + 1;
            for (RouteStop later : current) {
                if (later.getStopOrder() >= order) {
                    later.setStopOrder(later.getStopOrder() + 1);
                }
            }
        }

        RouteStop placed = new RouteStop();
        placed.setRoute(route);
        placed.setStop(stop);
        placed.setStopOrder(order);
        placed.setDistanceFromStartKmUnverified(request.distanceFromStartKmUnverified());
        route.getRouteStops().add(placed); // through the route, so the response below is the route as it now is
        route.setUpdatedBy(auditId);
        routes.saveAndFlush(route);
        return mapper.toResponse(route);
    }

    @Transactional
    public RouteResponse remove(UUID routeId, UUID routeStopId, String auditId) {
        Route route = requireRouteWithStops(routeId);
        List<RouteStop> current = ordered(route);
        RouteStop target = current.stream().filter(rs -> rs.getId().equals(routeStopId)).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("That stop is not on this route"));

        UUID stopId = target.getStop().getId();
        boolean isEndpoint = (route.getStartStop() != null && route.getStartStop().getId().equals(stopId))
                || (route.getEndStop() != null && route.getEndStop().getId().equals(stopId));
        if (isEndpoint) {
            throw new ConflictException("It is an end of the route; change the route's ends instead");
        }
        if (target.getScheduleStops() != null && !target.getScheduleStops().isEmpty()) {
            throw new ConflictException("A schedule has a time at this stop; remove that first");
        }
        for (RouteStop later : current) {
            if (later.getStopOrder() > target.getStopOrder()) {
                later.setStopOrder(later.getStopOrder() - 1);
            }
        }
        route.getRouteStops().remove(target); // orphan removal deletes the row
        route.setUpdatedBy(auditId);
        routes.saveAndFlush(route);
        return mapper.toResponse(route);
    }

    private static List<RouteStop> ordered(Route route) {
        return route.getRouteStops().stream().sorted(Comparator.comparing(RouteStop::getStopOrder)).toList();
    }

    private Route requireRouteWithStops(UUID id) {
        return routes.findByIdWithStops(id).orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + id));
    }
}
