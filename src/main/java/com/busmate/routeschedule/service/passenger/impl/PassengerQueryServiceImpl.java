package com.busmate.routeschedule.service.passenger.impl;

import com.busmate.routeschedule.dto.common.LocationDto;
import com.busmate.routeschedule.dto.projection.FindMyBusProjection;
import com.busmate.routeschedule.dto.request.FindMyBusRequest;
import com.busmate.routeschedule.dto.response.passenger.FindMyBusResponse;
import com.busmate.routeschedule.dto.response.passenger.FindMyBusResponse.*;
import com.busmate.routeschedule.entity.*;
import com.busmate.routeschedule.enums.ExceptionTypeEnum;
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
 * Optimized implementation of PassengerQueryService for Find My Bus API.
 * 
 * This implementation uses a single optimized database query instead of multiple repository calls
 * to eliminate N+1 query problems and reduce database round trips.
 * 
 * Algorithm:
 * 1. Execute single optimized query to fetch all data (routes, schedules, trips, stops)
 * 2. Validate stops exist
 * 3. Process projections and apply business logic (calendar validation, time filtering)
 * 4. Build response objects from projection data
 * 5. Sort results and return unified response
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

        // Execute single optimized query to fetch all data
        String roadTypeStr = request.getRoadType() != null ? request.getRoadType().name() : null;
        List<FindMyBusProjection> projections = passengerQueryRepository.findBusesBetweenStops(
                request.getFromStopId(), 
                request.getToStopId(), 
                searchDate,
                request.getRouteNumber(),
                roadTypeStr
        );

        if (projections.isEmpty()) {
            return buildNoResultsResponse(request, searchDate, searchTime, fromStop, toStop,
                    "No direct bus route found between these two stops.");
        }

        log.info("Found {} projection results from optimized query", projections.size());

        // Get schedule exceptions for validation
        List<UUID> scheduleIds = projections.stream()
                .map(FindMyBusProjection::getScheduleId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        
        Map<UUID, String> scheduleExceptions = new HashMap<>();
        if (!scheduleIds.isEmpty()) {
            List<PassengerQueryRepository.ScheduleExceptionProjection> exceptions = 
                    passengerQueryRepository.findScheduleExceptions(scheduleIds, searchDate);
            
            for (PassengerQueryRepository.ScheduleExceptionProjection exc : exceptions) {
                scheduleExceptions.put(exc.getScheduleId(), exc.getExceptionType());
            }
        }

        // Process projections and build results
        List<BusResult> results = new ArrayList<>();
        DayOfWeek dayOfWeek = searchDate.getDayOfWeek();

        for (FindMyBusProjection proj : projections) {
            BusResult result = processProjection(proj, searchDate, searchTime, dayOfWeek, 
                    scheduleExceptions, includeScheduledData, includeRouteData);
            if (result != null) {
                results.add(result);
            }
        }

        // Sort results
        sortResults(results);

        // Build response
        return buildResponse(fromStop, toStop, searchDate, searchTime, results);
    }

    /**
     * Process a single projection and create BusResult
     */
    private BusResult processProjection(FindMyBusProjection proj, LocalDate searchDate, LocalTime searchTime,
                                        DayOfWeek dayOfWeek, Map<UUID, String> scheduleExceptions,
                                        boolean includeScheduledData, boolean includeRouteData) {
        
        // Determine data mode
        DataMode dataMode;
        if (proj.getTripId() != null) {
            dataMode = DataMode.REALTIME;
        } else if (proj.getScheduleId() != null) {
            dataMode = DataMode.SCHEDULE;
        } else {
            dataMode = DataMode.STATIC;
        }

        // For REALTIME mode - always include (trips are actual occurrences)
        if (dataMode == DataMode.REALTIME) {
            // Filter by search time
            LocalTime departureTime = proj.getTripActualDepartureTime() != null ? 
                    proj.getTripActualDepartureTime() : proj.getTripScheduledDepartureTime();
            
            if (departureTime != null && departureTime.isBefore(searchTime)) {
                return null; // Skip trips that have already departed
            }
            
            return buildRealtimeResult(proj);
        }

        // For SCHEDULE mode - validate calendar and exceptions
        if (dataMode == DataMode.SCHEDULE) {
            if (!includeScheduledData) {
                return null;
            }

            // Check schedule exceptions
            String exceptionType = scheduleExceptions.get(proj.getScheduleId());
            if (exceptionType != null) {
                if ("REMOVED".equals(exceptionType)) {
                    return null; // Schedule removed for this date
                } else if ("ADDED".equals(exceptionType)) {
                    // Schedule specially added - include it
                    return buildScheduleResultFromProjection(proj, searchTime);
                }
            }

            // Validate calendar (day of week)
            if (!isValidForDayOfWeek(proj, dayOfWeek)) {
                return null;
            }

            // Filter by search time
            LocalTime departureTime = proj.getFromDepartureTime();
            if (departureTime != null && departureTime.isBefore(searchTime)) {
                return null; // Skip schedules that have already passed
            }

            return buildScheduleResultFromProjection(proj, searchTime);
        }

        // For STATIC mode - only include if requested
        if (dataMode == DataMode.STATIC && includeRouteData) {
            return buildStaticResult(proj);
        }

        return null;
    }

    /**
     * Check if schedule is valid for a specific day of week
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
        
        // If no calendar data, assume runs every day
        if (runsOnDay == null) {
            return true;
        }
        
        return Boolean.TRUE.equals(runsOnDay);
    }

    /**
     * Build REALTIME mode result from projection
     */
    private BusResult buildRealtimeResult(FindMyBusProjection proj) {
        // Calculate distance
        Double distanceKm = calculateDistance(proj.getFromDistanceFromStart(), proj.getToDistanceFromStart());

        // Determine if already departed and status
        boolean alreadyDeparted = false;
        String statusMessage = "Bus available";
        String tripStatus = proj.getTripStatus();
        
        if ("completed".equals(tripStatus) || "cancelled".equals(tripStatus)) {
            alreadyDeparted = true;
            statusMessage = "Trip " + tripStatus.toLowerCase();
        } else if (proj.getTripActualDepartureTime() != null && proj.getFromDepartureTime() != null) {
            alreadyDeparted = proj.getTripActualDepartureTime().isAfter(proj.getFromDepartureTime());
            if (alreadyDeparted) {
                statusMessage = "Already departed from your stop";
            }
        }

        return BusResult.builder()
                .dataMode(DataMode.REALTIME)
                // Route info
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
                // Distance and stop order
                .distanceKm(distanceKm)
                .fromStopOrder(proj.getFromStopOrder())
                .toStopOrder(proj.getToStopOrder())
                // Schedule info
                .scheduleId(proj.getScheduleId())
                .scheduleName(proj.getScheduleName())
                .scheduledDepartureAtOrigin(proj.getFromDepartureTime())
                .scheduledArrivalAtDestination(proj.getToArrivalTime())
                // Trip info
                .tripId(proj.getTripId())
                .tripStatus(tripStatus)
                .actualDepartureTime(proj.getTripActualDepartureTime())
                .actualArrivalTime(proj.getTripActualArrivalTime())
                // Bus info
                .busId(proj.getBusId())
                .busPlateNumber(proj.getBusPlateNumber())
                .busModel(proj.getBusModel())
                // Route Group
                .routeGroupId(proj.getRouteGroupId())
                .routeGroupName(proj.getRouteGroupName())
                // Flags
                .alreadyDeparted(alreadyDeparted)
                .statusMessage(statusMessage)
                .build();
    }

    /**
     * Build SCHEDULE mode result from projection
     */
    private BusResult buildScheduleResultFromProjection(FindMyBusProjection proj, LocalTime searchTime) {
        Double distanceKm = calculateDistance(proj.getFromDistanceFromStart(), proj.getToDistanceFromStart());

        return BusResult.builder()
                .dataMode(DataMode.SCHEDULE)
                // Route info
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
                // Distance and stop order
                .distanceKm(distanceKm)
                .fromStopOrder(proj.getFromStopOrder())
                .toStopOrder(proj.getToStopOrder())
                // Schedule info
                .scheduleId(proj.getScheduleId())
                .scheduleName(proj.getScheduleName())
                .scheduledDepartureAtOrigin(proj.getFromDepartureTime())
                .scheduledArrivalAtDestination(proj.getToArrivalTime())
                // Flags
                .alreadyDeparted(false)
                .statusMessage("Scheduled service - no real-time data available")
                .build();
    }

    /**
     * Build STATIC mode result from projection
     */
    private BusResult buildStaticResult(FindMyBusProjection proj) {
        Double distanceKm = calculateDistance(proj.getFromDistanceFromStart(), proj.getToDistanceFromStart());

        return BusResult.builder()
                .dataMode(DataMode.STATIC)
                // Route info
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
                // Distance and stop order
                .distanceKm(distanceKm)
                .fromStopOrder(proj.getFromStopOrder())
                .toStopOrder(proj.getToStopOrder())
                // Route Group
                .routeGroupId(proj.getRouteGroupId())
                .routeGroupName(proj.getRouteGroupName())
                // Status
                .alreadyDeparted(false)
                .statusMessage("No scheduled trips available — buses on this route operate irregularly.")
                .build();
    }

    /**
     * Calculate distance between from and to stops
     */
    private Double calculateDistance(Double fromDistance, Double toDistance) {
        if (fromDistance != null && toDistance != null) {
            return toDistance - fromDistance;
        }
        return null;
    }

    /**
     * Sort results by data mode priority, then by departure time, then by distance
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
}
