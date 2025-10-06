package com.busmate.routeschedule.controller;

import com.busmate.routeschedule.dto.response.passenger.PassengerRouteResponse;
import com.busmate.routeschedule.dto.response.passenger.PassengerStopResponse;
import com.busmate.routeschedule.dto.response.passenger.PassengerTripResponse;
import com.busmate.routeschedule.dto.response.passenger.PassengerNearbyStopsResponse;
import com.busmate.routeschedule.dto.response.passenger.PassengerPaginatedResponse;
import com.busmate.routeschedule.enums.DirectionEnum;
import com.busmate.routeschedule.enums.OperatorTypeEnum;
import com.busmate.routeschedule.enums.TripStatusEnum;
import com.busmate.routeschedule.service.passenger.PassengerRouteService;
import com.busmate.routeschedule.service.passenger.PassengerStopService;
import com.busmate.routeschedule.service.passenger.PassengerTripService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/passenger")
@RequiredArgsConstructor
@Slf4j
@Validated
@Tag(name = "09. Passenger APIs", description = "Public passenger-facing APIs for route discovery, stop information, and trip planning")
public class PassengerController {

    private final PassengerRouteService passengerRouteService;
    private final PassengerStopService passengerStopService;
    private final PassengerTripService passengerTripService;

    // ================================
    // ROUTE DISCOVERY & SEARCH APIs
    // ================================

    @GetMapping("/routes/search")
    @Operation(summary = "Search routes between locations", 
               description = "Find bus routes between origin and destination with comprehensive filtering options")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Routes found successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid search parameters"),
        @ApiResponse(responseCode = "404", description = "No routes found for criteria")
    })
    public ResponseEntity<PassengerPaginatedResponse<PassengerRouteResponse>> searchRoutes(
            @Parameter(description = "Origin stop ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @RequestParam(required = false) UUID fromStopId,
            
            @Parameter(description = "Destination stop ID", example = "123e4567-e89b-12d3-a456-426614174001")
            @RequestParam(required = false) UUID toStopId,
            
            @Parameter(description = "Origin city name", example = "Colombo")
            @RequestParam(required = false) String fromCity,
            
            @Parameter(description = "Destination city name", example = "Kandy")
            @RequestParam(required = false) String toCity,
            
            @Parameter(description = "Route direction", example = "OUTBOUND")
            @RequestParam(required = false) DirectionEnum direction,
            
            @Parameter(description = "Operator type filter", example = "SLTB")
            @RequestParam(required = false) OperatorTypeEnum operatorType,
            
            @Parameter(description = "Maximum distance in kilometers", example = "100.5")
            @RequestParam(required = false) @DecimalMin("0.1") @DecimalMax("1000.0") Double maxDistance,
            
            @Parameter(description = "Search text for route names", example = "Colombo-Kandy")
            @RequestParam(required = false) String searchText,
            
            @Parameter(description = "Travel date for availability check")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate travelDate,
            
            @Parameter(description = "Preferred departure time")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime departureTime,
            
            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") @Min(0) Integer page,
            
            @Parameter(description = "Page size", example = "20")
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) Integer size) {
        
        log.info("Searching routes with criteria: fromStopId={}, toStopId={}, fromCity={}, toCity={}", 
                fromStopId, toStopId, fromCity, toCity);
        
        Pageable pageable = PageRequest.of(page, size);
        
        PassengerPaginatedResponse<PassengerRouteResponse> routes = passengerRouteService.searchRoutes(
                fromCity, toCity, fromStopId, toStopId, null, null, null, null, null,
                operatorType, null, direction, travelDate, departureTime, null, 
                null, null, maxDistance, pageable);
        
        return ResponseEntity.ok(routes);
    }

    @GetMapping("/routes")
    @Operation(summary = "Get all available routes", 
               description = "Retrieve all bus routes with optional filtering")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Routes retrieved successfully")
    })
    public ResponseEntity<PassengerPaginatedResponse<PassengerRouteResponse>> getAllRoutes(
            @Parameter(description = "Filter by operator type", example = "SLTB")
            @RequestParam(required = false) OperatorTypeEnum operatorType,
            
            @Parameter(description = "Filter by direction", example = "OUTBOUND")
            @RequestParam(required = false) DirectionEnum direction,
            
            @Parameter(description = "Search text for route names", example = "Express")
            @RequestParam(required = false) String searchText,
            
            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") @Min(0) Integer page,
            
            @Parameter(description = "Page size", example = "20")
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) Integer size) {
        
        log.info("Getting all routes with filters: operatorType={}, direction={}, searchText={}", 
                operatorType, direction, searchText);
        
        Pageable pageable = PageRequest.of(page, size);
        
        PassengerPaginatedResponse<PassengerRouteResponse> routes = passengerRouteService.getAllRoutes(
                null, null, operatorType, null, direction, true, null, null, searchText, pageable);
        
        return ResponseEntity.ok(routes);
    }

    @GetMapping("/routes/{routeId}")
    @Operation(summary = "Get detailed route information", 
               description = "Retrieve comprehensive details about a specific route including stops and schedules")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Route details retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Route not found")
    })
    public ResponseEntity<PassengerRouteResponse> getRouteDetails(
            @Parameter(description = "Route ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID routeId,
            
            @Parameter(description = "Include stop details", example = "true")
            @RequestParam(defaultValue = "true") Boolean includeStops,
            
            @Parameter(description = "Include schedule information", example = "true")
            @RequestParam(defaultValue = "true") Boolean includeSchedules,
            
            @Parameter(description = "Date for schedule information")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        log.info("Getting route details for routeId={}, includeStops={}, includeSchedules={}", 
                routeId, includeStops, includeSchedules);
        
        PassengerRouteResponse routeDetails = passengerRouteService.getRouteDetails(
                routeId, includeStops, includeSchedules, true, date);
        
        return ResponseEntity.ok(routeDetails);
    }

    // Note: Route stops are included in getRouteDetails when includeStops=true

    // ================================
    // STOP INFORMATION APIs
    // ================================

    @GetMapping("/stops/nearby")
    @Operation(summary = "Find nearby bus stops", 
               description = "Discover bus stops within a specified radius of given coordinates")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Nearby stops found successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid coordinates or radius")
    })
    public ResponseEntity<PassengerNearbyStopsResponse> findNearbyStops(
            @Parameter(description = "Latitude coordinate", example = "6.9271", required = true)
            @RequestParam @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
            
            @Parameter(description = "Longitude coordinate", example = "79.8612", required = true)
            @RequestParam @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,
            
            @Parameter(description = "Search radius in kilometers", example = "2.0")
            @RequestParam(defaultValue = "2.0") @DecimalMin("0.1") @DecimalMax("50.0") Double radius,
            
            @Parameter(description = "Maximum number of stops to return", example = "20")
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) Integer limit,
            
            @Parameter(description = "Include route information for each stop", example = "true")
            @RequestParam(defaultValue = "true") Boolean includeRoutes) {
        
        log.info("Finding nearby stops at lat={}, lon={}, radius={}, limit={}", 
                latitude, longitude, radius, limit);
        
        PassengerNearbyStopsResponse nearbyStops = passengerStopService.findNearbyStops(
                latitude, longitude, radius, includeRoutes, null, null, "distance", "asc", limit);
        
        return ResponseEntity.ok(nearbyStops);
    }

    @GetMapping("/stops/search")
    @Operation(summary = "Search bus stops", 
               description = "Search for bus stops by name, city, or other criteria")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Stops found successfully")
    })
    public ResponseEntity<PassengerPaginatedResponse<PassengerStopResponse>> searchStops(
            @Parameter(description = "Stop name or partial name", example = "Central")
            @RequestParam(required = false) String name,
            
            @Parameter(description = "City name", example = "Colombo")
            @RequestParam(required = false) String city,
            
            @Parameter(description = "General search text", example = "Main Station")
            @RequestParam(required = false) String searchText,
            
            @Parameter(description = "Filter accessible stops only", example = "true")
            @RequestParam(required = false) Boolean accessibleOnly,
            
            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") @Min(0) Integer page,
            
            @Parameter(description = "Page size", example = "20")
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) Integer size) {
        
        log.info("Searching stops with criteria: name={}, city={}, searchText={}, accessibleOnly={}", 
                name, city, searchText, accessibleOnly);
        
        Pageable pageable = PageRequest.of(page, size);
        
        String query = searchText != null ? searchText : name;
        PassengerPaginatedResponse<PassengerStopResponse> stops = passengerStopService.searchStops(
                query, null, null, city, true, accessibleOnly, pageable);
        
        return ResponseEntity.ok(stops);
    }

    @GetMapping("/stops/{stopId}")
    @Operation(summary = "Get detailed stop information", 
               description = "Retrieve comprehensive details about a specific bus stop")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Stop details retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Stop not found")
    })
    public ResponseEntity<PassengerStopResponse> getStopDetails(
            @Parameter(description = "Stop ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID stopId,
            
            @Parameter(description = "Include upcoming trips", example = "true")
            @RequestParam(defaultValue = "true") Boolean includeUpcomingTrips,
            
            @Parameter(description = "Date for trip information")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        log.info("Getting stop details for stopId={}, includeUpcomingTrips={}, date={}", 
                stopId, includeUpcomingTrips, date);
        
        PassengerStopResponse stopDetails = passengerStopService.getStopDetails(
                stopId, true, includeUpcomingTrips, 10, date);
        
        return ResponseEntity.ok(stopDetails);
    }

    @GetMapping("/stops/{stopId}/routes")
    @Operation(summary = "Get routes serving a stop", 
               description = "Retrieve all bus routes that serve a specific stop")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Routes retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Stop not found")
    })
    public ResponseEntity<List<PassengerRouteResponse>> getRoutesForStop(
            @Parameter(description = "Stop ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID stopId,
            
            @Parameter(description = "Filter by operator type", example = "SLTB")
            @RequestParam(required = false) OperatorTypeEnum operatorType,
            
            @Parameter(description = "Filter by direction", example = "OUTBOUND")
            @RequestParam(required = false) DirectionEnum direction,
            
            @Parameter(description = "Date for schedule filtering")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        log.info("Getting routes for stopId={}, operatorType={}, direction={}, date={}", 
                stopId, operatorType, direction, date);
        
        List<PassengerRouteResponse> routes = passengerStopService.getRoutesForStop(
                stopId, operatorType != null ? operatorType.toString() : null, null, 
                direction != null ? direction.toString() : null, null, true, true, "name");
        
        return ResponseEntity.ok(routes);
    }

    // ================================
    // TRIP & SCHEDULE APIs
    // ================================

    @GetMapping("/trips/search")
    @Operation(summary = "Search trips between stops", 
               description = "Find available trips between origin and destination with filtering options")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Trips found successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid search parameters")
    })
    public ResponseEntity<PassengerPaginatedResponse<PassengerTripResponse>> searchTrips(
            @Parameter(description = "Origin stop ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @RequestParam(required = false) UUID fromStopId,
            
            @Parameter(description = "Destination stop ID", example = "123e4567-e89b-12d3-a456-426614174001")
            @RequestParam(required = false) UUID toStopId,
            
            @Parameter(description = "Route ID filter", example = "123e4567-e89b-12d3-a456-426614174000")
            @RequestParam(required = false) UUID routeId,
            
            @Parameter(description = "Travel date (optional for status-only searches)", example = "2025-10-07")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate travelDate,
            
            @Parameter(description = "Departure time (earliest)", example = "08:00")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime departureTimeFrom,
            
            @Parameter(description = "Departure time (latest)", example = "18:00")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime departureTimeTo,
            
            @Parameter(description = "Operator type filter", example = "SLTB")
            @RequestParam(required = false) OperatorTypeEnum operatorType,
            
            @Parameter(description = "Trip status filter", example = "SCHEDULED")
            @RequestParam(required = false) TripStatusEnum status,
            
            @Parameter(description = "Include only direct trips", example = "false")
            @RequestParam(defaultValue = "false") Boolean directOnly,
            
            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") @Min(0) Integer page,
            
            @Parameter(description = "Page size", example = "20")
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) Integer size) {
        
        log.info("Searching trips: fromStopId={}, toStopId={}, routeId={}, travelDate={}, status={}", 
                fromStopId, toStopId, routeId, travelDate, status);
        
        Pageable pageable = PageRequest.of(page, size);
        
        PassengerPaginatedResponse<PassengerTripResponse> trips = passengerTripService.searchTrips(
                fromStopId, toStopId, null, null, routeId, travelDate, departureTimeFrom, departureTimeTo,
                operatorType, null, status, null, null, null, pageable);
        
        return ResponseEntity.ok(trips);
    }

    @GetMapping("/trips/{tripId}")
    @Operation(summary = "Get detailed trip information", 
               description = "Retrieve comprehensive details about a specific trip")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Trip details retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Trip not found")
    })
    public ResponseEntity<PassengerTripResponse> getTripDetails(
            @Parameter(description = "Trip ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID tripId,
            
            @Parameter(description = "Include real-time status", example = "true")
            @RequestParam(defaultValue = "true") Boolean includeRealTimeStatus,
            
            @Parameter(description = "Include stop times", example = "true")
            @RequestParam(defaultValue = "true") Boolean includeStopTimes) {
        
        log.info("Getting trip details for tripId={}, includeRealTimeStatus={}, includeStopTimes={}", 
                tripId, includeRealTimeStatus, includeStopTimes);
        
        PassengerTripResponse tripDetails = passengerTripService.getTripDetails(
                tripId, true, includeStopTimes, true, includeRealTimeStatus);
        
        return ResponseEntity.ok(tripDetails);
    }

    @GetMapping("/trips/{tripId}/status")
    @Operation(summary = "Get real-time trip status", 
               description = "Retrieve current status and location information for a trip")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Trip status retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Trip not found")
    })
    public ResponseEntity<PassengerTripResponse> getTripStatus(
            @Parameter(description = "Trip ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @PathVariable UUID tripId) {
        
        log.info("Getting real-time status for tripId={}", tripId);
        
        PassengerTripResponse status = passengerTripService.getTripStatus(tripId);
        
        return ResponseEntity.ok(status);
    }

    @GetMapping("/trips/active")
    @Operation(summary = "Get active trips", 
               description = "Retrieve currently active trips with optional filtering")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Active trips retrieved successfully")
    })
    public ResponseEntity<PassengerPaginatedResponse<PassengerTripResponse>> getActiveTrips(
            @Parameter(description = "Filter by route ID", example = "123e4567-e89b-12d3-a456-426614174000")
            @RequestParam(required = false) UUID routeId,
            
            @Parameter(description = "Filter by operator type", example = "SLTB")
            @RequestParam(required = false) OperatorTypeEnum operatorType,
            
            @Parameter(description = "Latitude for location-based filtering", example = "6.9271")
            @RequestParam(required = false) @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
            
            @Parameter(description = "Longitude for location-based filtering", example = "79.8612")
            @RequestParam(required = false) @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,
            
            @Parameter(description = "Radius for location-based filtering in km", example = "10.0")
            @RequestParam(required = false) @DecimalMin("0.1") @DecimalMax("100.0") Double radius,
            
            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") @Min(0) Integer page,
            
            @Parameter(description = "Page size", example = "20")
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) Integer size) {
        
        log.info("Getting active trips: routeId={}, operatorType={}, location=({}, {}), radius={}", 
                routeId, operatorType, latitude, longitude, radius);
        
        Pageable pageable = PageRequest.of(page, size);
        
        PassengerPaginatedResponse<PassengerTripResponse> activeTrips = passengerTripService.getActiveTrips(
                routeId, null, null, latitude, longitude, radius, operatorType, null, null, null, pageable);
        
        return ResponseEntity.ok(activeTrips);
    }

    // Note: Trip schedules can be retrieved using searchTrips with date and time filters
}