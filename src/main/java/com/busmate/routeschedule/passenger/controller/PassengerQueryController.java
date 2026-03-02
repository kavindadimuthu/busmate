package com.busmate.routeschedule.passenger.controller;

import com.busmate.routeschedule.passenger.dto.request.FindMyBusDetailsRequest;
import com.busmate.routeschedule.passenger.dto.request.FindMyBusRequest;
import com.busmate.routeschedule.passenger.dto.response.FindMyBusDetailsResponse;
import com.busmate.routeschedule.passenger.dto.response.FindMyBusResponse;
import com.busmate.routeschedule.enums.RoadTypeEnum;
import com.busmate.routeschedule.enums.TimePreferenceEnum;
import com.busmate.routeschedule.passenger.service.PassengerQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Controller for passenger query APIs.
 * Provides the "Find My Bus" feature for passengers to search for bus services.
 */
@RestController
@RequestMapping("/api/passenger")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "10. Passenger Query", description = "APIs for passengers to query bus and route information")
public class PassengerQueryController {

    private final PassengerQueryService passengerQueryService;

    /**
     * Find My Bus API
     * 
     * Searches for bus services between two stops, returning schedule-based results
     * with timing information and optional trip details (bus, operator, permit).
     */
    @GetMapping("/find-my-bus")
    @Operation(
        summary = "Find buses between two stops",
        description = """
            Find available bus services between two stops with schedule timings.
            
            **Response includes:**
            - Route information (name, number, road type, via)
            - Schedule timings (departure at origin, arrival at destination)
            - Trip details if available (bus, operator, PSP)
            - Time source indicators for reliability assessment
            
            **Time Preferences:**
            - **VERIFIED_ONLY**: Only verified times (most reliable, fewer results)
            - **PREFER_UNVERIFIED**: Verified > Unverified
            - **PREFER_CALCULATED/DEFAULT**: Verified > Unverified > Calculated
            
            **Time Sources:**
            Each time value includes its source (VERIFIED, UNVERIFIED, CALCULATED, UNAVAILABLE)
            to indicate reliability.
            
            **Sorting:** Results sorted by departure time, then by distance.
            """,
        operationId = "findMyBus"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Search completed successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request parameters")
    })
    public ResponseEntity<FindMyBusResponse> findMyBus(
            @Parameter(description = "UUID of the origin stop", required = true, 
                       example = "33333333-3333-3333-3333-333333333331")
            @RequestParam("fromStopId") UUID fromStopId,
            
            @Parameter(description = "UUID of the destination stop", required = true, 
                       example = "44444444-4444-4444-4444-444444444441")
            @RequestParam("toStopId") UUID toStopId,
            
            @Parameter(description = "Date for which to find buses (defaults to today)", 
                       example = "2026-02-08")
            @RequestParam(value = "date", required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            
            @Parameter(description = "Time from which to find buses (defaults to 00:00)", 
                       example = "08:00", schema = @Schema(type = "string", format = "time"))
            @RequestParam(value = "time", required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime time,
            
            @Parameter(description = "Filter by route number", example = "101")
            @RequestParam(value = "routeNumber", required = false) String routeNumber,
            
            @Parameter(description = "Filter by road type", example = "NORMALWAY")
            @RequestParam(value = "roadType", required = false) RoadTypeEnum roadType,
            
            @Parameter(description = "Time preference for schedule times", example = "DEFAULT")
            @RequestParam(value = "timePreference", required = false, defaultValue = "DEFAULT") 
            TimePreferenceEnum timePreference) {
        
        log.info("Find My Bus: fromStop={}, toStop={}, date={}, time={}, timePreference={}", 
                fromStopId, toStopId, date, time, timePreference);
        
        FindMyBusRequest request = new FindMyBusRequest();
        request.setFromStopId(fromStopId);
        request.setToStopId(toStopId);
        request.setDate(date);
        request.setTime(time);
        request.setRouteNumber(routeNumber);
        request.setRoadType(roadType);
        request.setTimePreference(timePreference);
        
        FindMyBusResponse response = passengerQueryService.findMyBus(request);
        
        log.info("Find My Bus response: success={}, results={}", 
                response.isSuccess(), response.getTotalResults());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Find My Bus Details API
     * 
     * Provides comprehensive details for a specific schedule/trip between two stops.
     * This is the drill-down API after Find My Bus - used when a passenger selects
     * a specific schedule from the search results.
     */
    @GetMapping("/find-my-bus-details")
    @Operation(
        summary = "Get comprehensive schedule/trip details",
        description = """
            Get detailed information for a specific schedule and optionally a specific trip.
            Use this after Find My Bus to get complete schedule information.
            
            **Response includes:**
            - **Route information**: Full route details with route group
            - **Schedule information**: Complete schedule with ALL stops (not just origin/destination)
            - **All time types**: Verified, unverified, and calculated times for each stop
            - **Calendar info**: Which days the schedule operates
            - **Exceptions**: Cancelled or specially added dates
            - **Trip details** (if tripId provided): Bus, operator, PSP, real-time data
            - **Journey summary**: Quick view of origin-destination with resolved times
            
            **Time Preferences:**
            - **VERIFIED_ONLY**: Only verified times (most reliable)
            - **PREFER_UNVERIFIED**: Verified > Unverified
            - **PREFER_CALCULATED/DEFAULT**: Verified > Unverified > Calculated
            
            All three time types are always returned for each stop, plus the resolved
            time based on the selected preference.
            """,
        operationId = "findMyBusDetails"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Details retrieved successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
        @ApiResponse(responseCode = "404", description = "Schedule or stops not found")
    })
    public ResponseEntity<FindMyBusDetailsResponse> findMyBusDetails(
            @Parameter(description = "UUID of the schedule", required = true, 
                       example = "11111111-1111-1111-1111-111111111111")
            @RequestParam("scheduleId") UUID scheduleId,
            
            @Parameter(description = "UUID of the origin stop", required = true, 
                       example = "33333333-3333-3333-3333-333333333331")
            @RequestParam("fromStopId") UUID fromStopId,
            
            @Parameter(description = "UUID of the destination stop", required = true, 
                       example = "44444444-4444-4444-4444-444444444441")
            @RequestParam("toStopId") UUID toStopId,
            
            @Parameter(description = "Optional UUID of a specific trip for bus/operator details", 
                       example = "22222222-2222-2222-2222-222222222222")
            @RequestParam(value = "tripId", required = false) UUID tripId,
            
            @Parameter(description = "Date for context (calendar/exceptions)", 
                       example = "2026-02-08")
            @RequestParam(value = "date", required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            
            @Parameter(description = "Time preference for resolved schedule times", example = "DEFAULT")
            @RequestParam(value = "timePreference", required = false, defaultValue = "DEFAULT") 
            TimePreferenceEnum timePreference) {
        
        log.info("Find My Bus Details: scheduleId={}, fromStop={}, toStop={}, tripId={}, date={}, timePreference={}", 
                scheduleId, fromStopId, toStopId, tripId, date, timePreference);
        
        FindMyBusDetailsRequest request = new FindMyBusDetailsRequest();
        request.setScheduleId(scheduleId);
        request.setFromStopId(fromStopId);
        request.setToStopId(toStopId);
        request.setTripId(tripId);
        request.setDate(date);
        request.setTimePreference(timePreference);
        
        FindMyBusDetailsResponse response = passengerQueryService.findMyBusDetails(request);
        
        log.info("Find My Bus Details response: success={}, schedule={}", 
                response.isSuccess(), response.getSchedule() != null ? response.getSchedule().getName() : "N/A");
        
        return ResponseEntity.ok(response);
    }
}
