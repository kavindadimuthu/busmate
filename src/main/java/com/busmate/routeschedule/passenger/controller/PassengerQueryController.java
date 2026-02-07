package com.busmate.routeschedule.passenger.controller;

import com.busmate.routeschedule.passenger.dto.request.FindMyBusRequest;
import com.busmate.routeschedule.passenger.dto.response.FindMyBusResponse;
import com.busmate.routeschedule.enums.RoadTypeEnum;
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
 * Provides endpoints for passengers to search for buses and routes.
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
     * Searches for buses/routes between two stops with the following algorithm:
     * 1. Identifies all direct routes connecting the two stops
     * 2. Checks for active schedules on those routes for the given date
     * 3. Looks for real-time trip data if available
     * 4. Falls back to schedule or static route data as needed
     * 
     * Response modes:
     * - REALTIME: Trip data available with real-time status
     * - SCHEDULE: Schedule data available but no active trips
     * - STATIC: Only route information available
     */
    @GetMapping("/find-my-bus")
    @Operation(
        summary = "Find buses between two stops",
        description = """
            Find available buses/routes between two stops. This API provides the best available data:
            
            **Data Modes:**
            - **REALTIME**: Trip data with real-time status (ON_TIME, DELAYED, etc.)
            - **SCHEDULE**: Schedule-based timing when no trips are available
            - **STATIC**: Basic route information when no schedules exist
            
            **Algorithm:**
            1. Validates stops and finds all direct routes
            2. Fetches active schedules for the search date
            3. Checks for trips (real-time data)
            4. Returns best available data with appropriate fallbacks
            
            **Sorting:**
            Results are sorted by:
            1. Data mode priority (REALTIME > SCHEDULE > STATIC)
            2. Departure time at origin
            3. Travel distance
            """,
        operationId = "findMyBus"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Search completed successfully"
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request - missing or invalid parameters"
        )
    })
    public ResponseEntity<FindMyBusResponse> findMyBus(
            @Parameter(description = "UUID of the origin stop", required = true, example = "33333333-3333-3333-3333-333333333331")
            @RequestParam("fromStopId") UUID fromStopId,
            
            @Parameter(description = "UUID of the destination stop", required = true, example = "44444444-4444-4444-4444-444444444441")
            @RequestParam("toStopId") UUID toStopId,
            
            @Parameter(description = "Date for which to find buses (defaults to today)", example = "2025-12-07")
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            
            @Parameter(description = "Time from which to find buses (defaults to 00:00)", example = "08:00", schema = @Schema(type = "string", format = "time"))
            @RequestParam(value = "time", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime time,
            
            @Parameter(description = "Filter by route number", example = "101")
            @RequestParam(value = "routeNumber", required = false) String routeNumber,
            
            @Parameter(description = "Filter by road type", example = "NORMALWAY")
            @RequestParam(value = "roadType", required = false) RoadTypeEnum roadType,
            
            @Parameter(description = "Include schedule-based results when no trips available (default: true)", example = "true")
            @RequestParam(value = "includeScheduledData", required = false, defaultValue = "true") Boolean includeScheduledData,
            
            @Parameter(description = "Include static route data as fallback when no schedules available (default: true)", example = "true")
            @RequestParam(value = "includeRouteData", required = false, defaultValue = "true") Boolean includeRouteData) {
        
        log.info("Find My Bus request received: fromStop={}, toStop={}, date={}, time={}", 
                fromStopId, toStopId, date, time);
        
        // Build request object from query parameters
        FindMyBusRequest request = new FindMyBusRequest();
        request.setFromStopId(fromStopId);
        request.setToStopId(toStopId);
        request.setDate(date);
        request.setTime(time);
        request.setRouteNumber(routeNumber);
        request.setRoadType(roadType);
        request.setIncludeScheduledData(includeScheduledData);
        request.setIncludeRouteData(includeRouteData);
        
        FindMyBusResponse response = passengerQueryService.findMyBus(request);
        
        log.info("Find My Bus response: success={}, totalResults={}", 
                response.isSuccess(), response.getTotalResults());
        
        return ResponseEntity.ok(response);
    }
}
