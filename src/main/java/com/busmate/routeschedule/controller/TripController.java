package com.busmate.routeschedule.controller;

import com.busmate.routeschedule.dto.request.BulkPspAssignmentRequest;
import com.busmate.routeschedule.dto.request.TripRequest;
import com.busmate.routeschedule.dto.response.BulkPspAssignmentResponse;
import com.busmate.routeschedule.dto.response.TripResponse;
import com.busmate.routeschedule.enums.TripStatusEnum;
import com.busmate.routeschedule.service.TripService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
@Tag(name = "08. Trip Management", description = "APIs for managing trip instances")
public class TripController {
    private final TripService tripService;

    @PostMapping
    @Operation(summary = "Create a new trip")
    public ResponseEntity<TripResponse> createTrip(@Valid @RequestBody TripRequest request, Authentication authentication) {
        String userId = authentication.getName();
        TripResponse response = tripService.createTrip(request, userId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get trip by ID")
    public ResponseEntity<TripResponse> getTripById(@PathVariable UUID id) {
        TripResponse response = tripService.getTripById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "Get all trips")
    public ResponseEntity<List<TripResponse>> getAllTrips() {
        List<TripResponse> responses = tripService.getAllTrips();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/permit/{passengerServicePermitId}")
    @Operation(summary = "Get trips by Passenger Service Permit")
    public ResponseEntity<List<TripResponse>> getTripsByPassengerServicePermit(@PathVariable UUID passengerServicePermitId) {
        List<TripResponse> responses = tripService.getTripsByPassengerServicePermit(passengerServicePermitId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/schedule/{scheduleId}")
    @Operation(summary = "Get trips by Schedule")
    public ResponseEntity<List<TripResponse>> getTripsBySchedule(@PathVariable UUID scheduleId) {
        List<TripResponse> responses = tripService.getTripsBySchedule(scheduleId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/route/{routeId}")
    @Operation(summary = "Get trips by Route", 
               description = "Retrieve all trips associated with a specific route ID. " +
                           "This includes trips from all schedules that belong to the specified route.")
    public ResponseEntity<List<TripResponse>> getTripsByRoute(@PathVariable UUID routeId) {
        List<TripResponse> responses = tripService.getTripsByRoute(routeId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/date/{tripDate}")
    @Operation(summary = "Get trips by date")
    public ResponseEntity<List<TripResponse>> getTripsByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tripDate) {
        List<TripResponse> responses = tripService.getTripsByDate(tripDate);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/date-range")
    @Operation(summary = "Get trips by date range")
    public ResponseEntity<List<TripResponse>> getTripsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<TripResponse> responses = tripService.getTripsByDateRange(startDate, endDate);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Get trips by status")
    public ResponseEntity<List<TripResponse>> getTripsByStatus(@PathVariable TripStatusEnum status) {
        List<TripResponse> responses = tripService.getTripsByStatus(status);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/bus/{busId}")
    @Operation(summary = "Get trips by bus")
    public ResponseEntity<List<TripResponse>> getTripsByBus(@PathVariable UUID busId) {
        List<TripResponse> responses = tripService.getTripsByBus(busId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/driver/{driverId}")
    @Operation(summary = "Get trips by driver")
    public ResponseEntity<List<TripResponse>> getTripsByDriver(@PathVariable UUID driverId) {
        List<TripResponse> responses = tripService.getTripsByDriver(driverId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/conductor/{conductorId}")
    @Operation(summary = "Get trips by conductor")
    public ResponseEntity<List<TripResponse>> getTripsByConductor(@PathVariable UUID conductorId) {
        List<TripResponse> responses = tripService.getTripsByConductor(conductorId);
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update trip")
    public ResponseEntity<TripResponse> updateTrip(@PathVariable UUID id, @Valid @RequestBody TripRequest request, Authentication authentication) {
        String userId = authentication.getName();
        TripResponse response = tripService.updateTrip(id, request, userId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update trip status")
    public ResponseEntity<TripResponse> updateTripStatus(@PathVariable UUID id, @RequestParam TripStatusEnum status, Authentication authentication) {
        String userId = authentication.getName();
        TripResponse response = tripService.updateTripStatus(id, status, userId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/start")
    @Operation(summary = "Start trip")
    public ResponseEntity<TripResponse> startTrip(@PathVariable UUID id, Authentication authentication) {
        String userId = authentication.getName();
        TripResponse response = tripService.startTrip(id, userId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/complete")
    @Operation(summary = "Complete trip")
    public ResponseEntity<TripResponse> completeTrip(@PathVariable UUID id, Authentication authentication) {
        String userId = authentication.getName();
        TripResponse response = tripService.completeTrip(id, userId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancel trip")
    public ResponseEntity<TripResponse> cancelTrip(@PathVariable UUID id, @RequestParam String reason, Authentication authentication) {
        String userId = authentication.getName();
        TripResponse response = tripService.cancelTrip(id, reason, userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/generate")
    @Operation(summary = "Generate trips for schedule within date range or entire validity period", 
               description = "Generate trips for a schedule. If fromDate and toDate are not provided, " +
                           "trips will be generated for the entire validity period of the schedule. " +
                           "If dates are provided, trips will be generated only for the specified period.")
    public ResponseEntity<List<TripResponse>> generateTripsForSchedule(
            @RequestParam UUID scheduleId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            Authentication authentication) {
        String userId = authentication.getName();
        List<TripResponse> responses = tripService.generateTripsForSchedule(scheduleId, fromDate, toDate, userId);
        return new ResponseEntity<>(responses, HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/assign-psp")
    @Operation(summary = "Assign Passenger Service Permit to trip")
    public ResponseEntity<TripResponse> assignPassengerServicePermitToTrip(
            @PathVariable UUID id,
            @RequestParam UUID passengerServicePermitId,
            Authentication authentication) {
        String userId = authentication.getName();
        TripResponse response = tripService.assignPassengerServicePermitToTrip(id, passengerServicePermitId, userId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/bulk-assign-psp")
    @Operation(summary = "Bulk assign Passenger Service Permit to multiple trips")
    public ResponseEntity<List<TripResponse>> bulkAssignPassengerServicePermitToTrips(
            @RequestParam List<UUID> tripIds,
            @RequestParam UUID passengerServicePermitId,
            Authentication authentication) {
        String userId = authentication.getName();
        List<TripResponse> responses = tripService.bulkAssignPassengerServicePermitToTrips(tripIds, passengerServicePermitId, userId);
        return ResponseEntity.ok(responses);
    }

    @PatchMapping("/{id}/remove-psp")
    @Operation(summary = "Remove Passenger Service Permit from trip")
    public ResponseEntity<TripResponse> removePassengerServicePermitFromTrip(
            @PathVariable UUID id,
            Authentication authentication) {
        String userId = authentication.getName();
        TripResponse response = tripService.removePassengerServicePermitFromTrip(id, userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bulk-assign-psps")
    @Operation(summary = "Bulk assign PSPs to trips", 
               description = "Assign multiple Passenger Service Permits to multiple trips in a single operation. " +
                           "This is useful for workspace scenarios where operators need to assign PSPs to trips in bulk. " +
                           "The operation returns details of successful and failed assignments.")
    public ResponseEntity<BulkPspAssignmentResponse> bulkAssignPspsToTrips(
            @Valid @RequestBody BulkPspAssignmentRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        BulkPspAssignmentResponse response = tripService.bulkAssignPspsToTrips(request, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete trip")
    public ResponseEntity<Void> deleteTrip(@PathVariable UUID id) {
        tripService.deleteTrip(id);
        return ResponseEntity.noContent().build();
    }
}