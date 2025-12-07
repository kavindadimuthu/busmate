package com.busmate.routeschedule.service.passenger.impl;

import com.busmate.routeschedule.dto.common.LocationDto;
import com.busmate.routeschedule.dto.request.FindMyBusRequest;
import com.busmate.routeschedule.dto.response.passenger.FindMyBusResponse;
import com.busmate.routeschedule.dto.response.passenger.FindMyBusResponse.*;
import com.busmate.routeschedule.entity.*;
import com.busmate.routeschedule.enums.ExceptionTypeEnum;
import com.busmate.routeschedule.enums.RoadTypeEnum;
import com.busmate.routeschedule.enums.TripStatusEnum;
import com.busmate.routeschedule.repository.*;
import com.busmate.routeschedule.service.passenger.PassengerQueryService;
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
 * Algorithm:
 * 1. Validate input & identify possible routes (RouteStop matching)
 * 2. Fetch schedules for candidate routes (active, valid date, matching calendar)
 * 3. Look for trips (dynamic data)
 * 4. Apply fallback rules (schedule mode or static route mode)
 * 5. Sort results and return unified response
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PassengerQueryServiceImpl implements PassengerQueryService {

    private final RouteStopRepository routeStopRepository;
    private final StopRepository stopRepository;
    private final ScheduleRepository scheduleRepository;
    private final TripRepository tripRepository;
    private final ScheduleStopRepository scheduleStopRepository;

    @Override
    public FindMyBusResponse findMyBus(FindMyBusRequest request) {
        log.info("Find My Bus request: fromStop={}, toStop={}, date={}, time={}",
                request.getFromStopId(), request.getToStopId(), request.getDate(), request.getTime());

        // Set defaults
        LocalDate searchDate = request.getDate() != null ? request.getDate() : LocalDate.now();
        LocalTime searchTime = request.getTime() != null ? request.getTime() : LocalTime.of(0, 0);
        boolean includeScheduledData = request.getIncludeScheduledData() != null ? request.getIncludeScheduledData() : true;
        boolean includeRouteData = request.getIncludeRouteData() != null ? request.getIncludeRouteData() : true;

        // Validate stops exist
        Optional<Stop> fromStopOpt = stopRepository.findById(request.getFromStopId());
        Optional<Stop> toStopOpt = stopRepository.findById(request.getToStopId());

        if (fromStopOpt.isEmpty() || toStopOpt.isEmpty()) {
            return buildNoResultsResponse(request, searchDate, searchTime, 
                    fromStopOpt.orElse(null), toStopOpt.orElse(null),
                    "One or both stops not found.");
        }

        Stop fromStop = fromStopOpt.get();
        Stop toStop = toStopOpt.get();

        // STEP 1: Identify candidate routes
        List<CandidateRoute> candidateRoutes = findCandidateRoutes(
                request.getFromStopId(), request.getToStopId(), 
                request.getRouteNumber(), request.getRoadType());

        if (candidateRoutes.isEmpty()) {
            return buildNoResultsResponse(request, searchDate, searchTime, fromStop, toStop,
                    "No direct bus route found between these two stops.");
        }

        log.info("Found {} candidate routes", candidateRoutes.size());

        // STEP 2 & 3: Process each route - fetch schedules and trips
        List<BusResult> results = new ArrayList<>();

        for (CandidateRoute candidate : candidateRoutes) {
            List<BusResult> routeResults = processRoute(candidate, searchDate, searchTime, 
                    includeScheduledData, includeRouteData);
            results.addAll(routeResults);
        }

        // STEP 5: Sort results
        sortResults(results);

        // STEP 6: Build response
        return buildResponse(fromStop, toStop, searchDate, searchTime, results);
    }

    /**
     * STEP 1: Find candidate routes where fromStop appears before toStop
     */
    private List<CandidateRoute> findCandidateRoutes(UUID fromStopId, UUID toStopId, 
                                                      String routeNumber, RoadTypeEnum roadType) {
        // Get all RouteStop entries for both stops
        List<RouteStop> fromRouteStops = routeStopRepository.findByStopIdWithRouteDetails(fromStopId);
        List<RouteStop> toRouteStops = routeStopRepository.findByStopIdWithRouteDetails(toStopId);

        // Create map for quick lookup of toStop by routeId
        Map<UUID, RouteStop> toStopByRoute = toRouteStops.stream()
                .collect(Collectors.toMap(rs -> rs.getRoute().getId(), rs -> rs, (a, b) -> a));

        List<CandidateRoute> candidates = new ArrayList<>();

        for (RouteStop fromRouteStop : fromRouteStops) {
            Route route = fromRouteStop.getRoute();
            RouteStop toRouteStop = toStopByRoute.get(route.getId());

            // Must have matching route with from.stopOrder < to.stopOrder
            if (toRouteStop != null && fromRouteStop.getStopOrder() < toRouteStop.getStopOrder()) {
                // Apply optional filters
                if (routeNumber != null && !routeNumber.isEmpty()) {
                    if (route.getRouteNumber() == null || 
                        !route.getRouteNumber().equalsIgnoreCase(routeNumber)) {
                        continue;
                    }
                }
                if (roadType != null && route.getRoadType() != roadType) {
                    continue;
                }

                candidates.add(new CandidateRoute(route, fromRouteStop, toRouteStop));
            }
        }

        return candidates;
    }

    /**
     * STEP 2 & 3: Process a single route - fetch schedules and trips
     */
    private List<BusResult> processRoute(CandidateRoute candidate, LocalDate searchDate, 
                                          LocalTime searchTime, boolean includeScheduledData, 
                                          boolean includeRouteData) {
        List<BusResult> results = new ArrayList<>();
        Route route = candidate.route;

        // STEP 2: Fetch active schedules for this route and date
        List<Schedule> activeSchedules = scheduleRepository.findActiveSchedulesForRouteAndDate(
                route.getId(), searchDate);
        
        log.info("Found {} active schedules for route: {} on date: {}", 
                activeSchedules.size(), route.getId(), searchDate);

        // Initialize collections to avoid lazy loading issues
        for (Schedule schedule : activeSchedules) {
            log.info("Schedule: {} ({}), effectiveStartDate: {}, effectiveEndDate: {}, status: {}", 
                    schedule.getId(), schedule.getName(), schedule.getEffectiveStartDate(), 
                    schedule.getEffectiveEndDate(), schedule.getStatus());
            if (schedule.getScheduleStops() != null) {
                schedule.getScheduleStops().size(); // Initialize lazy collection
            }
            if (schedule.getScheduleCalendars() != null) {
                schedule.getScheduleCalendars().size(); // Initialize lazy collection
            }
            if (schedule.getScheduleExceptions() != null) {
                schedule.getScheduleExceptions().size(); // Initialize lazy collection
            }
        }

        if (activeSchedules.isEmpty()) {
            // No active schedules - use static route info only
            if (includeRouteData) {
                results.add(buildStaticRouteResult(candidate));
            }
            return results;
        }

        // STEP 3: Look for trips FIRST (trips exist independently of schedule exceptions)
        // Trips are real instances that may have departed or be in progress
        boolean foundTrips = false;
        
        for (Schedule schedule : activeSchedules) {
            log.info("Checking trips for schedule: {} on date: {} with time after: {}", 
                    schedule.getId(), searchDate, searchTime);
            
            // Get trips for this schedule on the search date (time filtering done in Java)
            List<Trip> allTrips = tripRepository.findBySchedule_IdAndTripDateAndScheduledDepartureTimeGreaterThanEqual(
                    schedule.getId(), searchDate, searchTime);
            
            // Filter by time in Java (workaround for JPA LocalTime comparison issue)
            List<Trip> trips = allTrips.stream()
                    .filter(t -> t.getScheduledDepartureTime().compareTo(searchTime) >= 0)
                    .collect(Collectors.toList());
            
            log.info("Found {} trips for schedule: {} (after time filtering)", trips.size(), schedule.getId());

            if (!trips.isEmpty()) {
                // Case 1: Trips exist - REALTIME mode
                for (Trip trip : trips) {
                    BusResult result = buildRealtimeResult(candidate, schedule, trip);
                    results.add(result);
                    foundTrips = true;
                }
            }
        }

        // If trips were found, return them (ignore schedule exceptions for actual trips)
        if (foundTrips) {
            return results;
        }

        // No trips found - check for schedule-based or static data
        if (includeScheduledData || includeRouteData) {
            // Filter by calendar (day of week) and exceptions only for schedule-based data
            List<Schedule> validSchedules = activeSchedules.stream()
                    .filter(s -> isScheduleValidForDate(s, searchDate))
                    .collect(Collectors.toList());

            if (!validSchedules.isEmpty() && includeScheduledData) {
                // Case 2: No trips but schedule exists - SCHEDULE mode
                for (Schedule schedule : validSchedules) {
                    BusResult result = buildScheduleResult(candidate, schedule, searchTime);
                    if (result != null) {
                        results.add(result);
                    }
                }
            }

            // If still no results and route data is requested
            if (results.isEmpty() && includeRouteData) {
                results.add(buildStaticRouteResult(candidate));
            }
        }

        return results;
    }

    /**
     * Check if schedule is valid for a specific date based on calendar and exceptions
     */
    private boolean isScheduleValidForDate(Schedule schedule, LocalDate date) {
        // Check exceptions first
        if (schedule.getScheduleExceptions() != null) {
            for (ScheduleException exception : schedule.getScheduleExceptions()) {
                if (exception.getExceptionDate().equals(date)) {
                    // If REMOVED, schedule doesn't run on this date
                    // If ADDED, schedule runs on this date regardless of calendar
                    return exception.getExceptionType() == ExceptionTypeEnum.ADDED;
                }
            }
        }

        // Check calendar (day of week)
        if (schedule.getScheduleCalendars() == null || schedule.getScheduleCalendars().isEmpty()) {
            // No calendar means runs every day
            return true;
        }

        DayOfWeek dayOfWeek = date.getDayOfWeek();
        
        for (ScheduleCalendar calendar : schedule.getScheduleCalendars()) {
            boolean runsOnDay = switch (dayOfWeek) {
                case MONDAY -> Boolean.TRUE.equals(calendar.getMonday());
                case TUESDAY -> Boolean.TRUE.equals(calendar.getTuesday());
                case WEDNESDAY -> Boolean.TRUE.equals(calendar.getWednesday());
                case THURSDAY -> Boolean.TRUE.equals(calendar.getThursday());
                case FRIDAY -> Boolean.TRUE.equals(calendar.getFriday());
                case SATURDAY -> Boolean.TRUE.equals(calendar.getSaturday());
                case SUNDAY -> Boolean.TRUE.equals(calendar.getSunday());
            };
            if (runsOnDay) {
                return true;
            }
        }

        return false;
    }

    /**
     * Build REALTIME mode result (best quality - trip data available)
     */
    private BusResult buildRealtimeResult(CandidateRoute candidate, Schedule schedule, Trip trip) {
        Route route = candidate.route;
        
        // Get schedule stops for timing
        List<ScheduleStop> scheduleStops = schedule.getScheduleStops();
        LocalTime departureAtOrigin = null;
        LocalTime arrivalAtDestination = null;

        if (scheduleStops != null) {
            for (ScheduleStop ss : scheduleStops) {
                if (ss.getRouteStop() != null && ss.getRouteStop().getStop() != null) {
                    UUID stopId = ss.getRouteStop().getStop().getId();
                    if (stopId.equals(candidate.fromRouteStop.getStop().getId())) {
                        departureAtOrigin = ss.getDepartureTime() != null ? ss.getDepartureTime() : ss.getArrivalTime();
                    }
                    if (stopId.equals(candidate.toRouteStop.getStop().getId())) {
                        arrivalAtDestination = ss.getArrivalTime() != null ? ss.getArrivalTime() : ss.getDepartureTime();
                    }
                }
            }
        }

        // Calculate distance between stops
        Double distanceKm = calculateDistanceBetweenStops(candidate);

        // Determine if already departed
        boolean alreadyDeparted = false;
        String statusMessage = "Bus available";
        
        if (trip.getStatus() == TripStatusEnum.completed || 
            trip.getStatus() == TripStatusEnum.cancelled) {
            alreadyDeparted = true;
            statusMessage = "Trip " + trip.getStatus().name();
        } else if (trip.getActualDepartureTime() != null && departureAtOrigin != null) {
            // Check if bus has passed the origin stop
            alreadyDeparted = trip.getActualDepartureTime().isAfter(departureAtOrigin);
            if (alreadyDeparted) {
                statusMessage = "Already departed from your stop";
            }
        }

        // Build bus info
        Bus bus = trip.getBus();
        Operator operator = null;
        if (trip.getPassengerServicePermit() != null && trip.getPassengerServicePermit().getOperator() != null) {
            operator = trip.getPassengerServicePermit().getOperator();
        } else if (bus != null && bus.getOperator() != null) {
            operator = bus.getOperator();
        }

        return BusResult.builder()
                .dataMode(DataMode.REALTIME)
                // Route info
                .routeId(route.getId())
                .routeName(route.getName())
                .routeNameSinhala(route.getNameSinhala())
                .routeNameTamil(route.getNameTamil())
                .routeNumber(route.getRouteNumber())
                .roadType(route.getRoadType() != null ? route.getRoadType().name() : null)
                .routeDescription(route.getDescription())
                .routeThrough(route.getRouteThrough())
                .routeThroughSinhala(route.getRouteThroughSinhala())
                .routeThroughTamil(route.getRouteThroughTamil())
                // Distance and duration
                .distanceKm(distanceKm)
                .estimatedDurationMinutes(route.getEstimatedDurationMinutes())
                .fromStopOrder(candidate.fromRouteStop.getStopOrder())
                .toStopOrder(candidate.toRouteStop.getStopOrder())
                // Schedule info
                .scheduleId(schedule.getId())
                .scheduleName(schedule.getName())
                .scheduledDepartureAtOrigin(departureAtOrigin)
                .scheduledArrivalAtDestination(arrivalAtDestination)
                // Trip info
                .tripId(trip.getId())
                .tripStatus(trip.getStatus() != null ? trip.getStatus().name() : null)
                .actualDepartureTime(trip.getActualDepartureTime())
                .actualArrivalTime(trip.getActualArrivalTime())
                // Bus info
                .busId(bus != null ? bus.getId() : null)
                .busPlateNumber(bus != null ? bus.getPlateNumber() : null)
                .busModel(bus != null ? bus.getModel() : null)
                .busCapacity(bus != null ? bus.getCapacity() : null)
                // Operator info
                .operatorId(operator != null ? operator.getId() : null)
                .operatorName(operator != null ? operator.getName() : null)
                // Route group
                .routeGroupId(route.getRouteGroup() != null ? route.getRouteGroup().getId() : null)
                .routeGroupName(route.getRouteGroup() != null ? route.getRouteGroup().getName() : null)
                // Flags
                .alreadyDeparted(alreadyDeparted)
                .statusMessage(statusMessage)
                .build();
    }

    /**
     * Build SCHEDULE mode result (no trips but schedule available)
     */
    private BusResult buildScheduleResult(CandidateRoute candidate, Schedule schedule, LocalTime searchTime) {
        Route route = candidate.route;

        // Get schedule stops for timing at origin and destination
        List<ScheduleStop> scheduleStops = schedule.getScheduleStops();
        LocalTime departureAtOrigin = null;
        LocalTime arrivalAtDestination = null;

        if (scheduleStops != null) {
            for (ScheduleStop ss : scheduleStops) {
                if (ss.getRouteStop() != null && ss.getRouteStop().getStop() != null) {
                    UUID stopId = ss.getRouteStop().getStop().getId();
                    if (stopId.equals(candidate.fromRouteStop.getStop().getId())) {
                        departureAtOrigin = ss.getDepartureTime() != null ? ss.getDepartureTime() : ss.getArrivalTime();
                    }
                    if (stopId.equals(candidate.toRouteStop.getStop().getId())) {
                        arrivalAtDestination = ss.getArrivalTime() != null ? ss.getArrivalTime() : ss.getDepartureTime();
                    }
                }
            }
        }

        // Skip if departure time is before search time (already departed based on schedule)
        if (departureAtOrigin != null && departureAtOrigin.isBefore(searchTime)) {
            return null;
        }

        // Calculate distance
        Double distanceKm = calculateDistanceBetweenStops(candidate);

        return BusResult.builder()
                .dataMode(DataMode.SCHEDULE)
                // Route info
                .routeId(route.getId())
                .routeName(route.getName())
                .routeNameSinhala(route.getNameSinhala())
                .routeNameTamil(route.getNameTamil())
                .routeNumber(route.getRouteNumber())
                .roadType(route.getRoadType() != null ? route.getRoadType().name() : null)
                .routeDescription(route.getDescription())
                .routeThrough(route.getRouteThrough())
                .routeThroughSinhala(route.getRouteThroughSinhala())
                .routeThroughTamil(route.getRouteThroughTamil())
                // Distance and duration
                .distanceKm(distanceKm)
                .estimatedDurationMinutes(route.getEstimatedDurationMinutes())
                .fromStopOrder(candidate.fromRouteStop.getStopOrder())
                .toStopOrder(candidate.toRouteStop.getStopOrder())
                // Schedule info
                .scheduleId(schedule.getId())
                .scheduleName(schedule.getName())
                .scheduledDepartureAtOrigin(departureAtOrigin)
                .scheduledArrivalAtDestination(arrivalAtDestination)
                // Route group
                .routeGroupId(route.getRouteGroup() != null ? route.getRouteGroup().getId() : null)
                .routeGroupName(route.getRouteGroup() != null ? route.getRouteGroup().getName() : null)
                // Flags
                .alreadyDeparted(false)
                .statusMessage("Scheduled service - no real-time data available")
                .build();
    }

    /**
     * Build STATIC mode result (only route information available)
     */
    private BusResult buildStaticRouteResult(CandidateRoute candidate) {
        Route route = candidate.route;
        Double distanceKm = calculateDistanceBetweenStops(candidate);

        return BusResult.builder()
                .dataMode(DataMode.STATIC)
                // Route info
                .routeId(route.getId())
                .routeName(route.getName())
                .routeNameSinhala(route.getNameSinhala())
                .routeNameTamil(route.getNameTamil())
                .routeNumber(route.getRouteNumber())
                .roadType(route.getRoadType() != null ? route.getRoadType().name() : null)
                .routeDescription(route.getDescription())
                .routeThrough(route.getRouteThrough())
                .routeThroughSinhala(route.getRouteThroughSinhala())
                .routeThroughTamil(route.getRouteThroughTamil())
                // Distance and duration
                .distanceKm(distanceKm)
                .estimatedDurationMinutes(route.getEstimatedDurationMinutes())
                .fromStopOrder(candidate.fromRouteStop.getStopOrder())
                .toStopOrder(candidate.toRouteStop.getStopOrder())
                // Route group
                .routeGroupId(route.getRouteGroup() != null ? route.getRouteGroup().getId() : null)
                .routeGroupName(route.getRouteGroup() != null ? route.getRouteGroup().getName() : null)
                // Flags
                .alreadyDeparted(false)
                .statusMessage("No scheduled trips available — buses on this route operate irregularly.")
                .build();
    }

    /**
     * Calculate distance between from and to stops
     */
    private Double calculateDistanceBetweenStops(CandidateRoute candidate) {
        Double fromDistance = candidate.fromRouteStop.getDistanceFromStartKm();
        Double toDistance = candidate.toRouteStop.getDistanceFromStartKm();

        if (fromDistance != null && toDistance != null) {
            return toDistance - fromDistance;
        }
        return null;
    }

    /**
     * STEP 5: Sort results by departure time, then by distance
     */
    private void sortResults(List<BusResult> results) {
        results.sort((a, b) -> {
            // First by data mode priority (REALTIME > SCHEDULE > STATIC)
            int modePriority = getModePriority(a.getDataMode()) - getModePriority(b.getDataMode());
            if (modePriority != 0) {
                return modePriority;
            }

            // Then by departure time
            LocalTime timeA = a.getScheduledDepartureAtOrigin();
            LocalTime timeB = b.getScheduledDepartureAtOrigin();
            
            if (timeA != null && timeB != null) {
                return timeA.compareTo(timeB);
            } else if (timeA != null) {
                return -1;
            } else if (timeB != null) {
                return 1;
            }

            // Finally by distance
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
        });
    }

    private int getModePriority(DataMode mode) {
        return switch (mode) {
            case REALTIME -> 0;
            case SCHEDULE -> 1;
            case STATIC -> 2;
        };
    }

    /**
     * Build the final response
     */
    private FindMyBusResponse buildResponse(Stop fromStop, Stop toStop, LocalDate searchDate, 
                                            LocalTime searchTime, List<BusResult> results) {
        return FindMyBusResponse.builder()
                .success(true)
                .message(results.isEmpty() ? "No buses found for the selected criteria." : 
                        "Found " + results.size() + " result(s).")
                .fromStop(buildStopInfo(fromStop))
                .toStop(buildStopInfo(toStop))
                .searchDate(searchDate)
                .searchTime(searchTime)
                .totalResults(results.size())
                .results(results)
                .build();
    }

    /**
     * Build response for no results scenario
     */
    private FindMyBusResponse buildNoResultsResponse(FindMyBusRequest request, LocalDate searchDate, 
                                                      LocalTime searchTime, Stop fromStop, Stop toStop, 
                                                      String message) {
        return FindMyBusResponse.builder()
                .success(false)
                .message(message)
                .fromStop(fromStop != null ? buildStopInfo(fromStop) : null)
                .toStop(toStop != null ? buildStopInfo(toStop) : null)
                .searchDate(searchDate)
                .searchTime(searchTime)
                .totalResults(0)
                .results(Collections.emptyList())
                .build();
    }

    /**
     * Build StopInfo from Stop entity
     */
    private StopInfo buildStopInfo(Stop stop) {
        LocationDto location = new LocationDto();
        if (stop.getLocation() != null) {
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

    /**
     * Internal class to hold candidate route information
     */
    private static class CandidateRoute {
        final Route route;
        final RouteStop fromRouteStop;
        final RouteStop toRouteStop;

        CandidateRoute(Route route, RouteStop fromRouteStop, RouteStop toRouteStop) {
            this.route = route;
            this.fromRouteStop = fromRouteStop;
            this.toRouteStop = toRouteStop;
        }
    }
}
