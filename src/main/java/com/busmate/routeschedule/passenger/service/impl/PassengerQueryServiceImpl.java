package com.busmate.routeschedule.passenger.service.impl;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.busmate.routeschedule.dto.common.LocationDto;
import com.busmate.routeschedule.entity.Bus;
import com.busmate.routeschedule.entity.Operator;
import com.busmate.routeschedule.entity.PassengerServicePermit;
import com.busmate.routeschedule.entity.Route;
import com.busmate.routeschedule.entity.RouteGroup;
import com.busmate.routeschedule.entity.Schedule;
import com.busmate.routeschedule.entity.ScheduleCalendar;
import com.busmate.routeschedule.entity.Stop;
import com.busmate.routeschedule.entity.Trip;
import com.busmate.routeschedule.enums.TimePreferenceEnum;
import com.busmate.routeschedule.enums.TimeSourceEnum;
import com.busmate.routeschedule.passenger.dto.projection.FindMyBusProjection;
import com.busmate.routeschedule.passenger.dto.projection.ScheduleStopDetailsProjection;
import com.busmate.routeschedule.passenger.dto.request.FindMyBusDetailsRequest;
import com.busmate.routeschedule.passenger.dto.request.FindMyBusRequest;
import com.busmate.routeschedule.passenger.dto.response.FindMyBusDetailsResponse;
import com.busmate.routeschedule.passenger.dto.response.FindMyBusDetailsResponse.BusInfo;
import com.busmate.routeschedule.passenger.dto.response.FindMyBusDetailsResponse.JourneySummary;
import com.busmate.routeschedule.passenger.dto.response.FindMyBusDetailsResponse.OperatorInfo;
import com.busmate.routeschedule.passenger.dto.response.FindMyBusDetailsResponse.PspInfo;
import com.busmate.routeschedule.passenger.dto.response.FindMyBusDetailsResponse.RouteDetails;
import com.busmate.routeschedule.passenger.dto.response.FindMyBusDetailsResponse.RouteGroupInfo;
import com.busmate.routeschedule.passenger.dto.response.FindMyBusDetailsResponse.RouteScheduleStop;
import com.busmate.routeschedule.passenger.dto.response.FindMyBusDetailsResponse.ScheduleCalendarInfo;
import com.busmate.routeschedule.passenger.dto.response.FindMyBusDetailsResponse.ScheduleDetails;
import com.busmate.routeschedule.passenger.dto.response.FindMyBusDetailsResponse.ScheduleExceptionInfo;
import com.busmate.routeschedule.passenger.dto.response.FindMyBusDetailsResponse.StopInfo;
import com.busmate.routeschedule.passenger.dto.response.FindMyBusDetailsResponse.TripDetails;
import com.busmate.routeschedule.passenger.dto.response.FindMyBusResponse;
import com.busmate.routeschedule.passenger.dto.response.FindMyBusResponse.BusResult;
import com.busmate.routeschedule.passenger.dto.response.PassengerPaginatedResponse;
import com.busmate.routeschedule.passenger.dto.response.PassengerStopResponse;
import com.busmate.routeschedule.passenger.repository.PassengerQueryRepository;
import com.busmate.routeschedule.passenger.service.PassengerQueryService;
import com.busmate.routeschedule.repository.ScheduleRepository;
import com.busmate.routeschedule.repository.StopRepository;
import com.busmate.routeschedule.repository.TripRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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
    private final ScheduleRepository scheduleRepository;
    private final TripRepository tripRepository;

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
        
        // Get schedule start/end stop info
        LocalTime startStopDepartureTime = null;
        LocalTime startStopArrivalTime = null;
        LocalTime endStopArrivalTime = null;
        LocalTime endStopDepartureTime = null;
        Double totalDistanceKm = null;
        
        if (proj.getScheduleId() != null) {
            try {
                PassengerQueryRepository.ScheduleStartEndStopProjection startEndInfo = 
                        passengerQueryRepository.findScheduleStartEndStopInfo(proj.getScheduleId());
                if (startEndInfo != null) {
                    // Resolve times with fallback logic (verified -> unverified -> calculated)
                    startStopDepartureTime = startEndInfo.getStartStopDepartureTime() != null ? 
                            startEndInfo.getStartStopDepartureTime() :
                            (startEndInfo.getStartStopDepartureTimeUnverified() != null ?
                                    startEndInfo.getStartStopDepartureTimeUnverified() :
                                    startEndInfo.getStartStopDepartureTimeCalculated());
                    
                    startStopArrivalTime = startEndInfo.getStartStopArrivalTime() != null ?
                            startEndInfo.getStartStopArrivalTime() :
                            (startEndInfo.getStartStopArrivalTimeUnverified() != null ?
                                    startEndInfo.getStartStopArrivalTimeUnverified() :
                                    startEndInfo.getStartStopArrivalTimeCalculated());
                    
                    endStopArrivalTime = startEndInfo.getEndStopArrivalTime() != null ?
                            startEndInfo.getEndStopArrivalTime() :
                            (startEndInfo.getEndStopArrivalTimeUnverified() != null ?
                                    startEndInfo.getEndStopArrivalTimeUnverified() :
                                    startEndInfo.getEndStopArrivalTimeCalculated());
                    
                    endStopDepartureTime = startEndInfo.getEndStopDepartureTime() != null ?
                            startEndInfo.getEndStopDepartureTime() :
                            (startEndInfo.getEndStopDepartureTimeUnverified() != null ?
                                    startEndInfo.getEndStopDepartureTimeUnverified() :
                                    startEndInfo.getEndStopDepartureTimeCalculated());
                    
                    totalDistanceKm = startEndInfo.getTotalDistanceKm();
                }
            } catch (Exception e) {
                log.warn("Failed to fetch schedule start/end stop info for scheduleId={}: {}", 
                        proj.getScheduleId(), e.getMessage());
            }
        }

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
                // Schedule start/end stop info
                .scheduleStartStopDepartureTime(startStopDepartureTime)
                .scheduleStartStopArrivalTime(startStopArrivalTime)
                .scheduleEndStopArrivalTime(endStopArrivalTime)
                .scheduleEndStopDepartureTime(endStopDepartureTime)
                .scheduleTotalDistanceKm(totalDistanceKm)
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
     * Resolve distance value based on preference with fallback logic.
     * Fallback order: verified -> unverified -> calculated
     */
    private Double resolveDistance(Double verified, Double unverified, Double calculated) {
        if (verified != null) return verified;
        if (unverified != null) return unverified;
        return calculated;
    }

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
    private FindMyBusResponse.StopInfo buildStopInfo(Stop stop) {
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

        return FindMyBusResponse.StopInfo.builder()
                .id(stop.getId())
                .name(stop.getName())
                .nameSinhala(stop.getNameSinhala())
                .nameTamil(stop.getNameTamil())
                .location(location)
                .build();
    }

    // ==================== Find My Bus Details Implementation ====================

    @Override
    public FindMyBusDetailsResponse findMyBusDetails(FindMyBusDetailsRequest request) {
        log.info("Find My Bus Details: scheduleId={}, tripId={}, fromStop={}, toStop={}, date={}, timePreference={}",
                request.getScheduleId(), request.getTripId(), request.getFromStopId(), 
                request.getToStopId(), request.getDate(), request.getTimePreference());

        // Set defaults
        LocalDate searchDate = request.getDate() != null ? request.getDate() : LocalDate.now();
        TimePreferenceEnum timePreference = request.getTimePreference() != null ? 
                request.getTimePreference() : TimePreferenceEnum.DEFAULT;

        // Validate stops exist
        Optional<Stop> fromStopOpt = stopRepository.findById(request.getFromStopId());
        Optional<Stop> toStopOpt = stopRepository.findById(request.getToStopId());

        if (fromStopOpt.isEmpty() || toStopOpt.isEmpty()) {
            return buildDetailsErrorResponse("One or both stops not found.");
        }

        Stop fromStop = fromStopOpt.get();
        Stop toStop = toStopOpt.get();

        // Validate schedule exists
        Optional<Schedule> scheduleOpt = scheduleRepository.findById(request.getScheduleId());
        if (scheduleOpt.isEmpty()) {
            return buildDetailsErrorResponse("Schedule not found.");
        }

        Schedule schedule = scheduleOpt.get();
        Route route = schedule.getRoute();

        // Get all schedule stops with full timing information
        List<ScheduleStopDetailsProjection> scheduleStops = 
                passengerQueryRepository.findScheduleStopsByScheduleId(request.getScheduleId());

        if (scheduleStops.isEmpty()) {
            return buildDetailsErrorResponse("No stops found for this schedule.");
        }

        // Find the origin and destination stop indices
        int fromStopIndex = -1;
        int toStopIndex = -1;
        for (int i = 0; i < scheduleStops.size(); i++) {
            ScheduleStopDetailsProjection stop = scheduleStops.get(i);
            if (stop.getStopId().equals(request.getFromStopId())) {
                fromStopIndex = i;
            }
            if (stop.getStopId().equals(request.getToStopId())) {
                toStopIndex = i;
            }
        }

        if (fromStopIndex == -1 || toStopIndex == -1 || fromStopIndex >= toStopIndex) {
            return buildDetailsErrorResponse("Invalid stop sequence: origin must come before destination on this route.");
        }

        // Get schedule calendars
        List<ScheduleCalendar> calendars = schedule.getScheduleCalendars();
        List<ScheduleCalendarInfo> calendarInfos = calendars != null ?
                calendars.stream()
                        .map(this::buildCalendarInfo)
                        .collect(Collectors.toList()) : Collections.emptyList();

        // Get schedule exceptions
        List<PassengerQueryRepository.ScheduleExceptionDetailProjection> exceptions = 
                passengerQueryRepository.findAllScheduleExceptions(request.getScheduleId());
        List<ScheduleExceptionInfo> exceptionInfos = exceptions.stream()
                .map(this::buildExceptionInfo)
                .collect(Collectors.toList());

        // Build route schedule stops (all stops with unified data)
        List<RouteScheduleStop> routeScheduleStops = scheduleStops.stream()
                .map(proj -> buildRouteScheduleStop(proj, timePreference, request.getFromStopId(), request.getToStopId()))
                .collect(Collectors.toList());

        // Get trip details if tripId provided
        TripDetails tripDetails = null;
        if (request.getTripId() != null) {
            Optional<Trip> tripOpt = tripRepository.findById(request.getTripId());
            if (tripOpt.isPresent()) {
                Trip trip = tripOpt.get();
                tripDetails = buildTripDetails(trip);
            }
        }

        // Build journey summary
        ScheduleStopDetailsProjection fromStopProj = scheduleStops.get(fromStopIndex);
        ScheduleStopDetailsProjection toStopProj = scheduleStops.get(toStopIndex);
        JourneySummary journeySummary = buildJourneySummary(
                fromStopProj, toStopProj, fromStopIndex, toStopIndex, 
                scheduleStops.size(), timePreference, tripDetails);

        // Build route details
        RouteDetails routeDetails = buildRouteDetails(route);

        // Build schedule details (metadata only, no stops)
        ScheduleDetails scheduleDetails = buildScheduleDetails(schedule, scheduleStops.size(), 
                calendarInfos, exceptionInfos);

        return FindMyBusDetailsResponse.builder()
                .success(true)
                .message("Schedule details retrieved successfully.")
                .queryDate(searchDate)
                .timePreference(timePreference)
                .route(routeDetails)
                .schedule(scheduleDetails)
                .routeScheduleStops(routeScheduleStops)
                .trip(tripDetails)
                .journeySummary(journeySummary)
                .build();
    }

    /**
     * Build error response for details API.
     */
    private FindMyBusDetailsResponse buildDetailsErrorResponse(String message) {
        return FindMyBusDetailsResponse.builder()
                .success(false)
                .message(message)
                .build();
    }

    /**
     * Build route details from Route entity.
     */
    private RouteDetails buildRouteDetails(Route route) {
        RouteGroupInfo routeGroupInfo = null;
        if (route.getRouteGroup() != null) {
            RouteGroup rg = route.getRouteGroup();
            routeGroupInfo = RouteGroupInfo.builder()
                    .id(rg.getId())
                    .name(rg.getName())
                    .nameSinhala(rg.getNameSinhala())
                    .nameTamil(rg.getNameTamil())
                    .build();
        }

        return RouteDetails.builder()
                .routeId(route.getId())
                .name(route.getName())
                .nameSinhala(route.getNameSinhala())
                .nameTamil(route.getNameTamil())
                .routeNumber(route.getRouteNumber())
                .roadType(route.getRoadType() != null ? route.getRoadType().name() : null)
                .description(route.getDescription())
                .routeThrough(route.getRouteThrough())
                .routeThroughSinhala(route.getRouteThroughSinhala())
                .routeThroughTamil(route.getRouteThroughTamil())
                .direction(route.getDirection() != null ? route.getDirection().name() : null)
                .totalDistanceKm(route.getDistanceKm())
                .estimatedDurationMinutes(route.getEstimatedDurationMinutes())
                .routeGroup(routeGroupInfo)
                .build();
    }

    /**
     * Build schedule details from Schedule entity (metadata only, no stops).
     */
    private ScheduleDetails buildScheduleDetails(Schedule schedule, int totalStops,
                                                  List<ScheduleCalendarInfo> calendars,
                                                  List<ScheduleExceptionInfo> exceptions) {
        // Build single calendar from list (assuming single calendar per schedule)
        ScheduleCalendarInfo calendar = calendars.isEmpty() ? null : calendars.get(0);
        
        return ScheduleDetails.builder()
                .scheduleId(schedule.getId())
                .name(schedule.getName())
                .description(schedule.getDescription())
                .scheduleType(schedule.getScheduleType() != null ? schedule.getScheduleType().name() : null)
                .status(schedule.getStatus() != null ? schedule.getStatus().name() : null)
                .effectiveStartDate(schedule.getEffectiveStartDate())
                .effectiveEndDate(schedule.getEffectiveEndDate())
                .totalStops(totalStops)
                .calendar(calendar)
                .exceptions(exceptions)
                .build();
    }

    /**
     * Build route schedule stop details from projection.
     */
    private RouteScheduleStop buildRouteScheduleStop(ScheduleStopDetailsProjection proj,
                                                     TimePreferenceEnum preference,
                                                     UUID fromStopId,
                                                     UUID toStopId) {
        // Build location
        LocationDto location = new LocationDto();
        location.setLatitude(proj.getStopLatitude());
        location.setLongitude(proj.getStopLongitude());
        location.setAddress(proj.getStopAddress());
        location.setCity(proj.getStopCity());
        
        // Build stop info
        StopInfo stopInfo = StopInfo.builder()
                .id(proj.getStopId())
                .name(proj.getStopName())
                .nameSinhala(proj.getStopNameSinhala())
                .nameTamil(proj.getStopNameTamil())
                .description(proj.getStopDescription())
                .location(location)
                .isAccessible(proj.getStopIsAccessible())
                .build();

        // Resolve times based on preference
        TimeWithSource resolvedArrival = resolveTime(
                proj.getArrivalTime(), 
                proj.getArrivalTimeUnverified(), 
                proj.getArrivalTimeCalculated(),
                preference);
        
        TimeWithSource resolvedDeparture = resolveTime(
                proj.getDepartureTime(), 
                proj.getDepartureTimeUnverified(), 
                proj.getDepartureTimeCalculated(),
                preference);

        // Resolve distance with fallback: verified -> unverified -> calculated
        Double resolvedDistance = resolveDistance(
                proj.getDistanceFromStartKm(),
                proj.getDistanceFromStartKmUnverified(),
                proj.getDistanceFromStartKmCalculated());

        // Determine if this stop is origin or destination
        boolean isOrigin = proj.getStopId().equals(fromStopId);
        boolean isDestination = proj.getStopId().equals(toStopId);

        return RouteScheduleStop.builder()
                .routeStopId(proj.getRouteStopId())
                .scheduleStopId(proj.getScheduleStopId())
                .stopOrder(proj.getStopOrder())  // Convert to 0-based index
                .stop(stopInfo)
                // Origin/Destination flags
                .isOrigin(isOrigin)
                .isDestination(isDestination)
                // Distance with fallback
                .distanceFromStartKm(resolvedDistance)
                .distanceFromStartKmVerified(proj.getDistanceFromStartKm())
                .distanceFromStartKmUnverified(proj.getDistanceFromStartKmUnverified())
                .distanceFromStartKmCalculated(proj.getDistanceFromStartKmCalculated())
                // Verified times
                .arrivalTime(proj.getArrivalTime())
                .departureTime(proj.getDepartureTime())
                // Unverified times
                .arrivalTimeUnverified(proj.getArrivalTimeUnverified())
                .departureTimeUnverified(proj.getDepartureTimeUnverified())
                // Calculated times
                .arrivalTimeCalculated(proj.getArrivalTimeCalculated())
                .departureTimeCalculated(proj.getDepartureTimeCalculated())
                // Resolved times based on preference
                .resolvedArrivalTime(resolvedArrival.time)
                .arrivalTimeSource(resolvedArrival.source)
                .resolvedDepartureTime(resolvedDeparture.time)
                .departureTimeSource(resolvedDeparture.source)
                .build();
    }

    /**
     * Build calendar info from ScheduleCalendar entity.
     */
    private ScheduleCalendarInfo buildCalendarInfo(ScheduleCalendar calendar) {
        return ScheduleCalendarInfo.builder()
                .monday(calendar.getMonday())
                .tuesday(calendar.getTuesday())
                .wednesday(calendar.getWednesday())
                .thursday(calendar.getThursday())
                .friday(calendar.getFriday())
                .saturday(calendar.getSaturday())
                .sunday(calendar.getSunday())
                .build();
    }

    /**
     * Build exception info from projection.
     */
    private ScheduleExceptionInfo buildExceptionInfo(
            PassengerQueryRepository.ScheduleExceptionDetailProjection proj) {
        return ScheduleExceptionInfo.builder()
                .id(proj.getId())
                .exceptionDate(proj.getExceptionDate())
                .exceptionType(proj.getExceptionType())
                .build();
    }

    /**
     * Build trip details from Trip entity.
     */
    private TripDetails buildTripDetails(Trip trip) {
        BusInfo busInfo = null;
        OperatorInfo operatorInfo = null;
        PspInfo pspInfo = null;

        // Build bus info
        if (trip.getBus() != null) {
            Bus bus = trip.getBus();
            busInfo = BusInfo.builder()
                    .busId(bus.getId())
                    .plateNumber(bus.getPlateNumber())
                    .model(bus.getModel())
                    .capacity(bus.getCapacity())
                    .build();

            // Build operator info from bus
            if (bus.getOperator() != null) {
                Operator op = bus.getOperator();
                operatorInfo = OperatorInfo.builder()
                        .operatorId(op.getId())
                        .name(op.getName())
                        .operatorType(op.getOperatorType() != null ? op.getOperatorType().name() : null)
                        .region(op.getRegion())
                        .build();
            }
        }

        // Build PSP info
        if (trip.getPassengerServicePermit() != null) {
            PassengerServicePermit psp = trip.getPassengerServicePermit();
            pspInfo = PspInfo.builder()
                    .pspId(psp.getId())
                    .permitNumber(psp.getPermitNumber())
                    .validFrom(psp.getIssueDate())
                    .validUntil(psp.getExpiryDate())
                    .status(psp.getStatus() != null ? psp.getStatus().name() : null)
                    .build();
        }

        // Calculate delay if actual times available
        Integer delayMinutes = null;
        if (trip.getScheduledDepartureTime() != null && trip.getActualDepartureTime() != null) {
            delayMinutes = (int) Duration.between(trip.getScheduledDepartureTime(), trip.getActualDepartureTime()).toMinutes();
        }

        return TripDetails.builder()
                .tripId(trip.getId())
                .tripDate(trip.getTripDate())
                .status(trip.getStatus() != null ? trip.getStatus().name() : null)
                .scheduledDepartureTime(trip.getScheduledDepartureTime())
                .scheduledArrivalTime(trip.getScheduledArrivalTime())
                .actualDepartureTime(trip.getActualDepartureTime())
                .actualArrivalTime(trip.getActualArrivalTime())
                .delayMinutes(delayMinutes)
                .bus(busInfo)
                .operator(operatorInfo)
                .psp(pspInfo)
                .build();
    }

    /**
     * Build journey summary for the selected origin-destination pair.
     */
    private JourneySummary buildJourneySummary(ScheduleStopDetailsProjection fromStop,
                                                ScheduleStopDetailsProjection toStop,
                                                int fromIndex, int toIndex,
                                                int totalStops,
                                                TimePreferenceEnum preference,
                                                TripDetails tripDetails) {
        // Calculate distance
        Double distance = null;
        if (fromStop.getDistanceFromStartKm() != null && toStop.getDistanceFromStartKm() != null) {
            distance = toStop.getDistanceFromStartKm() - fromStop.getDistanceFromStartKm();
        }

        // Resolve departure from origin
        TimeWithSource departure = resolveTime(
                fromStop.getDepartureTime(),
                fromStop.getDepartureTimeUnverified(),
                fromStop.getDepartureTimeCalculated(),
                preference);

        // Resolve arrival at destination
        TimeWithSource arrival = resolveTime(
                toStop.getArrivalTime(),
                toStop.getArrivalTimeUnverified(),
                toStop.getArrivalTimeCalculated(),
                preference);

        // Calculate estimated duration
        Integer durationMinutes = null;
        if (departure.time != null && arrival.time != null) {
            durationMinutes = (int) Duration.between(departure.time, arrival.time).toMinutes();
        }

        // Build origin stop info (using LocationDto)
        LocationDto originLocation = new LocationDto();
        originLocation.setLatitude(fromStop.getStopLatitude());
        originLocation.setLongitude(fromStop.getStopLongitude());
        
        StopInfo originStopInfo = StopInfo.builder()
                .id(fromStop.getStopId())
                .name(fromStop.getStopName())
                .nameSinhala(fromStop.getStopNameSinhala())
                .nameTamil(fromStop.getStopNameTamil())
                .location(originLocation)
                .build();

        // Build destination stop info (using LocationDto)
        LocationDto destLocation = new LocationDto();
        destLocation.setLatitude(toStop.getStopLatitude());
        destLocation.setLongitude(toStop.getStopLongitude());
        
        StopInfo destinationStopInfo = StopInfo.builder()
                .id(toStop.getStopId())
                .name(toStop.getStopName())
                .nameSinhala(toStop.getStopNameSinhala())
                .nameTamil(toStop.getStopNameTamil())
                .location(destLocation)
                .build();

        return JourneySummary.builder()
                .originStop(originStopInfo)
                .destinationStop(destinationStopInfo)
                .originStopOrder(fromStop.getStopOrder())
                .destinationStopOrder(toStop.getStopOrder())
                .intermediateStopCount(toIndex - fromIndex - 1)
                .distanceKm(distance)
                .departureFromOrigin(departure.time)
                .departureTimeSource(departure.source)
                .arrivalAtDestination(arrival.time)
                .arrivalTimeSource(arrival.source)
                .estimatedDurationMinutes(durationMinutes)
                .build();
    }

    // ================================
    // STOP SEARCH
    // ================================

    @Override
    public PassengerPaginatedResponse<PassengerStopResponse> searchStops(
            String name, String city, String searchText, Boolean accessibleOnly,
            Integer page, Integer size) {

        log.info("Searching stops: name={}, city={}, searchText={}, accessibleOnly={}",
                name, city, searchText, accessibleOnly);

        Pageable pageable = PageRequest.of(page != null ? page : 0, size != null ? size : 20);
        String query = searchText != null ? searchText : name;

        List<Stop> allStops = stopRepository.findAll();

        List<Stop> filteredStops = allStops.stream()
                .filter(stop -> stopMatchesSearchCriteria(stop, query, city, accessibleOnly))
                .collect(Collectors.toList());

        int start = Math.min((int) pageable.getOffset(), filteredStops.size());
        int end = Math.min(start + pageable.getPageSize(), filteredStops.size());
        List<PassengerStopResponse> stopResponses = filteredStops.subList(start, end).stream()
                .map(this::toPassengerStopResponse)
                .collect(Collectors.toList());

        Page<PassengerStopResponse> stopPage = new PageImpl<>(stopResponses, pageable, filteredStops.size());

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

    private boolean stopMatchesSearchCriteria(Stop stop, String query, String city, Boolean accessibleOnly) {
        if (query != null && !query.trim().isEmpty()) {
            String queryLower = query.toLowerCase();
            boolean matchesName = stop.getName().toLowerCase().contains(queryLower);
            boolean matchesDesc = stop.getDescription() != null
                    && stop.getDescription().toLowerCase().contains(queryLower);
            if (!matchesName && !matchesDesc) {
                return false;
            }
        }
        if (city != null && stop.getLocation() != null) {
            if (!city.equalsIgnoreCase(stop.getLocation().getCity())) {
                return false;
            }
        }
        if (accessibleOnly != null && !accessibleOnly.equals(stop.getIsAccessible())) {
            return false;
        }
        return true;
    }

    private PassengerStopResponse toPassengerStopResponse(Stop stop) {
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

        return builder.build();
    }
}
