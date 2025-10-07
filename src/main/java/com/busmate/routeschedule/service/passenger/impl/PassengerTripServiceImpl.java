package com.busmate.routeschedule.service.passenger.impl;

import com.busmate.routeschedule.dto.response.passenger.PassengerTripResponse;
import com.busmate.routeschedule.dto.response.passenger.PassengerPaginatedResponse;
import com.busmate.routeschedule.entity.Trip;
import com.busmate.routeschedule.enums.TripStatusEnum;
import com.busmate.routeschedule.enums.OperatorTypeEnum;
import com.busmate.routeschedule.repository.TripRepository;
import com.busmate.routeschedule.service.passenger.PassengerTripService;
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
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PassengerTripServiceImpl implements PassengerTripService {

    private final TripRepository tripRepository;

    @Override
    public PassengerPaginatedResponse<PassengerTripResponse> searchTrips(
            UUID fromStopId, UUID toStopId, String fromCity, String toCity, UUID routeId,
            LocalDate date, LocalTime timeAfter, LocalTime timeBefore,
            OperatorTypeEnum operatorType, UUID operatorId, TripStatusEnum status,
            Boolean isAccessible, Boolean hasAirConditioning, Integer minCapacity,
            Pageable pageable) {

        log.debug("Searching trips: from={}, to={}, date={}", fromCity, toCity, date);

        // For this example, get all trips and filter manually
        // In a real implementation, you would use complex queries with joins
        List<Trip> allTrips = tripRepository.findAll();
        
        List<Trip> filteredTrips = allTrips.stream()
                .filter(trip -> filterTrip(trip, fromStopId, toStopId, fromCity, toCity, 
                        routeId, date, timeAfter, timeBefore, operatorType, operatorId, 
                        status, isAccessible, hasAirConditioning, minCapacity))
                .collect(Collectors.toList());

        // Apply pagination
        int start = Math.min((int) pageable.getOffset(), filteredTrips.size());
        int end = Math.min((start + pageable.getPageSize()), filteredTrips.size());
        List<Trip> pageContent = filteredTrips.subList(start, end);

        List<PassengerTripResponse> tripResponses = pageContent.stream()
                .map(this::toPassengerTripResponse)
                .collect(Collectors.toList());

        Page<PassengerTripResponse> tripPage = new PageImpl<>(
                tripResponses, pageable, filteredTrips.size());

        return PassengerPaginatedResponse.<PassengerTripResponse>builder()
                .content(tripResponses)
                .currentPage(tripPage.getNumber())
                .size(tripPage.getSize())
                .totalElements(tripPage.getTotalElements())
                .totalPages(tripPage.getTotalPages())
                .first(tripPage.isFirst())
                .last(tripPage.isLast())
                .hasNext(tripPage.hasNext())
                .hasPrevious(tripPage.hasPrevious())
                .build();
    }

    @Override
    public PassengerTripResponse getTripDetails(
            UUID tripId, Boolean includeRoute, Boolean includeStops,
            Boolean includeBus, Boolean includeTracking) {

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found: " + tripId));

        log.debug("Retrieving trip details for ID: {}", tripId);

        return toPassengerTripResponse(trip, includeRoute, includeStops, includeBus, includeTracking);
    }

    @Override
    public PassengerTripResponse getTripStatus(UUID tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found: " + tripId));

        log.debug("Getting trip status for ID: {}", tripId);

        return toPassengerTripResponse(trip, false, false, true, true);
    }

    @Override
    public PassengerPaginatedResponse<PassengerTripResponse> getActiveTrips(
            UUID routeId, String fromCity, String toCity,
            Double nearLat, Double nearLng, Double radius,
            OperatorTypeEnum operatorType, UUID operatorId,
            LocalTime departedAfter, LocalTime arrivingBefore,
            Pageable pageable) {

        log.debug("Getting active trips for route: {}", routeId);

        // For this example, get all trips and filter for active ones
        List<Trip> allTrips = tripRepository.findAll();
        
        List<Trip> activeTrips = allTrips.stream()
                .filter(trip -> filterActiveTrip(trip, routeId, fromCity, toCity, 
                        nearLat, nearLng, radius, operatorType, operatorId, 
                        departedAfter, arrivingBefore))
                .collect(Collectors.toList());

        // Apply pagination
        int start = Math.min((int) pageable.getOffset(), activeTrips.size());
        int end = Math.min((start + pageable.getPageSize()), activeTrips.size());
        List<Trip> pageContent = activeTrips.subList(start, end);

        List<PassengerTripResponse> tripResponses = pageContent.stream()
                .map(this::toPassengerTripResponse)
                .collect(Collectors.toList());

        Page<PassengerTripResponse> tripPage = new PageImpl<>(
                tripResponses, pageable, activeTrips.size());

        return PassengerPaginatedResponse.<PassengerTripResponse>builder()
                .content(tripResponses)
                .currentPage(tripPage.getNumber())
                .size(tripPage.getSize())
                .totalElements(tripPage.getTotalElements())
                .totalPages(tripPage.getTotalPages())
                .first(tripPage.isFirst())
                .last(tripPage.isLast())
                .hasNext(tripPage.hasNext())
                .hasPrevious(tripPage.hasPrevious())
                .build();
    }

    private boolean filterTrip(Trip trip, UUID fromStopId, UUID toStopId, 
            String fromCity, String toCity, UUID routeId, LocalDate date,
            LocalTime timeAfter, LocalTime timeBefore, OperatorTypeEnum operatorType,
            UUID operatorId, TripStatusEnum status, Boolean isAccessible,
            Boolean hasAirConditioning, Integer minCapacity) {

        // Date filter
        if (date != null && !date.equals(trip.getTripDate())) {
            return false;
        }

        // Time filters
        if (timeAfter != null && trip.getScheduledDepartureTime().isBefore(timeAfter)) {
            return false;
        }
        if (timeBefore != null && trip.getScheduledDepartureTime().isAfter(timeBefore)) {
            return false;
        }

        // Status filter
        if (status != null && !status.equals(trip.getStatus())) {
            return false;
        }

        return true;
    }

    private boolean filterActiveTrip(Trip trip, UUID routeId, String fromCity, String toCity,
            Double nearLat, Double nearLng, Double radius, OperatorTypeEnum operatorType,
            UUID operatorId, LocalTime departedAfter, LocalTime arrivingBefore) {

        // For this example, assume all trips are active if they have a valid status
        return trip.getStatus() != null && 
               (trip.getStatus() == TripStatusEnum.active || 
                trip.getStatus() == TripStatusEnum.in_transit || 
                trip.getStatus() == TripStatusEnum.boarding);
    }

    private PassengerTripResponse toPassengerTripResponse(Trip trip) {
        return toPassengerTripResponse(trip, true, true, true, true);
    }

    private PassengerTripResponse toPassengerTripResponse(Trip trip,
            Boolean includeRoute, Boolean includeStops, Boolean includeBus, Boolean includeTracking) {

        PassengerTripResponse.PassengerTripResponseBuilder builder = PassengerTripResponse.builder()
                .tripId(trip.getId())
                .routeName("Sample Route") // Would get from route relationship
                .scheduledDeparture(trip.getTripDate().atTime(trip.getScheduledDepartureTime()))
                .scheduledArrival(trip.getTripDate().atTime(trip.getScheduledArrivalTime()))
                .duration((int) java.time.Duration.between(trip.getScheduledDepartureTime(), 
                         trip.getScheduledArrivalTime()).toMinutes())
                .distance(45.5) // Sample distance
                .status(trip.getStatus().toString())
                .fare(125.0)
                .availableSeats(12)
                .bookingAvailable(true);

        // Set estimated times (use scheduled if actual not available)
        builder.estimatedDeparture(trip.getActualDepartureTime() != null ? 
                trip.getTripDate().atTime(trip.getActualDepartureTime()) :
                trip.getTripDate().atTime(trip.getScheduledDepartureTime()))
               .estimatedArrival(trip.getActualArrivalTime() != null ?
                trip.getTripDate().atTime(trip.getActualArrivalTime()) :
                trip.getTripDate().atTime(trip.getScheduledArrivalTime()));

        // Calculate delay
        if (trip.getActualDepartureTime() != null) {
            long delayMinutes = java.time.Duration.between(
                    trip.getScheduledDepartureTime(), 
                    trip.getActualDepartureTime()).toMinutes();
            builder.delay((int) delayMinutes);
        } else {
            builder.delay(0);
        }

        // Include stop information (sample data)
        if (includeStops != null && includeStops) {
            List<PassengerTripResponse.PassengerIntermediateStop> stops = new ArrayList<>();
            
            // Add sample stops
            stops.add(PassengerTripResponse.PassengerIntermediateStop.builder()
                    .stopId(UUID.randomUUID())
                    .name("Central Station")
                    .arrivalTime("08:30 AM")
                    .departureTime("08:32 AM")
                    .build());
            
            stops.add(PassengerTripResponse.PassengerIntermediateStop.builder()
                    .stopId(UUID.randomUUID())
                    .name("City Center")
                    .arrivalTime("10:13 AM")
                    .departureTime("10:15 AM")
                    .build());
            
            builder.intermediateStops(stops);
        }

        // Include bus information
        if (includeBus != null && includeBus && trip.getBus() != null) {
            builder.bus(PassengerTripResponse.PassengerBusInfo.builder()
                    .plateNumber(trip.getBus().getPlateNumber())
                    .capacity(trip.getBus().getCapacity())
                    .type(trip.getBus().getModel() != null ? trip.getBus().getModel() : "Standard")
                    .features(PassengerTripResponse.PassengerBusFeatures.builder()
                            .isAccessible(false) // Would parse from facilities JSON
                            .hasAirConditioning(false) // Would parse from facilities JSON
                            .hasWiFi(false) // Would parse from facilities JSON
                            .hasToilet(false) // Would parse from facilities JSON
                            .build())
                    .build());
        } else if (includeBus != null && includeBus) {
            // Include sample bus info if no bus assigned
            builder.bus(PassengerTripResponse.PassengerBusInfo.builder()
                    .plateNumber("B-123")
                    .capacity(45)
                    .type("Standard")
                    .features(PassengerTripResponse.PassengerBusFeatures.builder()
                            .isAccessible(true)
                            .hasAirConditioning(true)
                            .hasWiFi(false)
                            .hasToilet(false)
                            .build())
                    .build());
        }

        return builder.build();
    }
}