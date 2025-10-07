package com.busmate.routeschedule.service.passenger.impl;

import com.busmate.routeschedule.dto.common.LocationDto;
import com.busmate.routeschedule.dto.response.passenger.PassengerRouteResponse;
import com.busmate.routeschedule.dto.response.passenger.PassengerPaginatedResponse;
import com.busmate.routeschedule.entity.Route;
import com.busmate.routeschedule.entity.Stop;
import com.busmate.routeschedule.entity.RouteStop;
import com.busmate.routeschedule.entity.Schedule;
import com.busmate.routeschedule.enums.DirectionEnum;
import com.busmate.routeschedule.exception.ResourceNotFoundException;
import com.busmate.routeschedule.repository.RouteRepository;
import com.busmate.routeschedule.repository.RouteStopRepository;
import com.busmate.routeschedule.repository.ScheduleRepository;
import com.busmate.routeschedule.repository.StopRepository;
import com.busmate.routeschedule.service.passenger.PassengerRouteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PassengerRouteServiceImpl implements PassengerRouteService {

    private final RouteRepository routeRepository;
    private final RouteStopRepository routeStopRepository;
    private final StopRepository stopRepository;
    private final ScheduleRepository scheduleRepository;

    @Override
    public PassengerPaginatedResponse<PassengerRouteResponse> searchRoutes(
            String fromCity, String toCity, UUID fromStopId, UUID toStopId,
            Double fromLat, Double fromLng, Double toLat, Double toLng, Double radius,
            UUID operatorId, DirectionEnum direction,
            LocalDate departureDate, LocalTime earliestTime, LocalTime latestTime,
            Boolean isAccessible, Integer maxDuration, Double maxDistance,
            Pageable pageable) {

        log.debug("Searching routes with criteria: from={}, to={}, direction={}", 
                 fromCity, toCity, direction);

        // For now, get all routes and apply basic filtering
        // In a real implementation, you would use custom queries or specifications
        List<Route> allRoutes = routeRepository.findAll();
        List<Route> filteredRoutes = allRoutes.stream()
                .filter(route -> filterRoute(route, fromCity, toCity, fromStopId, toStopId, 
                        direction, operatorId, maxDistance))
                .collect(Collectors.toList());

        // Apply pagination manually for this example
        int start = Math.min((int) pageable.getOffset(), filteredRoutes.size());
        int end = Math.min((start + pageable.getPageSize()), filteredRoutes.size());
        List<Route> pageContent = filteredRoutes.subList(start, end);

        List<PassengerRouteResponse> routeResponses = pageContent.stream()
                .map(this::toPassengerRouteResponse)
                .collect(Collectors.toList());

        Page<PassengerRouteResponse> routePage = new PageImpl<>(
                routeResponses, pageable, filteredRoutes.size());

        return PassengerPaginatedResponse.<PassengerRouteResponse>builder()
                .content(routeResponses)
                .currentPage(routePage.getNumber())
                .size(routePage.getSize())
                .totalElements(routePage.getTotalElements())
                .totalPages(routePage.getTotalPages())
                .first(routePage.isFirst())
                .last(routePage.isLast())
                .hasNext(routePage.hasNext())
                .hasPrevious(routePage.hasPrevious())
                .build();
    }

    @Override
    public PassengerPaginatedResponse<PassengerRouteResponse> getAllRoutes(
            String city, String region,
            UUID operatorId, DirectionEnum direction, Boolean isActive,
            Double maxDistance, Double minDistance, String search,
            Pageable pageable) {

        log.debug("Getting all routes with filters: city={}, direction={}", city, direction);

        List<Route> allRoutes = routeRepository.findAll();
        List<Route> filteredRoutes = allRoutes.stream()
                .filter(route -> filterRouteGeneral(route, city, region, 
                        operatorId, direction, isActive, maxDistance, minDistance, search))
                .collect(Collectors.toList());

        // Apply pagination
        int start = Math.min((int) pageable.getOffset(), filteredRoutes.size());
        int end = Math.min((start + pageable.getPageSize()), filteredRoutes.size());
        List<Route> pageContent = filteredRoutes.subList(start, end);

        List<PassengerRouteResponse> routeResponses = pageContent.stream()
                .map(this::toPassengerRouteResponse)
                .collect(Collectors.toList());

        Page<PassengerRouteResponse> routePage = new PageImpl<>(
                routeResponses, pageable, filteredRoutes.size());

        return PassengerPaginatedResponse.<PassengerRouteResponse>builder()
                .content(routeResponses)
                .currentPage(routePage.getNumber())
                .size(routePage.getSize())
                .totalElements(routePage.getTotalElements())
                .totalPages(routePage.getTotalPages())
                .first(routePage.isFirst())
                .last(routePage.isLast())
                .hasNext(routePage.hasNext())
                .hasPrevious(routePage.hasPrevious())
                .build();
    }

    @Override
    public PassengerRouteResponse getRouteDetails(
            UUID routeId, Boolean includeStops, Boolean includeSchedules,
            Boolean includeTrips, LocalDate date) {

        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with ID: " + routeId));

        log.debug("Retrieving route details for ID: {}", routeId);

        return toPassengerRouteResponse(route, includeStops, includeSchedules, includeTrips, 
                true, true, true);
    }

    private boolean filterRoute(Route route, String fromCity, String toCity, 
            UUID fromStopId, UUID toStopId, DirectionEnum direction,
            UUID operatorId, Double maxDistance) {

        // Direction filter
        if (direction != null && !direction.equals(route.getDirection())) {
            return false;
        }

        // Distance filter
        if (maxDistance != null && route.getDistanceKm() != null && 
            route.getDistanceKm() > maxDistance) {
            return false;
        }

        // Note: operatorType filtering removed - routes are not directly linked to operators
        // Operator filtering would require complex joins through trip->psp->operator

        // For stop and city filtering, we'd need to check route stops
        // This is a simplified implementation
        if (fromStopId != null || toStopId != null || fromCity != null || toCity != null) {
            List<RouteStop> routeStops = routeStopRepository.findByRouteIdOrderByStopOrder(route.getId());
            return checkStopCriteria(routeStops, fromCity, toCity, fromStopId, toStopId);
        }

        return true;
    }

    private boolean filterRouteGeneral(Route route, String city, String region,
            UUID operatorId, DirectionEnum direction,
            Boolean isActive, Double maxDistance, Double minDistance, String search) {

        // Direction filter
        if (direction != null && !direction.equals(route.getDirection())) {
            return false;
        }

        // Distance filters
        if (maxDistance != null && route.getDistanceKm() != null && 
            route.getDistanceKm() > maxDistance) {
            return false;
        }
        if (minDistance != null && route.getDistanceKm() != null && 
            route.getDistanceKm() < minDistance) {
            return false;
        }

        // Note: operatorType filtering removed - routes are not directly linked to operators
        // Operator filtering would require complex joins through trip->psp->operator

        // Search filter
        if (search != null && !search.trim().isEmpty()) {
            String searchLower = search.toLowerCase();
            return route.getName().toLowerCase().contains(searchLower) ||
                   (route.getDescription() != null && 
                    route.getDescription().toLowerCase().contains(searchLower));
        }

        return true;
    }

    private boolean checkStopCriteria(List<RouteStop> routeStops, String fromCity, 
            String toCity, UUID fromStopId, UUID toStopId) {
        
        boolean hasFromStop = fromStopId == null && fromCity == null;
        boolean hasToStop = toStopId == null && toCity == null;

        for (RouteStop routeStop : routeStops) {
            Stop stop = routeStop.getStop();
            
            if (fromStopId != null && stop.getId().equals(fromStopId)) {
                hasFromStop = true;
            }
            if (toStopId != null && stop.getId().equals(toStopId)) {
                hasToStop = true;
            }
            if (fromCity != null && stop.getLocation() != null && 
                fromCity.equalsIgnoreCase(stop.getLocation().getCity())) {
                hasFromStop = true;
            }
            if (toCity != null && stop.getLocation() != null && 
                toCity.equalsIgnoreCase(stop.getLocation().getCity())) {
                hasToStop = true;
            }
        }

        return hasFromStop && hasToStop;
    }

    private PassengerRouteResponse toPassengerRouteResponse(Route route) {
        return toPassengerRouteResponse(route, true, true, true, true, true, true);
    }

    private PassengerRouteResponse toPassengerRouteResponse(Route route,
            Boolean includeStops, Boolean includeSchedules, Boolean includeTrips, 
            Boolean includeOperator, Boolean includeFares, Boolean includeFeatures) {

        PassengerRouteResponse.PassengerRouteResponseBuilder builder = PassengerRouteResponse.builder()
                .routeId(route.getId())
                .routeName(route.getName())
                .description(route.getDescription())
                .distance(route.getDistanceKm())
                .estimatedDuration(route.getEstimatedDurationMinutes());

        // Include operator information (simplified)
        if (includeOperator != null && includeOperator) {
            builder.operator(PassengerRouteResponse.PassengerOperatorSummary.builder()
                    .id(UUID.randomUUID()) // Placeholder
                    .name("Sample Operator")
                    .type("PUBLIC")
                    .build());
        }

        // Include stop information - Load actual stops from database
        if (includeStops != null && includeStops) {
            // Get start and end stops with actual data
            if (route.getStartStopId() != null) {
                stopRepository.findById(route.getStartStopId()).ifPresent(startStop -> {
                    LocationDto startLocation = new LocationDto();
                    if (startStop.getLocation() != null) {
                        startLocation.setLatitude(startStop.getLocation().getLatitude());
                        startLocation.setLongitude(startStop.getLocation().getLongitude());
                        startLocation.setAddress(startStop.getLocation().getAddress());
                        startLocation.setCity(startStop.getLocation().getCity());
                        startLocation.setState(startStop.getLocation().getState());
                        startLocation.setZipCode(startStop.getLocation().getZipCode());
                        startLocation.setCountry(startStop.getLocation().getCountry());
                    } else {
                        startLocation.setLatitude(0.0);
                        startLocation.setLongitude(0.0);
                    }
                    
                    builder.fromStop(PassengerRouteResponse.PassengerStopSummary.builder()
                            .id(startStop.getId())
                            .name(startStop.getName())
                            .city(startStop.getLocation() != null ? startStop.getLocation().getCity() : "Unknown")
                            .location(startLocation)
                            .build());
                });
            }
            
            if (route.getEndStopId() != null) {
                stopRepository.findById(route.getEndStopId()).ifPresent(endStop -> {
                    LocationDto endLocation = new LocationDto();
                    if (endStop.getLocation() != null) {
                        endLocation.setLatitude(endStop.getLocation().getLatitude());
                        endLocation.setLongitude(endStop.getLocation().getLongitude());
                        endLocation.setAddress(endStop.getLocation().getAddress());
                        endLocation.setCity(endStop.getLocation().getCity());
                        endLocation.setState(endStop.getLocation().getState());
                        endLocation.setZipCode(endStop.getLocation().getZipCode());
                        endLocation.setCountry(endStop.getLocation().getCountry());
                    } else {
                        endLocation.setLatitude(0.0);
                        endLocation.setLongitude(0.0);
                    }
                    
                    builder.toStop(PassengerRouteResponse.PassengerStopSummary.builder()
                            .id(endStop.getId())
                            .name(endStop.getName())
                            .city(endStop.getLocation() != null ? endStop.getLocation().getCity() : "Unknown")
                            .location(endLocation)
                            .build());
                });
            }
            
            // Get all route stops for the stops list
            List<RouteStop> routeStops = routeStopRepository.findByRouteIdOrderByStopOrder(route.getId());
            List<PassengerRouteResponse.PassengerStopSummary> allStops = routeStops.stream()
                    .map(routeStop -> {
                        Stop stop = routeStop.getStop();
                        LocationDto location = new LocationDto();
                        if (stop.getLocation() != null) {
                            location.setLatitude(stop.getLocation().getLatitude());
                            location.setLongitude(stop.getLocation().getLongitude());
                            location.setAddress(stop.getLocation().getAddress());
                            location.setCity(stop.getLocation().getCity());
                            location.setState(stop.getLocation().getState());
                            location.setZipCode(stop.getLocation().getZipCode());
                            location.setCountry(stop.getLocation().getCountry());
                        }
                        
                        return PassengerRouteResponse.PassengerStopSummary.builder()
                                .id(stop.getId())
                                .name(stop.getName())
                                .city(stop.getLocation() != null ? stop.getLocation().getCity() : "Unknown")
                                .location(location)
                                .build();
                    })
                    .collect(Collectors.toList());
            builder.stops(allStops);
        }

        // Include schedule information - Load actual schedules
        if (includeSchedules != null && includeSchedules) {
            List<Schedule> schedules = scheduleRepository.findByRoute_Id(route.getId());
            builder.scheduleCount(schedules.size());
            
            if (!schedules.isEmpty()) {
                // Set next departure based on first active schedule
                builder.nextDeparture("08:30 AM"); // Could be calculated from actual schedule data
                
                // Convert schedules to response format if needed
                List<PassengerRouteResponse.PassengerScheduleSummary> scheduleSummaries = schedules.stream()
                        .map(schedule -> PassengerRouteResponse.PassengerScheduleSummary.builder()
                                .id(schedule.getId())
                                .name(schedule.getName())
                                .description(schedule.getDescription())
                                .type(schedule.getScheduleType().toString())
                                .status(schedule.getStatus().toString())
                                .build())
                        .collect(Collectors.toList());
                builder.schedules(scheduleSummaries);
            }
        }

        // Include service frequency
        if (includeTrips != null && includeTrips) {
            builder.serviceFrequency(PassengerRouteResponse.PassengerServiceFrequency.builder()
                    .interval(30)
                    .unit("minutes")
                    .description("Every 30 minutes during peak hours")
                    .build());
        }

        // Include fare information
        if (includeFares != null && includeFares) {
            builder.fareInfo(PassengerRouteResponse.PassengerFareInfo.builder()
                    .minimumFare(50.0)
                    .maximumFare(150.0)
                    .currency("LKR")
                    .build());
        }

        // Include route features
        if (includeFeatures != null && includeFeatures) {
            builder.features(PassengerRouteResponse.PassengerRouteFeatures.builder()
                    .isAccessible(true)
                    .hasAirConditioning(true)
                    .hasWiFi(false)
                    .allowsLuggage(true)
                    .build());
        }

        // Set default values
        builder.popularity(85); // Sample popularity score

        return builder.build();
    }
}