package com.busmate.routeschedule.passenger.controller;

import com.busmate.routeschedule.passenger.dto.request.FindMyBusRequest;
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
}
