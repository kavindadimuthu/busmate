package com.busmate.routeschedule.passenger.service.impl;

import com.busmate.routeschedule.passenger.dto.response.PassengerTripResponse;
import com.busmate.routeschedule.passenger.dto.response.PassengerPaginatedResponse;
import com.busmate.routeschedule.passenger.dto.response.PassengerRouteResponse;
import com.busmate.routeschedule.dto.common.LocationDto;
import com.busmate.routeschedule.entity.Trip;
import com.busmate.routeschedule.entity.Operator;
import com.busmate.routeschedule.entity.Stop;
import com.busmate.routeschedule.entity.RouteStop;
import com.busmate.routeschedule.entity.ScheduleStop;
import com.busmate.routeschedule.enums.TripStatusEnum;
import com.busmate.routeschedule.enums.OperatorTypeEnum;
import com.busmate.routeschedule.repository.TripRepository;
import com.busmate.routeschedule.repository.StopRepository;
import com.busmate.routeschedule.repository.RouteStopRepository;
import com.busmate.routeschedule.repository.ScheduleStopRepository;
import com.busmate.routeschedule.passenger.service.PassengerTripService;
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
    private final StopRepository stopRepository;
    private final RouteStopRepository routeStopRepository;
    private final ScheduleStopRepository scheduleStopRepository;
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

        try {
            List<Trip> allMatchingTrips = new ArrayList<>();
            
            if (fromStopId != null && toStopId != null) {
                log.info("Searching trips from stop {} to stop {}", fromStopId, toStopId);
                Page<Trip> tripPage = tripRepository.findTripsByStopsWithFilters(fromStopId, toStopId, Pageable.unpaged());
                allMatchingTrips = tripPage.getContent();
            } else if (fromStopId != null) {
                log.info("Searching trips from stop {}", fromStopId);
                Page<Trip> tripPage = tripRepository.findTripsByFromStopWithFilters(fromStopId, Pageable.unpaged());
                allMatchingTrips = tripPage.getContent();
            } else if (toStopId != null) {
                log.info("Searching trips to stop {}", toStopId);
                Page<Trip> tripPage = tripRepository.findTripsByToStopWithFilters(toStopId, Pageable.unpaged());
                allMatchingTrips = tripPage.getContent();
            } else if (routeId != null) {
                log.info("Searching trips by route {}", routeId);
                Page<Trip> tripPage = tripRepository.findByScheduleRouteId(routeId, Pageable.unpaged());
                allMatchingTrips = tripPage.getContent();
            } else {
                if (date != null && status != null) {
                    Page<Trip> tripPage = tripRepository.findByTripDateAndStatus(date, status, Pageable.unpaged());
                    allMatchingTrips = tripPage.getContent();
                } else if (date != null) {
                    Page<Trip> tripPage = tripRepository.findByTripDate(date, Pageable.unpaged());
                    allMatchingTrips = tripPage.getContent();
                } else if (status != null) {
                    Page<Trip> tripPage = tripRepository.findByStatus(status, Pageable.unpaged());
                    allMatchingTrips = tripPage.getContent();
                } else {
                    Page<Trip> tripPage = tripRepository.findAll(pageable);
                    allMatchingTrips = tripPage.getContent();
                }
            }

            List<Trip> filteredTrips = allMatchingTrips.stream()
                    .filter(trip -> {
                        if (date != null && !date.equals(trip.getTripDate())) return false;
                        if (status != null && !status.equals(trip.getStatus())) return false;
                        if (timeAfter != null || timeBefore != null) {
                            LocalTime departureTime = trip.getScheduledDepartureTime();
                            if (departureTime != null) {
                                if (timeAfter != null && departureTime.isBefore(timeAfter)) return false;
                                if (timeBefore != null && departureTime.isAfter(timeBefore)) return false;
                            } else if (timeAfter != null || timeBefore != null) {
                                return false;
                            }
                        }
                        if (!matchesOperatorFilter(trip, operatorType, operatorId)) return false;
                        return true;
                    })
                    .collect(Collectors.toList());

            int totalElements = filteredTrips.size();
            int pageNumber = pageable.getPageNumber();
            int pageSize = pageable.getPageSize();
            int startIndex = pageNumber * pageSize;
            int endIndex = Math.min(startIndex + pageSize, totalElements);
            
            List<Trip> paginatedTrips = startIndex < totalElements ? 
                filteredTrips.subList(startIndex, endIndex) : new ArrayList<>();

            List<PassengerTripResponse> tripResponses = paginatedTrips.stream()
                    .map(this::toPassengerTripResponse)
                    .collect(Collectors.toList());

            int totalPages = (int) Math.ceil((double) totalElements / pageSize);

            return PassengerPaginatedResponse.<PassengerTripResponse>builder()
                    .content(tripResponses)
                    .currentPage(pageNumber)
                    .size(pageSize)
                    .totalElements((long) totalElements)
                    .totalPages(totalPages)
                    .first(pageNumber == 0)
                    .last(pageNumber >= totalPages - 1 || totalPages == 0)
                    .hasNext(pageNumber < totalPages - 1)
                    .hasPrevious(pageNumber > 0)
                    .build();
        } catch (Exception e) {
            log.error("Error searching trips: {}", e.getMessage(), e);
            return PassengerPaginatedResponse.<PassengerTripResponse>builder()
                    .content(new ArrayList<>())
                    .currentPage(0)
                    .size(pageable.getPageSize())
                    .totalElements(0L)
                    .totalPages(0)
                    .first(true)
                    .last(true)
                    .hasNext(false)
                    .hasPrevious(false)
                    .build();
        }
    }

    @Override
    public PassengerTripResponse getTripDetails(
            UUID tripId, Boolean includeRoute, Boolean includeStops,
            Boolean includeBus, Boolean includeTracking) {

        log.debug("Retrieving detailed trip information for ID: {}", tripId);

        try {
            Trip trip = tripRepository.findById(tripId)
                    .orElseThrow(() -> new RuntimeException("Trip not found: " + tripId));

            return buildTripResponseFromEntity(trip, includeRoute, includeStops, includeBus, includeTracking);
        } catch (Exception e) {
            log.error("Error retrieving trip details for ID: {}, Error: {}", tripId, e.getMessage());
            throw new RuntimeException("Error retrieving trip details: " + e.getMessage(), e);
        }
    }

    @Override
    public PassengerTripResponse getTripStatus(UUID tripId) {
        log.debug("Getting real-time trip status for ID: {}", tripId);

        try {
            Trip trip = tripRepository.findById(tripId)
                    .orElseThrow(() -> new RuntimeException("Trip not found: " + tripId));

            return buildTripResponseFromEntity(trip, false, false, true, true);
        } catch (Exception e) {
            log.error("Error retrieving trip status for ID: {}, Error: {}", tripId, e.getMessage());
            throw new RuntimeException("Error retrieving trip status: " + e.getMessage(), e);
        }
    }

    @Override
    public PassengerPaginatedResponse<PassengerTripResponse> getActiveTrips(
            UUID routeId, String fromCity, String toCity,
            Double nearLat, Double nearLng, Double radius,
            OperatorTypeEnum operatorType, UUID operatorId,
            LocalTime departedAfter, LocalTime arrivingBefore,
            Pageable pageable) {

        log.debug("Getting active trips with filters: routeId={}, operatorType={}, operatorId={}", 
                routeId, operatorType, operatorId);

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
        
        try {
            Object[] tripDetails = tripRepository.getTripWithFullDetails(trip.getId());
            
            if (tripDetails != null && tripDetails.length > 0) {
                return buildDetailedTripResponse(tripDetails, includeRoute, includeStops, includeBus, includeTracking);
            }
        } catch (Exception e) {
            log.warn("Error loading detailed trip information for trip {}: {}", trip.getId(), e.getMessage());
        }
        
        return buildTripResponseFromEntity(trip, includeRoute, includeStops, includeBus, includeTracking);
    }
    
    private PassengerTripResponse buildDetailedTripResponse(Object[] tripData,
            Boolean includeRoute, Boolean includeStops, Boolean includeBus, Boolean includeTracking) {
        
        if (tripData == null || tripData.length < 20) {
            throw new RuntimeException("Invalid trip data structure");
        }
        
        try {
            UUID tripId = UUID.fromString(tripData[0].toString());
            LocalDate tripDate = (LocalDate) tripData[5];
            LocalTime scheduledDeparture = (LocalTime) tripData[6];
            LocalTime actualDeparture = tripData[7] != null ? (LocalTime) tripData[7] : null;
            LocalTime scheduledArrival = (LocalTime) tripData[8];
            LocalTime actualArrival = tripData[9] != null ? (LocalTime) tripData[9] : null;
            String status = tripData[12] != null ? tripData[12].toString() : "unknown";
            
            String routeName = getStringValue(tripData, 13, "Unknown Route");
            Double routeDistance = getDoubleValue(tripData, 15, 0.0);
            Integer routeDuration = getIntegerValue(tripData, 16, 0);
            
            String departureStopName = getStringValue(tripData, 17, "Unknown");
            String departureStopCity = getStringValue(tripData, 18, null);
            Double depStopLat = getDoubleValue(tripData, 19, null);
            Double depStopLng = getDoubleValue(tripData, 20, null);
            
            String arrivalStopName = getStringValue(tripData, 21, "Unknown");
            String arrivalStopCity = getStringValue(tripData, 22, null);
            Double arrStopLat = getDoubleValue(tripData, 23, null);
            Double arrStopLng = getDoubleValue(tripData, 24, null);
            
            String operatorName = getStringValue(tripData, 25, "Unknown Operator");
            String operatorType = getStringValue(tripData, 26, null);
            
            String busPlate = getStringValue(tripData, 27, null);
            Integer busCapacity = getIntegerValue(tripData, 28, null);
            String busModel = getStringValue(tripData, 29, null);
            String busFacilitiesJson = getStringValue(tripData, 30, null);
            
            PassengerTripResponse.PassengerTripResponseBuilder builder = PassengerTripResponse.builder()
                    .tripId(tripId)
                    .routeName(routeName)
                    .scheduledDeparture(tripDate.atTime(scheduledDeparture))
                    .scheduledArrival(tripDate.atTime(scheduledArrival))
                    .duration(routeDuration)
                    .distance(routeDistance)
                    .status(status)
                    .fare(calculateFare(routeDistance))
                    .availableSeats(busCapacity != null ? Math.max(0, busCapacity - 10) : 0)
                    .bookingAvailable(true);

            builder.estimatedDeparture(actualDeparture != null ? 
                    tripDate.atTime(actualDeparture) : tripDate.atTime(scheduledDeparture))
                   .estimatedArrival(actualArrival != null ?
                    tripDate.atTime(actualArrival) : 
                    tripDate.atTime(scheduledDeparture.plusMinutes(routeDuration)));

            if (actualDeparture != null) {
                long delayMinutes = java.time.Duration.between(scheduledDeparture, actualDeparture).toMinutes();
                builder.delay((int) delayMinutes);
            } else {
                builder.delay(0);
            }

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

            if (includeStops != null && includeStops) {
                try {
                    List<Object[]> stopData = tripRepository.getTripIntermediateStops(tripId);
                    List<PassengerTripResponse.PassengerIntermediateStop> intermediateStops = stopData.stream()
                            .map(this::buildIntermediateStop)
                            .collect(Collectors.toList());
                    builder.intermediateStops(intermediateStops);
                } catch (Exception e) {
                    log.warn("Error loading intermediate stops for trip {}: {}", tripId, e.getMessage());
                    builder.intermediateStops(new ArrayList<>());
                }
            }

            if (includeBus != null && includeBus && busPlate != null) {
                builder.bus(buildBusInfoFromData(busPlate, busCapacity, busModel, busFacilitiesJson));
            }

            return builder.build();
        } catch (Exception e) {
            log.error("Error building detailed trip response: {}", e.getMessage());
            throw new RuntimeException("Error building trip response: " + e.getMessage(), e);
        }
    }
    
    private String getStringValue(Object[] array, int index, String defaultValue) {
        if (array.length > index && array[index] != null) {
            return array[index].toString();
        }
        return defaultValue;
    }
    
    private Double getDoubleValue(Object[] array, int index, Double defaultValue) {
        if (array.length > index && array[index] != null) {
            try {
                return Double.valueOf(array[index].toString());
            } catch (NumberFormatException e) {
                return defaultValue;
            }
        }
        return defaultValue;
    }
    
    private Integer getIntegerValue(Object[] array, int index, Integer defaultValue) {
        if (array.length > index && array[index] != null) {
            try {
                return Integer.valueOf(array[index].toString());
            } catch (NumberFormatException e) {
                return defaultValue;
            }
        }
        return defaultValue;
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
        try {
            Integer stopOrder = getIntegerValue(stopData, 0, 0);
            UUID stopId = stopData[1] != null ? UUID.fromString(stopData[1].toString()) : null;
            String stopName = getStringValue(stopData, 2, "Unknown Stop");
            String stopCity = getStringValue(stopData, 3, null);
            Double latitude = getDoubleValue(stopData, 4, null);
            Double longitude = getDoubleValue(stopData, 5, null);
            LocalTime arrivalTime = stopData[6] != null ? (LocalTime) stopData[6] : null;
            LocalTime departureTime = stopData[7] != null ? (LocalTime) stopData[7] : null;

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");
            
            return PassengerTripResponse.PassengerIntermediateStop.builder()
                    .stopId(stopId)
                    .name(stopName)
                    .arrivalTime(arrivalTime != null ? arrivalTime.format(formatter) : null)
                    .departureTime(departureTime != null ? departureTime.format(formatter) : null)
                    .build();
        } catch (Exception e) {
            log.error("Error building intermediate stop from data: {}", e.getMessage());
            return PassengerTripResponse.PassengerIntermediateStop.builder()
                    .name("Unknown Stop")
                    .build();
        }
    }
    
    private PassengerTripResponse buildTripResponseFromEntity(Trip trip, Boolean includeRoute, 
            Boolean includeStops, Boolean includeBus, Boolean includeTracking) {
        
        log.debug("Building trip response from entity for trip: {}", trip.getId());
        
        try {
            LocalDateTime scheduledDeparture = LocalDateTime.of(trip.getTripDate(), trip.getScheduledDepartureTime());
            LocalDateTime scheduledArrival = LocalDateTime.of(trip.getTripDate(), trip.getScheduledArrivalTime());
            LocalDateTime estimatedDeparture = trip.getActualDepartureTime() != null 
                ? LocalDateTime.of(trip.getTripDate(), trip.getActualDepartureTime()) : scheduledDeparture;
            LocalDateTime estimatedArrival = trip.getActualArrivalTime() != null 
                ? LocalDateTime.of(trip.getTripDate(), trip.getActualArrivalTime()) : scheduledArrival;

            int delay = 0;
            if (trip.getActualDepartureTime() != null) {
                delay = (int) java.time.Duration.between(trip.getScheduledDepartureTime(), trip.getActualDepartureTime()).toMinutes();
            }

            PassengerTripResponse.PassengerTripResponseBuilder builder = PassengerTripResponse.builder()
                    .tripId(trip.getId())
                    .scheduledDeparture(scheduledDeparture)
                    .scheduledArrival(scheduledArrival)
                    .estimatedDeparture(estimatedDeparture)
                    .estimatedArrival(estimatedArrival)
                    .status(trip.getStatus() != null ? trip.getStatus().toString() : "unknown")
                    .delay(delay)
                    .availableSeats(0)
                    .bookingAvailable(true)
                    .scheduleId(trip.getSchedule() != null ? trip.getSchedule().getId() : null)
                    .routeId(trip.getSchedule() != null && trip.getSchedule().getRoute() != null ? 
                        trip.getSchedule().getRoute().getId() : null)
                    .routeGroupId(trip.getSchedule() != null && trip.getSchedule().getRoute() != null && 
                        trip.getSchedule().getRoute().getRouteGroup() != null ? 
                        trip.getSchedule().getRoute().getRouteGroup().getId() : null)
                    .operatorId(trip.getBus() != null && trip.getBus().getOperator() != null ? 
                        trip.getBus().getOperator().getId() : null)
                    .busId(trip.getBus() != null ? trip.getBus().getId() : null);

            if (trip.getSchedule() != null && trip.getSchedule().getRoute() != null) {
                var route = trip.getSchedule().getRoute();
                builder.routeName(route.getName())
                       .distance(route.getDistanceKm())
                       .duration(route.getEstimatedDurationMinutes());

                builder.fare(calculateFare(route.getDistanceKm()));

                if (route.getStartStopId() != null) {
                    try {
                        Stop startStop = stopRepository.findById(route.getStartStopId()).orElse(null);
                        if (startStop != null) {
                            var departureStop = PassengerRouteResponse.PassengerStopSummary.builder()
                                    .id(startStop.getId())
                                    .name(startStop.getName())
                                    .city(startStop.getLocation() != null ? startStop.getLocation().getCity() : null)
                                    .location(startStop.getLocation() != null ? 
                                        buildLocationDto(
                                            startStop.getLocation().getLatitude(), 
                                            startStop.getLocation().getLongitude(), 
                                            startStop.getLocation().getCity()
                                        ) : null)
                                    .build();
                            builder.departureStop(departureStop);
                        }
                    } catch (Exception e) {
                        log.debug("Could not load departure stop details for trip {}: {}", trip.getId(), e.getMessage());
                    }
                }
                
                if (route.getEndStopId() != null) {
                    try {
                        Stop endStop = stopRepository.findById(route.getEndStopId()).orElse(null);
                        if (endStop != null) {
                            var arrivalStop = PassengerRouteResponse.PassengerStopSummary.builder()
                                    .id(endStop.getId())
                                    .name(endStop.getName())
                                    .city(endStop.getLocation() != null ? endStop.getLocation().getCity() : null)
                                    .location(endStop.getLocation() != null ? 
                                        buildLocationDto(
                                            endStop.getLocation().getLatitude(), 
                                            endStop.getLocation().getLongitude(), 
                                            endStop.getLocation().getCity()
                                        ) : null)
                                    .build();
                            builder.arrivalStop(arrivalStop);
                        }
                    } catch (Exception e) {
                        log.debug("Could not load arrival stop details for trip {}: {}", trip.getId(), e.getMessage());
                    }
                }
            }

            if (includeBus && trip.getBus() != null) {
                var bus = trip.getBus();
                var busFeatures = PassengerTripResponse.PassengerBusFeatures.builder()
                        .isAccessible(false)
                        .hasAirConditioning(false)
                        .hasWiFi(false)
                        .hasToilet(false)
                        .build();

                if (bus.getFacilities() != null) {
                    try {
                        JsonNode facilities = bus.getFacilities();
                        if (facilities.has("wifi")) busFeatures.setHasWiFi(facilities.get("wifi").asBoolean());
                        if (facilities.has("ac")) busFeatures.setHasAirConditioning(facilities.get("ac").asBoolean());
                        if (facilities.has("accessible")) busFeatures.setIsAccessible(facilities.get("accessible").asBoolean());
                        if (facilities.has("toilet")) busFeatures.setHasToilet(facilities.get("toilet").asBoolean());
                    } catch (Exception e) {
                        log.warn("Error parsing bus facilities for bus {}: {}", bus.getId(), e.getMessage());
                    }
                }

                var busInfo = PassengerTripResponse.PassengerBusInfo.builder()
                        .plateNumber(bus.getPlateNumber())
                        .capacity(bus.getCapacity())
                        .type(bus.getModel())
                        .features(busFeatures)
                        .build();
                builder.bus(busInfo);

                if (bus.getOperator() != null) {
                    var operator = PassengerRouteResponse.PassengerOperatorSummary.builder()
                            .id(bus.getOperator().getId())
                            .name(bus.getOperator().getName())
                            .type(bus.getOperator().getOperatorType().toString())
                            .build();
                    builder.operator(operator);
                }
            }

            if (includeStops) {
                try {
                    List<PassengerTripResponse.PassengerIntermediateStop> intermediateStops = new ArrayList<>();
                    
                    if (trip.getSchedule() != null && trip.getSchedule().getRoute() != null) {
                        var schedule = trip.getSchedule();
                        
                        List<ScheduleStop> scheduleStops = scheduleStopRepository.findByScheduleIdOrderByStopOrder(schedule.getId());
                        
                        for (ScheduleStop scheduleStop : scheduleStops) {
                            RouteStop routeStop = scheduleStop.getRouteStop();
                            Stop stop = routeStop.getStop();
                            
                            if (stop != null) {
                                LocalDateTime stopEstimatedArrival = null;
                                LocalDateTime stopEstimatedDeparture = null;
                                
                                if (scheduleStop.getArrivalTime() != null) {
                                    stopEstimatedArrival = LocalDateTime.of(trip.getTripDate(), scheduleStop.getArrivalTime());
                                }
                                if (scheduleStop.getDepartureTime() != null) {
                                    stopEstimatedDeparture = LocalDateTime.of(trip.getTripDate(), scheduleStop.getDepartureTime());
                                }
                                
                                LocationDto locationDto = null;
                                if (stop.getLocation() != null) {
                                    locationDto = buildLocationDto(
                                        stop.getLocation().getLatitude(),
                                        stop.getLocation().getLongitude(),
                                        stop.getLocation().getCity()
                                    );
                                }
                                
                                var intermediateStop = PassengerTripResponse.PassengerIntermediateStop.builder()
                                        .stopId(stop.getId())
                                        .name(stop.getName())
                                        .description(stop.getDescription())
                                        .city(stop.getLocation() != null ? stop.getLocation().getCity() : null)
                                        .location(locationDto)
                                        .isAccessible(stop.getIsAccessible())
                                        .facilities(new ArrayList<>())
                                        .stopOrder(scheduleStop.getStopOrder())
                                        .distanceFromStart(routeStop.getDistanceFromStartKm())
                                        .scheduledArrivalTime(scheduleStop.getArrivalTime())
                                        .scheduledDepartureTime(scheduleStop.getDepartureTime())
                                        .estimatedArrivalTime(stopEstimatedArrival)
                                        .estimatedDepartureTime(stopEstimatedDeparture)
                                        .status("scheduled")
                                        .arrivalTime(scheduleStop.getArrivalTime() != null ? 
                                            scheduleStop.getArrivalTime().toString() : null)
                                        .departureTime(scheduleStop.getDepartureTime() != null ? 
                                            scheduleStop.getDepartureTime().toString() : null)
                                        .build();
                                
                                intermediateStops.add(intermediateStop);
                            }
                        }
                    }
                    
                    builder.intermediateStops(intermediateStops);
                    
                } catch (Exception e) {
                    log.warn("Error loading intermediate stops for trip {}: {}", trip.getId(), e.getMessage());
                    builder.intermediateStops(new ArrayList<>());
                }
            }

            return builder.build();

        } catch (Exception e) {
            log.error("Error building trip response from entity for trip {}: {}", trip.getId(), e.getMessage(), e);
            throw new RuntimeException("Error building trip response: " + e.getMessage(), e);
        }
    }

    private Double calculateFare(Double distance) {
        if (distance == null || distance <= 0) {
            return 25.0;
        }
        return 25.0 + (distance * 3.5);
    }

    private boolean matchesOperatorFilter(Trip trip, OperatorTypeEnum operatorType, UUID operatorId) {
        Operator operator = null;
        
        if (trip.getPassengerServicePermit() != null && 
            trip.getPassengerServicePermit().getOperator() != null) {
            operator = trip.getPassengerServicePermit().getOperator();
        } else if (trip.getBus() != null && trip.getBus().getOperator() != null) {
            operator = trip.getBus().getOperator();
        }
        
        if (operator == null && (operatorType != null || operatorId != null)) {
            return false;
        }
        
        if (operator != null) {
            if (operatorType != null && !operatorType.equals(operator.getOperatorType())) {
                return false;
            }
            if (operatorId != null && !operatorId.equals(operator.getId())) {
                return false;
            }
        }
        
        return true;
    }
}
