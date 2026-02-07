package com.busmate.routeschedule.passenger.service.impl;

import com.busmate.routeschedule.dto.common.LocationDto;
import com.busmate.routeschedule.enums.TimePreferenceEnum;
import com.busmate.routeschedule.enums.TimeSourceEnum;
import com.busmate.routeschedule.passenger.dto.projection.FindMyBusProjection;
import com.busmate.routeschedule.passenger.dto.request.FindMyBusRequest;
import com.busmate.routeschedule.passenger.dto.response.FindMyBusResponse;
import com.busmate.routeschedule.passenger.dto.response.FindMyBusResponse.*;
import com.busmate.routeschedule.entity.*;
import com.busmate.routeschedule.passenger.repository.PassengerQueryRepository;
import com.busmate.routeschedule.passenger.service.PassengerQueryService;
import com.busmate.routeschedule.repository.StopRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of PassengerQueryService for Find My Bus API.
 * 
 * Provides schedule-based bus/route information between two stops.
 * Results include route data, schedule timings (with time source indicators),
 * and trip information (bus, operator, permit) when available.
 * 
 * Algorithm:
 * 1. Validate input stops exist
 * 2. Execute optimized query to fetch routes with schedules and optional trips
 * 3. Validate schedules against calendar and exceptions
 * 4. Apply time preference to resolve schedule times
 * 5. Build response with appropriate time source indicators
 * 6. Sort by departure time and return
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PassengerQueryServiceImpl implements PassengerQueryService {

    private final PassengerQueryRepository passengerQueryRepository;
    private final StopRepository stopRepository;

    @Override
    public FindMyBusResponse findMyBus(FindMyBusRequest request) {
        log.info("Find My Bus: fromStop={}, toStop={}, date={}, time={}, timePreference={}",
                request.getFromStopId(), request.getToStopId(), request.getDate(), 
                request.getTime(), request.getTimePreference());

        // Set defaults
        LocalDate searchDate = request.getDate() != null ? request.getDate() : LocalDate.now();
        LocalTime searchTime = request.getTime() != null ? request.getTime() : LocalTime.of(0, 0);
        TimePreferenceEnum timePreference = request.getTimePreference() != null ? 
                request.getTimePreference() : TimePreferenceEnum.DEFAULT;

        // Validate stops exist
        Optional<Stop> fromStopOpt = stopRepository.findById(request.getFromStopId());
        Optional<Stop> toStopOpt = stopRepository.findById(request.getToStopId());

        if (fromStopOpt.isEmpty() || toStopOpt.isEmpty()) {
            return buildErrorResponse(searchDate, searchTime, timePreference,
                    fromStopOpt.orElse(null), toStopOpt.orElse(null),
                    "One or both stops not found.");
        }

        Stop fromStop = fromStopOpt.get();
        Stop toStop = toStopOpt.get();

        // Execute optimized query
        String roadTypeStr = request.getRoadType() != null ? request.getRoadType().name() : null;
        List<FindMyBusProjection> projections = passengerQueryRepository.findBusesBetweenStops(
                request.getFromStopId(), 
                request.getToStopId(), 
                searchDate,
                request.getRouteNumber(),
                roadTypeStr
        );

        if (projections.isEmpty()) {
            return buildErrorResponse(searchDate, searchTime, timePreference, 
                    fromStop, toStop, "No bus routes found between these stops.");
        }

        log.debug("Found {} projections from query", projections.size());

        // Get schedule exceptions for the search date
        Map<UUID, String> scheduleExceptions = getScheduleExceptions(projections, searchDate);

        // Process projections and filter valid results
        DayOfWeek dayOfWeek = searchDate.getDayOfWeek();
        List<BusResult> results = projections.stream()
                .map(proj -> processProjection(proj, searchDate, searchTime, dayOfWeek, 
                        scheduleExceptions, timePreference))
                .filter(Objects::nonNull)
                .sorted(this::compareResults)
                .collect(Collectors.toList());

        return buildSuccessResponse(fromStop, toStop, searchDate, searchTime, timePreference, results);
    }

    /**
     * Process a projection and create BusResult if valid.
     * Returns null if the schedule is not valid for the search date/time.
     */
    private BusResult processProjection(FindMyBusProjection proj, LocalDate searchDate, 
                                        LocalTime searchTime, DayOfWeek dayOfWeek,
                                        Map<UUID, String> scheduleExceptions,
                                        TimePreferenceEnum timePreference) {
        
        // Must have a schedule for results
        if (proj.getScheduleId() == null) {
            return null;
        }

        // Check schedule exceptions
        String exceptionType = scheduleExceptions.get(proj.getScheduleId());
        if ("REMOVED".equals(exceptionType)) {
            return null; // Schedule cancelled for this date
        }

        // Validate calendar (unless specially added)
        if (!"ADDED".equals(exceptionType) && !isValidForDayOfWeek(proj, dayOfWeek)) {
            return null;
        }

        // Resolve departure time based on preference
        TimeWithSource departureTime = resolveTime(
                proj.getFromDepartureTime(),
                proj.getFromDepartureTimeUnverified(),
                proj.getFromDepartureTimeCalculated(),
                timePreference
        );

        // Skip if no departure time available or already departed
        if (departureTime.time == null || departureTime.time.isBefore(searchTime)) {
            return null;
        }

        // Resolve arrival time based on preference
        TimeWithSource arrivalTime = resolveTime(
                proj.getToArrivalTime(),
                proj.getToArrivalTimeUnverified(),
                proj.getToArrivalTimeCalculated(),
                timePreference
        );

        // Build result
        return buildBusResult(proj, departureTime, arrivalTime);
    }

    /**
     * Build BusResult from projection data.
     */
    private BusResult buildBusResult(FindMyBusProjection proj, 
                                      TimeWithSource departure, TimeWithSource arrival) {
        
        Double distanceKm = calculateDistance(proj.getFromDistanceFromStart(), proj.getToDistanceFromStart());
        boolean hasTripData = proj.getTripId() != null;
        
        // Determine already departed status from trip data
        boolean alreadyDeparted = false;
        if (hasTripData) {
            String status = proj.getTripStatus();
            if ("completed".equalsIgnoreCase(status) || "cancelled".equalsIgnoreCase(status)) {
                alreadyDeparted = true;
            } else if (proj.getTripActualDepartureTime() != null && departure.time != null) {
                alreadyDeparted = LocalTime.now().isAfter(departure.time);
            }
        }

        // Build status message
        String statusMessage = buildStatusMessage(departure.source, hasTripData, alreadyDeparted, 
                proj.getTripStatus());

        return BusResult.builder()
                // Route information
                .routeId(proj.getRouteId())
                .routeName(proj.getRouteName())
                .routeNameSinhala(proj.getRouteNameSinhala())
                .routeNameTamil(proj.getRouteNameTamil())
                .routeNumber(proj.getRouteNumber())
                .roadType(proj.getRoadType())
                .routeDescription(proj.getRouteDescription())
                .routeThrough(proj.getRouteThrough())
                .routeThroughSinhala(proj.getRouteThroughSinhala())
                .routeThroughTamil(proj.getRouteThroughTamil())
                // Route group
                .routeGroupId(proj.getRouteGroupId())
                .routeGroupName(proj.getRouteGroupName())
                .routeGroupNameSinhala(proj.getRouteGroupNameSinhala())
                .routeGroupNameTamil(proj.getRouteGroupNameTamil())
                // Distance and stops
                .distanceKm(distanceKm)
                .fromStopOrder(proj.getFromStopOrder())
                .toStopOrder(proj.getToStopOrder())
                // Schedule information
                .scheduleId(proj.getScheduleId())
                .scheduleName(proj.getScheduleName())
                .scheduleType(proj.getScheduleType())
                .departureAtOrigin(departure.time)
                .departureAtOriginSource(departure.source)
                .arrivalAtDestination(arrival.time)
                .arrivalAtDestinationSource(arrival.source)
                // Trip information
                .hasTripData(hasTripData)
                .tripId(proj.getTripId())
                .tripStatus(proj.getTripStatus())
                .actualDepartureTime(proj.getTripActualDepartureTime())
                .actualArrivalTime(proj.getTripActualArrivalTime())
                // Bus information (from trip)
                .busId(proj.getBusId())
                .busPlateNumber(proj.getBusPlateNumber())
                .busModel(proj.getBusModel())
                .busCapacity(proj.getBusCapacity())
                // Operator information
                .operatorId(proj.getOperatorId())
                .operatorName(proj.getOperatorName())
                .operatorType(proj.getOperatorType())
                // PSP information (from trip)
                .pspId(proj.getPspId())
                .pspNumber(proj.getPspNumber())
                // Status
                .alreadyDeparted(alreadyDeparted)
                .statusMessage(statusMessage)
                .build();
    }

    /**
     * Build appropriate status message based on time source and trip availability.
     */
    private String buildStatusMessage(TimeSourceEnum timeSource, boolean hasTripData, 
                                       boolean alreadyDeparted, String tripStatus) {
        if (alreadyDeparted) {
            if (tripStatus != null) {
                return "Trip " + tripStatus.toLowerCase();
            }
            return "Already departed";
        }

        StringBuilder message = new StringBuilder();
        
        if (hasTripData) {
            message.append("Trip scheduled");
        } else {
            message.append("Scheduled service");
        }

        // Add time reliability info
        switch (timeSource) {
            case VERIFIED -> message.append(" (verified times)");
            case UNVERIFIED -> message.append(" (times may vary)");
            case CALCULATED -> message.append(" (estimated times)");
            case UNAVAILABLE -> message.append(" (times unavailable)");
        }

        return message.toString();
    }

    /**
     * Resolve time value based on preference with fallback logic.
     */
    private TimeWithSource resolveTime(LocalTime verified, LocalTime unverified, 
                                        LocalTime calculated, TimePreferenceEnum preference) {
        return switch (preference) {
            case VERIFIED_ONLY -> new TimeWithSource(verified, 
                    verified != null ? TimeSourceEnum.VERIFIED : TimeSourceEnum.UNAVAILABLE);
            
            case PREFER_UNVERIFIED -> {
                if (verified != null) yield new TimeWithSource(verified, TimeSourceEnum.VERIFIED);
                if (unverified != null) yield new TimeWithSource(unverified, TimeSourceEnum.UNVERIFIED);
                yield new TimeWithSource(null, TimeSourceEnum.UNAVAILABLE);
            }
            
            case PREFER_CALCULATED, DEFAULT -> {
                if (verified != null) yield new TimeWithSource(verified, TimeSourceEnum.VERIFIED);
                if (unverified != null) yield new TimeWithSource(unverified, TimeSourceEnum.UNVERIFIED);
                if (calculated != null) yield new TimeWithSource(calculated, TimeSourceEnum.CALCULATED);
                yield new TimeWithSource(null, TimeSourceEnum.UNAVAILABLE);
            }
        };
    }

    /**
     * Helper record for time with its source.
     */
    private record TimeWithSource(LocalTime time, TimeSourceEnum source) {}

    /**
     * Check if schedule runs on the specified day.
     */
    private boolean isValidForDayOfWeek(FindMyBusProjection proj, DayOfWeek dayOfWeek) {
        Boolean runsOnDay = switch (dayOfWeek) {
            case MONDAY -> proj.getMonday();
            case TUESDAY -> proj.getTuesday();
            case WEDNESDAY -> proj.getWednesday();
            case THURSDAY -> proj.getThursday();
            case FRIDAY -> proj.getFriday();
            case SATURDAY -> proj.getSaturday();
            case SUNDAY -> proj.getSunday();
        };
        // If no calendar, assume runs every day
        return runsOnDay == null || Boolean.TRUE.equals(runsOnDay);
    }

    /**
     * Get schedule exceptions map for the search date.
     */
    private Map<UUID, String> getScheduleExceptions(List<FindMyBusProjection> projections, LocalDate date) {
        List<UUID> scheduleIds = projections.stream()
                .map(FindMyBusProjection::getScheduleId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        
        if (scheduleIds.isEmpty()) {
            return Collections.emptyMap();
        }

        return passengerQueryRepository.findScheduleExceptions(scheduleIds, date)
                .stream()
                .collect(Collectors.toMap(
                        PassengerQueryRepository.ScheduleExceptionProjection::getScheduleId,
                        PassengerQueryRepository.ScheduleExceptionProjection::getExceptionType
                ));
    }

    /**
     * Calculate distance between two stops.
     */
    private Double calculateDistance(Double fromDistance, Double toDistance) {
        if (fromDistance != null && toDistance != null) {
            return Math.abs(toDistance - fromDistance);
        }
        return null;
    }

    /**
     * Compare results for sorting: by departure time, then by distance.
     */
    private int compareResults(BusResult a, BusResult b) {
        // First by departure time
        LocalTime timeA = a.getDepartureAtOrigin();
        LocalTime timeB = b.getDepartureAtOrigin();
        
        if (timeA != null && timeB != null) {
            int timeCompare = timeA.compareTo(timeB);
            if (timeCompare != 0) return timeCompare;
        } else if (timeA != null) {
            return -1;
        } else if (timeB != null) {
            return 1;
        }

        // Then by distance
        Double distA = a.getDistanceKm();
        Double distB = b.getDistanceKm();
        
        if (distA != null && distB != null) {
            return distA.compareTo(distB);
        } else if (distA != null) {
            return -1;
        } else if (distB != null) {
            return 1;
        }

        return 0;
    }

    /**
     * Build success response.
     */
    private FindMyBusResponse buildSuccessResponse(Stop fromStop, Stop toStop, 
                                                    LocalDate searchDate, LocalTime searchTime,
                                                    TimePreferenceEnum timePreference,
                                                    List<BusResult> results) {
        String message = results.isEmpty() 
                ? "No buses found for the selected criteria." 
                : "Found " + results.size() + " result(s).";
        
        return FindMyBusResponse.builder()
                .success(!results.isEmpty())
                .message(message)
                .fromStop(buildStopInfo(fromStop))
                .toStop(buildStopInfo(toStop))
                .searchDate(searchDate)
                .searchTime(searchTime)
                .timePreference(timePreference)
                .totalResults(results.size())
                .results(results)
                .build();
    }

    /**
     * Build error response.
     */
    private FindMyBusResponse buildErrorResponse(LocalDate searchDate, LocalTime searchTime,
                                                  TimePreferenceEnum timePreference,
                                                  Stop fromStop, Stop toStop, String message) {
        return FindMyBusResponse.builder()
                .success(false)
                .message(message)
                .fromStop(fromStop != null ? buildStopInfo(fromStop) : null)
                .toStop(toStop != null ? buildStopInfo(toStop) : null)
                .searchDate(searchDate)
                .searchTime(searchTime)
                .timePreference(timePreference)
                .totalResults(0)
                .results(Collections.emptyList())
                .build();
    }

    /**
     * Build StopInfo from Stop entity.
     */
    private StopInfo buildStopInfo(Stop stop) {
        LocationDto location = null;
        if (stop.getLocation() != null) {
            location = new LocationDto();
            location.setLatitude(stop.getLocation().getLatitude());
            location.setLongitude(stop.getLocation().getLongitude());
            location.setAddress(stop.getLocation().getAddress());
            location.setCity(stop.getLocation().getCity());
            location.setState(stop.getLocation().getState());
            location.setZipCode(stop.getLocation().getZipCode());
            location.setCountry(stop.getLocation().getCountry());
            location.setAddressSinhala(stop.getLocation().getAddressSinhala());
            location.setCitySinhala(stop.getLocation().getCitySinhala());
            location.setStateSinhala(stop.getLocation().getStateSinhala());
            location.setCountrySinhala(stop.getLocation().getCountrySinhala());
            location.setAddressTamil(stop.getLocation().getAddressTamil());
            location.setCityTamil(stop.getLocation().getCityTamil());
            location.setStateTamil(stop.getLocation().getStateTamil());
            location.setCountryTamil(stop.getLocation().getCountryTamil());
        }

        return StopInfo.builder()
                .id(stop.getId())
                .name(stop.getName())
                .nameSinhala(stop.getNameSinhala())
                .nameTamil(stop.getNameTamil())
                .location(location)
                .build();
    }
}
