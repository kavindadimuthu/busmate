package com.busmate.routeschedule.service.passenger.impl;

import com.busmate.routeschedule.dto.response.passenger.PassengerTripResponse;
import com.busmate.routeschedule.dto.response.passenger.PassengerPaginatedResponse;
import com.busmate.routeschedule.dto.response.passenger.PassengerRouteResponse;
import com.busmate.routeschedule.dto.common.LocationDto;
import com.busmate.routeschedule.entity.Trip;
import com.busmate.routeschedule.enums.TripStatusEnum;
import com.busmate.routeschedule.enums.OperatorTypeEnum;
import com.busmate.routeschedule.repository.TripRepository;
import com.busmate.routeschedule.service.passenger.PassengerTripService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
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
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public PassengerPaginatedResponse<PassengerTripResponse> searchTrips(
            UUID fromStopId, UUID toStopId, String fromCity, String toCity, UUID routeId,
            LocalDate date, LocalTime timeAfter, LocalTime timeBefore,
            OperatorTypeEnum operatorType, UUID operatorId, TripStatusEnum status,
            Boolean isAccessible, Boolean hasAirConditioning, Integer minCapacity,
            Pageable pageable) {

        log.debug("Searching trips with filters: fromStopId={}, toStopId={}, fromCity={}, toCity={}, " +
                "routeId={}, date={}, timeAfter={}, timeBefore={}, operatorType={}, operatorId={}, status={}", 
                fromStopId, toStopId, fromCity, toCity, routeId, date, timeAfter, timeBefore, 
                operatorType, operatorId, status);

        // Use efficient database query with all filters
        Page<Trip> tripPage = tripRepository.searchTripsWithFilters(
                fromStopId,
                toStopId,
                fromCity,
                toCity, 
                routeId,
                date,
                timeAfter,
                timeBefore,
                operatorType != null ? operatorType.toString() : null,
                operatorId,
                status != null ? status.toString() : null,
                pageable
        );

        List<PassengerTripResponse> tripResponses = tripPage.getContent().stream()
                .map(this::toPassengerTripResponse)
                .collect(Collectors.toList());

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

        log.debug("Retrieving detailed trip information for ID: {}", tripId);

        // Get trip with all related data in one query
        Object[] tripData = tripRepository.getTripWithFullDetails(tripId);
        if (tripData == null) {
            throw new RuntimeException("Trip not found: " + tripId);
        }

        return buildDetailedTripResponse(tripData, includeRoute, includeStops, includeBus, includeTracking);
    }

    @Override
    public PassengerTripResponse getTripStatus(UUID tripId) {
        log.debug("Getting real-time trip status for ID: {}", tripId);

        // Get trip with all related data for status
        Object[] tripData = tripRepository.getTripWithFullDetails(tripId);
        if (tripData == null) {
            throw new RuntimeException("Trip not found: " + tripId);
        }

        return buildDetailedTripResponse(tripData, false, false, true, true);
    }

    @Override
    public PassengerPaginatedResponse<PassengerTripResponse> getActiveTrips(
            UUID routeId, String fromCity, String toCity,
            Double nearLat, Double nearLng, Double radius,
            OperatorTypeEnum operatorType, UUID operatorId,
            LocalTime departedAfter, LocalTime arrivingBefore,
            Pageable pageable) {

        log.debug("Getting active trips with filters: routeId={}, operatorType={}, operatorId={}, " +
                "location=({}, {}), radius={}", routeId, operatorType, operatorId, nearLat, nearLng, radius);

        // Use efficient database query for active trips with all filters
        Page<Trip> activeTripPage = tripRepository.findActiveTripsWithFilters(
                routeId,
                operatorType != null ? operatorType.toString() : null,
                operatorId,
                nearLat,
                nearLng,
                radius,
                pageable
        );

        List<PassengerTripResponse> tripResponses = activeTripPage.getContent().stream()
                .map(this::toPassengerTripResponse)
                .collect(Collectors.toList());

        return PassengerPaginatedResponse.<PassengerTripResponse>builder()
                .content(tripResponses)
                .currentPage(activeTripPage.getNumber())
                .size(activeTripPage.getSize())
                .totalElements(activeTripPage.getTotalElements())
                .totalPages(activeTripPage.getTotalPages())
                .first(activeTripPage.isFirst())
                .last(activeTripPage.isLast())
                .hasNext(activeTripPage.hasNext())
                .hasPrevious(activeTripPage.hasPrevious())
                .build();
    }

    private PassengerTripResponse toPassengerTripResponse(Trip trip) {
        return toPassengerTripResponse(trip, true, true, true, true);
    }

    private PassengerTripResponse toPassengerTripResponse(Trip trip,
            Boolean includeRoute, Boolean includeStops, Boolean includeBus, Boolean includeTracking) {
        
        // For basic trip response, get minimal data from the trip entity
        PassengerTripResponse.PassengerTripResponseBuilder builder = PassengerTripResponse.builder()
                .tripId(trip.getId())
                .scheduledDeparture(trip.getTripDate().atTime(trip.getScheduledDepartureTime()))
                .scheduledArrival(trip.getTripDate().atTime(trip.getScheduledArrivalTime()))
                .duration((int) java.time.Duration.between(trip.getScheduledDepartureTime(), 
                         trip.getScheduledArrivalTime()).toMinutes())
                .status(trip.getStatus() != null ? trip.getStatus().toString() : "unknown");

        // Set estimated times (use scheduled if actual not available)
        builder.estimatedDeparture(trip.getActualDepartureTime() != null ? 
                trip.getTripDate().atTime(trip.getActualDepartureTime()) :
                trip.getTripDate().atTime(trip.getScheduledDepartureTime()))
               .estimatedArrival(trip.getActualArrivalTime() != null ?
                trip.getTripDate().atTime(trip.getActualArrivalTime()) :
                trip.getTripDate().atTime(trip.getScheduledDepartureTime().plusMinutes(
                    java.time.Duration.between(trip.getScheduledDepartureTime(), 
                                             trip.getScheduledArrivalTime()).toMinutes())));

        // Calculate delay
        if (trip.getActualDepartureTime() != null) {
            long delayMinutes = java.time.Duration.between(
                    trip.getScheduledDepartureTime(), 
                    trip.getActualDepartureTime()).toMinutes();
            builder.delay((int) delayMinutes);
        } else {
            builder.delay(0);
        }

        // Add basic route information if available
        if (trip.getSchedule() != null && trip.getSchedule().getRoute() != null) {
            builder.routeName(trip.getSchedule().getRoute().getName())
                   .distance(trip.getSchedule().getRoute().getDistanceKm());
        }

        // Set default values for missing data
        builder.fare(0.0)
               .availableSeats(0)
               .bookingAvailable(false);

        // Include bus information if available and requested
        if (includeBus != null && includeBus && trip.getBus() != null) {
            builder.bus(buildBusInfo(trip.getBus()));
        }

        return builder.build();
    }
    
    private PassengerTripResponse buildDetailedTripResponse(Object[] tripData,
            Boolean includeRoute, Boolean includeStops, Boolean includeBus, Boolean includeTracking) {
        
        if (tripData == null || tripData.length < 25) {
            throw new RuntimeException("Invalid trip data structure");
        }
        
        // Parse the result from getTripWithFullDetails query
        UUID tripId = UUID.fromString(tripData[0].toString());
        LocalDate tripDate = (LocalDate) tripData[5];
        LocalTime scheduledDeparture = (LocalTime) tripData[6];
        LocalTime actualDeparture = tripData[7] != null ? (LocalTime) tripData[7] : null;
        LocalTime scheduledArrival = (LocalTime) tripData[8];
        LocalTime actualArrival = tripData[9] != null ? (LocalTime) tripData[9] : null;
        String status = tripData[12] != null ? tripData[12].toString() : "unknown";
        
        // Route information
        String routeName = tripData[13] != null ? tripData[13].toString() : "Unknown Route";
        String routeDescription = tripData[14] != null ? tripData[14].toString() : null;
        Double routeDistance = tripData[15] != null ? Double.valueOf(tripData[15].toString()) : 0.0;
        Integer routeDuration = tripData[16] != null ? Integer.valueOf(tripData[16].toString()) : 0;
        
        // Stop information
        String departureStopName = tripData[17] != null ? tripData[17].toString() : "Unknown";
        String departureStopCity = tripData[18] != null ? tripData[18].toString() : null;
        Double depStopLat = tripData[19] != null ? Double.valueOf(tripData[19].toString()) : null;
        Double depStopLng = tripData[20] != null ? Double.valueOf(tripData[20].toString()) : null;
        
        String arrivalStopName = tripData[21] != null ? tripData[21].toString() : "Unknown";
        String arrivalStopCity = tripData[22] != null ? tripData[22].toString() : null;
        Double arrStopLat = tripData[23] != null ? Double.valueOf(tripData[23].toString()) : null;
        Double arrStopLng = tripData[24] != null ? Double.valueOf(tripData[24].toString()) : null;
        
        // Operator information
        String operatorName = tripData[25] != null ? tripData[25].toString() : "Unknown Operator";
        String operatorType = tripData[26] != null ? tripData[26].toString() : null;
        
        // Bus information
        String busPlate = tripData[27] != null ? tripData[27].toString() : null;
        Integer busCapacity = tripData[28] != null ? Integer.valueOf(tripData[28].toString()) : null;
        String busModel = tripData[29] != null ? tripData[29].toString() : null;
        String busFacilitiesJson = tripData[30] != null ? tripData[30].toString() : null;
        
        PassengerTripResponse.PassengerTripResponseBuilder builder = PassengerTripResponse.builder()
                .tripId(tripId)
                .routeName(routeName)
                .scheduledDeparture(tripDate.atTime(scheduledDeparture))
                .scheduledArrival(tripDate.atTime(scheduledArrival))
                .duration(routeDuration)
                .distance(routeDistance)
                .status(status)
                .fare(calculateFare(routeDistance))
                .availableSeats(busCapacity != null ? Math.max(0, busCapacity - 10) : 0) // Simulate occupancy
                .bookingAvailable(true);

        // Set estimated times
        builder.estimatedDeparture(actualDeparture != null ? 
                tripDate.atTime(actualDeparture) : tripDate.atTime(scheduledDeparture))
               .estimatedArrival(actualArrival != null ?
                tripDate.atTime(actualArrival) : 
                tripDate.atTime(scheduledDeparture.plusMinutes(routeDuration)));

        // Calculate delay
        if (actualDeparture != null) {
            long delayMinutes = java.time.Duration.between(scheduledDeparture, actualDeparture).toMinutes();
            builder.delay((int) delayMinutes);
        } else {
            builder.delay(0);
        }

        // Build departure stop
        if (includeRoute != null && includeRoute) {
            builder.departureStop(PassengerRouteResponse.PassengerStopSummary.builder()
                    .name(departureStopName)
                    .city(departureStopCity)
                    .location(buildLocationDto(depStopLat, depStopLng, departureStopCity))
                    .build());

            builder.arrivalStop(PassengerRouteResponse.PassengerStopSummary.builder()
                    .name(arrivalStopName)
                    .city(arrivalStopCity)
                    .location(buildLocationDto(arrStopLat, arrStopLng, arrivalStopCity))
                    .build());

            builder.operator(PassengerRouteResponse.PassengerOperatorSummary.builder()
                    .name(operatorName)
                    .type(operatorType)
                    .build());
        }

        // Include intermediate stops if requested
        if (includeStops != null && includeStops) {
            List<Object[]> stopData = tripRepository.getTripIntermediateStops(tripId);
            List<PassengerTripResponse.PassengerIntermediateStop> intermediateStops = stopData.stream()
                    .map(this::buildIntermediateStop)
                    .collect(Collectors.toList());
            builder.intermediateStops(intermediateStops);
        }

        // Include bus information if requested
        if (includeBus != null && includeBus && busPlate != null) {
            builder.bus(buildBusInfoFromData(busPlate, busCapacity, busModel, busFacilitiesJson));
        }

        return builder.build();
    }
    
    private PassengerTripResponse.PassengerBusInfo buildBusInfo(com.busmate.routeschedule.entity.Bus bus) {
        return PassengerTripResponse.PassengerBusInfo.builder()
                .plateNumber(bus.getPlateNumber())
                .capacity(bus.getCapacity())
                .type(bus.getModel() != null ? bus.getModel() : "Standard")
                .features(parseBusFeatures(bus.getFacilities()))
                .build();
    }
    
    private PassengerTripResponse.PassengerBusInfo buildBusInfoFromData(String plateNumber, Integer capacity, 
            String model, String facilitiesJson) {
        return PassengerTripResponse.PassengerBusInfo.builder()
                .plateNumber(plateNumber)
                .capacity(capacity != null ? capacity : 45)
                .type(model != null ? model : "Standard")
                .features(parseBusFeaturesFromJson(facilitiesJson))
                .build();
    }
    
    private PassengerTripResponse.PassengerBusFeatures parseBusFeatures(JsonNode facilities) {
        if (facilities == null) {
            return getDefaultBusFeatures();
        }
        
        try {
            return PassengerTripResponse.PassengerBusFeatures.builder()
                    .isAccessible(facilities.has("accessible") ? facilities.get("accessible").asBoolean() : false)
                    .hasAirConditioning(facilities.has("airConditioning") ? facilities.get("airConditioning").asBoolean() : false)
                    .hasWiFi(facilities.has("wifi") ? facilities.get("wifi").asBoolean() : false)
                    .hasToilet(facilities.has("toilet") ? facilities.get("toilet").asBoolean() : false)
                    .build();
        } catch (Exception e) {
            log.warn("Error parsing bus facilities: {}", e.getMessage());
            return getDefaultBusFeatures();
        }
    }
    
    private PassengerTripResponse.PassengerBusFeatures parseBusFeaturesFromJson(String facilitiesJson) {
        if (facilitiesJson == null || facilitiesJson.trim().isEmpty()) {
            return getDefaultBusFeatures();
        }
        
        try {
            JsonNode facilities = objectMapper.readTree(facilitiesJson);
            return parseBusFeatures(facilities);
        } catch (Exception e) {
            log.warn("Error parsing bus facilities JSON: {}", e.getMessage());
            return getDefaultBusFeatures();
        }
    }
    
    private PassengerTripResponse.PassengerBusFeatures getDefaultBusFeatures() {
        return PassengerTripResponse.PassengerBusFeatures.builder()
                .isAccessible(false)
                .hasAirConditioning(false)
                .hasWiFi(false)
                .hasToilet(false)
                .build();
    }
    
    private LocationDto buildLocationDto(Double latitude, Double longitude, String city) {
        LocationDto location = new LocationDto();
        location.setLatitude(latitude);
        location.setLongitude(longitude);
        location.setCity(city);
        return location;
    }
    
    private PassengerTripResponse.PassengerIntermediateStop buildIntermediateStop(Object[] stopData) {
        UUID stopId = UUID.fromString(stopData[1].toString());
        String stopName = stopData[2] != null ? stopData[2].toString() : "Unknown Stop";
        LocalTime arrivalTime = (LocalTime) stopData[6];
        LocalTime departureTime = (LocalTime) stopData[7];
        
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        
        return PassengerTripResponse.PassengerIntermediateStop.builder()
                .stopId(stopId)
                .name(stopName)
                .arrivalTime(arrivalTime != null ? arrivalTime.format(timeFormatter) : null)
                .departureTime(departureTime != null ? departureTime.format(timeFormatter) : null)
                .build();
    }
    
    private Double calculateFare(Double distance) {
        if (distance == null || distance <= 0) {
            return 25.0; // Base fare
        }
        // Simple fare calculation: base fare + distance rate
        return 25.0 + (distance * 3.5);
    }
}