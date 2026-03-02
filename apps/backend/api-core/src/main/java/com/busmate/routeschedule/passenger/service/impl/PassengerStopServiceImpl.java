package com.busmate.routeschedule.passenger.service.impl;

import com.busmate.routeschedule.dto.common.LocationDto;
import com.busmate.routeschedule.passenger.dto.response.PassengerStopResponse;
import com.busmate.routeschedule.passenger.dto.response.PassengerNearbyStopsResponse;
import com.busmate.routeschedule.passenger.dto.response.PassengerPaginatedResponse;
import com.busmate.routeschedule.passenger.dto.response.PassengerRouteResponse;
import com.busmate.routeschedule.entity.Stop;
import com.busmate.routeschedule.repository.StopRepository;
import com.busmate.routeschedule.passenger.service.PassengerStopService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PassengerStopServiceImpl implements PassengerStopService {

    private final StopRepository stopRepository;

    @Override
    public PassengerNearbyStopsResponse findNearbyStops(
            Double latitude, Double longitude, Double radius,
            Boolean hasRoutes, Boolean isAccessible, Boolean hasFacilities,
            String sort, String order, Integer limit) {

        log.debug("Finding nearby stops at lat={}, lng={}, radius={}", latitude, longitude, radius);

        List<Stop> allStops = stopRepository.findAll();
        
        List<Stop> nearbyStops = allStops.stream()
                .filter(stop -> filterNearbyStop(stop, latitude, longitude, radius, 
                        hasRoutes, isAccessible, hasFacilities))
                .limit(limit != null ? limit : 20)
                .collect(Collectors.toList());

        List<PassengerNearbyStopsResponse.PassengerNearbyStop> nearbyStopResponses = nearbyStops.stream()
                .map(stop -> toPassengerNearbyStop(stop, latitude, longitude))
                .collect(Collectors.toList());

        LocationDto userLocation = new LocationDto();
        userLocation.setLatitude(latitude);
        userLocation.setLongitude(longitude);

        return PassengerNearbyStopsResponse.builder()
                .stops(nearbyStopResponses)
                .totalFound(nearbyStopResponses.size())
                .searchRadius(radius)
                .userLocation(userLocation)
                .build();
    }

    @Override
    public PassengerPaginatedResponse<PassengerStopResponse> searchStops(
            String query, Double nearLat, Double nearLng, String city,
            Boolean hasRoutes, Boolean isAccessible, Pageable pageable) {

        log.debug("Searching stops with query: {}, city: {}", query, city);

        List<Stop> allStops = stopRepository.findAll();
        List<Stop> filteredStops = allStops.stream()
                .filter(stop -> filterStop(stop, query, nearLat, nearLng, city, 
                        hasRoutes, isAccessible))
                .collect(Collectors.toList());

        int start = Math.min((int) pageable.getOffset(), filteredStops.size());
        int end = Math.min((start + pageable.getPageSize()), filteredStops.size());
        List<Stop> pageContent = filteredStops.subList(start, end);

        List<PassengerStopResponse> stopResponses = pageContent.stream()
                .map(this::toPassengerStopResponse)
                .collect(Collectors.toList());

        Page<PassengerStopResponse> stopPage = new PageImpl<>(
                stopResponses, pageable, filteredStops.size());

        return PassengerPaginatedResponse.<PassengerStopResponse>builder()
                .content(stopResponses)
                .currentPage(stopPage.getNumber())
                .size(stopPage.getSize())
                .totalElements(stopPage.getTotalElements())
                .totalPages(stopPage.getTotalPages())
                .first(stopPage.isFirst())
                .last(stopPage.isLast())
                .hasNext(stopPage.hasNext())
                .hasPrevious(stopPage.hasPrevious())
                .build();
    }

    @Override
    public PassengerStopResponse getStopDetails(
            UUID stopId, Boolean includeRoutes, Boolean includeUpcoming,
            Integer upcomingLimit, LocalDate date) {

        Stop stop = stopRepository.findById(stopId)
                .orElseThrow(() -> new RuntimeException("Stop not found: " + stopId));

        log.debug("Retrieving stop details for ID: {}", stopId);

        return toPassengerStopResponse(stop, includeRoutes, includeUpcoming, upcomingLimit);
    }

    @Override
    public List<PassengerRouteResponse> getRoutesForStop(
            UUID stopId, UUID operatorId, String direction, String destination, 
            Boolean activeOnly, Boolean includeSchedule, String sort) {

        log.debug("Getting routes for stop ID: {}", stopId);

        List<PassengerRouteResponse> routes = new ArrayList<>();
        
        routes.add(PassengerRouteResponse.builder()
                .routeId(UUID.randomUUID())
                .routeName("Sample Route 1")
                .description("Sample route description")
                .distance(25.5)
                .estimatedDuration(45)
                .scheduleCount(8)
                .nextDeparture("09:30 AM")
                .popularity(85)
                .build());

        return routes;
    }

    private boolean filterNearbyStop(Stop stop, Double latitude, Double longitude, 
            Double radius, Boolean hasRoutes, Boolean isAccessible, Boolean hasFacilities) {
        
        if (isAccessible != null && !isAccessible.equals(stop.getIsAccessible())) {
            return false;
        }

        if (stop.getLocation() != null && 
            stop.getLocation().getLatitude() != null && 
            stop.getLocation().getLongitude() != null) {
            
            double distance = calculateDistance(latitude, longitude, 
                    stop.getLocation().getLatitude(), stop.getLocation().getLongitude());
            return distance <= radius;
        }

        return true;
    }

    private boolean filterStop(Stop stop, String query, Double nearLat, Double nearLng,
            String city, Boolean hasRoutes, Boolean isAccessible) {
        
        if (query != null && !query.trim().isEmpty()) {
            String queryLower = query.toLowerCase();
            if (!stop.getName().toLowerCase().contains(queryLower) &&
                (stop.getDescription() == null || 
                 !stop.getDescription().toLowerCase().contains(queryLower))) {
                return false;
            }
        }

        if (city != null && stop.getLocation() != null) {
            if (!city.equalsIgnoreCase(stop.getLocation().getCity())) {
                return false;
            }
        }

        if (isAccessible != null && !isAccessible.equals(stop.getIsAccessible())) {
            return false;
        }

        return true;
    }

    private PassengerStopResponse toPassengerStopResponse(Stop stop) {
        return toPassengerStopResponse(stop, true, true, 5);
    }

    private PassengerStopResponse toPassengerStopResponse(Stop stop, 
            Boolean includeRoutes, Boolean includeUpcoming, Integer upcomingLimit) {

        PassengerStopResponse.PassengerStopResponseBuilder builder = PassengerStopResponse.builder()
                .stopId(stop.getId())
                .name(stop.getName())
                .description(stop.getDescription())
                .isAccessible(stop.getIsAccessible() != null ? stop.getIsAccessible() : false);

        if (stop.getLocation() != null) {
            LocationDto location = new LocationDto();
            location.setLatitude(stop.getLocation().getLatitude());
            location.setLongitude(stop.getLocation().getLongitude());
            location.setAddress(stop.getLocation().getAddress());
            location.setCity(stop.getLocation().getCity());
            location.setState(stop.getLocation().getState());
            location.setZipCode(stop.getLocation().getZipCode());
            location.setCountry(stop.getLocation().getCountry());
            builder.location(location);
            builder.city(stop.getLocation().getCity());
        }

        if (includeUpcoming != null && includeUpcoming) {
            List<PassengerStopResponse.PassengerUpcomingTrip> upcomingTrips = new ArrayList<>();
            upcomingTrips.add(PassengerStopResponse.PassengerUpcomingTrip.builder()
                    .routeName("Sample Route")
                    .departureTime("08:45 AM")
                    .destination("City Center")
                    .estimatedDelay(5)
                    .busNumber("B-123")
                    .status("On Time")
                    .build());
            builder.upcomingTrips(upcomingTrips);
        }

        builder.routeCount(3);
        builder.operatorCount(2);
        
        List<String> facilities = new ArrayList<>();
        facilities.add("Seating");
        facilities.add("Shelter");
        if (stop.getIsAccessible() != null && stop.getIsAccessible()) {
            facilities.add("Wheelchair Access");
        }
        builder.facilities(facilities);

        return builder.build();
    }

    private PassengerNearbyStopsResponse.PassengerNearbyStop toPassengerNearbyStop(
            Stop stop, Double userLat, Double userLng) {
        
        double distance = 0.0;
        if (stop.getLocation() != null && 
            stop.getLocation().getLatitude() != null && 
            stop.getLocation().getLongitude() != null) {
            distance = calculateDistance(userLat, userLng, 
                    stop.getLocation().getLatitude(), stop.getLocation().getLongitude());
        }

        LocationDto location = new LocationDto();
        if (stop.getLocation() != null) {
            location.setLatitude(stop.getLocation().getLatitude());
            location.setLongitude(stop.getLocation().getLongitude());
            location.setCity(stop.getLocation().getCity());
        }

        return PassengerNearbyStopsResponse.PassengerNearbyStop.builder()
                .stopId(stop.getId())
                .name(stop.getName())
                .city(stop.getLocation() != null ? stop.getLocation().getCity() : "Unknown")
                .location(location)
                .distance(distance)
                .build();
    }

    private double calculateDistance(Double lat1, Double lng1, Double lat2, Double lng2) {
        double deltaLat = Math.abs(lat1 - lat2);
        double deltaLng = Math.abs(lng1 - lng2);
        return Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng) * 111;
    }
}
