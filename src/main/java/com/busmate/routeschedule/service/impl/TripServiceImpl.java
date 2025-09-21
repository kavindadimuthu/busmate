package com.busmate.routeschedule.service.impl;

import com.busmate.routeschedule.dto.request.BulkPspAssignmentRequest;
import com.busmate.routeschedule.dto.request.TripRequest;
import com.busmate.routeschedule.dto.response.BulkPspAssignmentResponse;
import com.busmate.routeschedule.dto.response.TripResponse;
import com.busmate.routeschedule.entity.*;
import com.busmate.routeschedule.enums.TripStatusEnum;
import com.busmate.routeschedule.enums.StatusEnum;
import com.busmate.routeschedule.exception.BadRequestException;
import com.busmate.routeschedule.exception.ConflictException;
import com.busmate.routeschedule.exception.ResourceNotFoundException;
import com.busmate.routeschedule.repository.*;
import com.busmate.routeschedule.service.TripService;
import com.busmate.routeschedule.util.MapperUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TripServiceImpl implements TripService {
    private final TripRepository tripRepository;
    private final PassengerServicePermitRepository passengerServicePermitRepository;
    private final ScheduleRepository scheduleRepository;
    private final BusRepository busRepository;
    private final MapperUtils mapperUtils;

    @Override
    public TripResponse createTrip(TripRequest request, String userId) {
        validateTripRequest(request);
        
        // PSP is optional - can be null
        PassengerServicePermit passengerServicePermit = request.getPassengerServicePermitId() != null 
                ? validateAndGetPassengerServicePermit(request.getPassengerServicePermitId()) 
                : null;
        
        // Schedule is mandatory
        Schedule schedule = validateAndGetSchedule(request.getScheduleId());
        Bus bus = request.getBusId() != null ? validateAndGetBus(request.getBusId()) : null;
        
        // Check for duplicate trip (only check with schedule and date since PSP is optional)
        if (tripRepository.existsByTripDateAndScheduleId(request.getTripDate(), request.getScheduleId())) {
            throw new ConflictException("Trip already exists for schedule " + request.getScheduleId() + 
                    " on date " + request.getTripDate());
        }

        Trip trip = mapToTrip(request, userId, passengerServicePermit, schedule, bus);
        Trip savedTrip = tripRepository.save(trip);
        return mapToResponse(savedTrip);
    }

    @Override
    @Transactional(readOnly = true)
    public TripResponse getTripById(UUID id) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));
        return mapToResponse(trip);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getAllTrips() {
        return tripRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getTripsByPassengerServicePermit(UUID passengerServicePermitId) {
        return tripRepository.findByPassengerServicePermitId(passengerServicePermitId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getTripsBySchedule(UUID scheduleId) {
        return tripRepository.findByScheduleId(scheduleId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getTripsByRoute(UUID routeId) {
        log.info("Fetching trips for route with ID: {}", routeId);
        return tripRepository.findByScheduleRouteId(routeId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getTripsByDate(LocalDate tripDate) {
        return tripRepository.findByTripDate(tripDate).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getTripsByDateRange(LocalDate startDate, LocalDate endDate) {
        return tripRepository.findByTripDateBetween(startDate, endDate).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getTripsByStatus(TripStatusEnum status) {
        return tripRepository.findByStatus(status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getTripsByBus(UUID busId) {
        return tripRepository.findByBusId(busId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getTripsByDriver(UUID driverId) {
        return tripRepository.findByDriverId(driverId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getTripsByConductor(UUID conductorId) {
        return tripRepository.findByConductorId(conductorId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public TripResponse updateTrip(UUID id, TripRequest request, String userId) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));

        validateTripRequest(request);
        
        // PSP is optional - can be null
        PassengerServicePermit passengerServicePermit = request.getPassengerServicePermitId() != null 
                ? validateAndGetPassengerServicePermit(request.getPassengerServicePermitId()) 
                : null;
        
        Schedule schedule = validateAndGetSchedule(request.getScheduleId());
        Bus bus = request.getBusId() != null ? validateAndGetBus(request.getBusId()) : null;

        // Check for duplicate if schedule or date changed
        if (!trip.getSchedule().getId().equals(request.getScheduleId()) ||
            !trip.getTripDate().equals(request.getTripDate())) {
            if (tripRepository.existsByTripDateAndScheduleId(request.getTripDate(), request.getScheduleId())) {
                throw new ConflictException("Trip already exists for schedule " + request.getScheduleId() + 
                        " on date " + request.getTripDate());
            }
        }

        updateTripFromRequest(trip, request, passengerServicePermit, schedule, bus, userId);
        Trip updatedTrip = tripRepository.save(trip);
        return mapToResponse(updatedTrip);
    }

    @Override
    public TripResponse updateTripStatus(UUID id, TripStatusEnum status, String userId) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));

        trip.setStatus(status);
        trip.setUpdatedBy(userId);
        
        Trip updatedTrip = tripRepository.save(trip);
        return mapToResponse(updatedTrip);
    }

    @Override
    public TripResponse startTrip(UUID id, String userId) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));

        if (!trip.getStatus().equals(TripStatusEnum.pending)) {
            throw new ConflictException("Trip must be in pending status to start");
        }

        trip.setStatus(TripStatusEnum.active);
        trip.setActualDepartureTime(LocalTime.now());
        trip.setUpdatedBy(userId);
        
        Trip updatedTrip = tripRepository.save(trip);
        return mapToResponse(updatedTrip);
    }

    @Override
    public TripResponse completeTrip(UUID id, String userId) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));

        if (!trip.getStatus().equals(TripStatusEnum.active)) {
            throw new ConflictException("Trip must be active to complete");
        }

        trip.setStatus(TripStatusEnum.completed);
        trip.setActualArrivalTime(LocalTime.now());
        trip.setUpdatedBy(userId);
        
        Trip updatedTrip = tripRepository.save(trip);
        return mapToResponse(updatedTrip);
    }

    @Override
    public TripResponse cancelTrip(UUID id, String cancellationReason, String userId) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));

        trip.setStatus(TripStatusEnum.cancelled);
        trip.setNotes(cancellationReason);
        trip.setUpdatedBy(userId);
        
        Trip updatedTrip = tripRepository.save(trip);
        return mapToResponse(updatedTrip);
    }

    @Override
    public void deleteTrip(UUID id) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));
        tripRepository.deleteById(id);
    }

    @Override
    public List<TripResponse> generateTripsForSchedule(UUID scheduleId, LocalDate fromDate, LocalDate toDate, String userId) {
        log.info("Generating trips for schedule with ID: {} by user: {}", scheduleId, userId);

        // Validate schedule exists
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with ID: " + scheduleId));

        // If dates are not provided, use the schedule's entire validity period
        LocalDate effectiveFromDate = fromDate != null ? fromDate : schedule.getEffectiveStartDate();
        LocalDate effectiveToDate = toDate != null ? toDate : schedule.getEffectiveEndDate();
        
        log.info("Using date range: {} to {} (original: {} to {})", 
                effectiveFromDate, effectiveToDate, fromDate, toDate);

        // Validate date range
        if (effectiveFromDate.isAfter(effectiveToDate)) {
            throw new BadRequestException("From date cannot be after to date");
        }

        // Validate dates are within schedule validity period
        if (effectiveFromDate.isBefore(schedule.getEffectiveStartDate()) || effectiveToDate.isAfter(schedule.getEffectiveEndDate())) {
            throw new BadRequestException("Date range must be within schedule validity period (" + 
                    schedule.getEffectiveStartDate() + " to " + schedule.getEffectiveEndDate() + ")");
        }

        // Get schedule stops to determine departure and arrival times
        List<ScheduleStop> scheduleStops = schedule.getScheduleStops();
        if (scheduleStops == null || scheduleStops.isEmpty()) {
            throw new BadRequestException("Schedule has no stops defined. Cannot generate trips.");
        }

        // Sort schedule stops by stop order to get first and last stops
        scheduleStops.sort((s1, s2) -> s1.getStopOrder().compareTo(s2.getStopOrder()));
        
        ScheduleStop firstStop = scheduleStops.get(0);
        ScheduleStop lastStop = scheduleStops.get(scheduleStops.size() - 1);
        
        LocalTime scheduledDepartureTime = firstStop.getDepartureTime();
        LocalTime scheduledArrivalTime = lastStop.getArrivalTime();
        
        if (scheduledDepartureTime == null) {
            throw new BadRequestException("First stop must have a departure time defined");
        }
        if (scheduledArrivalTime == null) {
            throw new BadRequestException("Last stop must have an arrival time defined");
        }

        log.info("Trip schedule times - Departure: {}, Arrival: {}", scheduledDepartureTime, scheduledArrivalTime);

        List<Trip> trips = new ArrayList<>();
        LocalDate currentDate = effectiveFromDate;

        while (!currentDate.isAfter(effectiveToDate)) {
            // Check if trip already exists for this date and schedule
            boolean tripExists = tripRepository.existsByScheduleIdAndTripDate(scheduleId, currentDate);
            
            if (!tripExists) {
                Trip trip = new Trip();
                trip.setSchedule(schedule);
                trip.setPassengerServicePermit(null); // PSP is optional during trip generation
                trip.setTripDate(currentDate);
                trip.setScheduledDepartureTime(scheduledDepartureTime);
                trip.setScheduledArrivalTime(scheduledArrivalTime);
                trip.setStatus(TripStatusEnum.pending);
                trip.setCreatedBy(userId);
                trip.setUpdatedBy(userId);

                trips.add(trip);
            }

            currentDate = currentDate.plusDays(1);
        }

        if (trips.isEmpty()) {
            log.info("No trips to generate - all trips already exist for the date range");
            return Collections.emptyList();
        }

        List<Trip> savedTrips = tripRepository.saveAll(trips);
        log.info("Successfully generated {} trips for schedule {}", savedTrips.size(), scheduleId);

        return savedTrips.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public TripResponse assignPassengerServicePermitToTrip(UUID tripId, UUID passengerServicePermitId, String userId) {
        log.info("Assigning PSP {} to trip {} by user: {}", passengerServicePermitId, tripId, userId);

        // Get the trip
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with ID: " + tripId));

        // Validate PSP exists
        PassengerServicePermit psp = passengerServicePermitRepository.findById(passengerServicePermitId)
                .orElseThrow(() -> new ResourceNotFoundException("Passenger Service Permit not found with ID: " + passengerServicePermitId));

        // Check if trip already has a PSP assigned
        if (trip.getPassengerServicePermit() != null) {
            throw new BadRequestException("Trip already has a passenger service permit assigned");
        }

        // Validate PSP is active
        if (psp.getStatus() != StatusEnum.active) {
            throw new BadRequestException("Passenger Service Permit must be active to assign to trip");
        }

        // Check for duplicate assignment - same PSP, same route, same date
        boolean duplicateExists = tripRepository.existsByPassengerServicePermitIdAndScheduleRouteIdAndTripDate(
                passengerServicePermitId, trip.getSchedule().getRoute().getId(), trip.getTripDate());

        if (duplicateExists) {
            throw new ConflictException(
                    "A trip with the same passenger service permit and route already exists for date: " + trip.getTripDate());
        }

        // Assign PSP to trip
        trip.setPassengerServicePermit(psp);
        trip.setUpdatedBy(userId);

        Trip savedTrip = tripRepository.save(trip);
        log.info("Successfully assigned PSP {} to trip {}", passengerServicePermitId, tripId);

        return mapToResponse(savedTrip);
    }

    @Override
    public List<TripResponse> bulkAssignPassengerServicePermitToTrips(List<UUID> tripIds, UUID passengerServicePermitId, String userId) {
        log.info("Bulk assigning PSP {} to {} trips by user: {}", passengerServicePermitId, tripIds.size(), userId);

        // Validate PSP exists and is active
        PassengerServicePermit psp = passengerServicePermitRepository.findById(passengerServicePermitId)
                .orElseThrow(() -> new ResourceNotFoundException("Passenger Service Permit not found with ID: " + passengerServicePermitId));

        if (psp.getStatus() != StatusEnum.active) {
            throw new BadRequestException("Passenger Service Permit must be active to assign to trips");
        }

        // Get all trips
        List<Trip> trips = tripRepository.findAllById(tripIds);
        if (trips.size() != tripIds.size()) {
            throw new ResourceNotFoundException("One or more trips not found");
        }

        // Validate none of the trips already have PSP assigned
        List<Trip> tripsWithPSP = trips.stream()
                .filter(trip -> trip.getPassengerServicePermit() != null)
                .collect(Collectors.toList());

        if (!tripsWithPSP.isEmpty()) {
            throw new BadRequestException("Some trips already have passenger service permits assigned");
        }

        // Check for potential duplicates
        for (Trip trip : trips) {
            boolean duplicateExists = tripRepository.existsByPassengerServicePermitIdAndScheduleRouteIdAndTripDate(
                    passengerServicePermitId, trip.getSchedule().getRoute().getId(), trip.getTripDate());

            if (duplicateExists) {
                throw new ConflictException(
                        "A trip with the same passenger service permit and route already exists for date: " + trip.getTripDate());
            }
        }

        // Assign PSP to all trips
        trips.forEach(trip -> {
            trip.setPassengerServicePermit(psp);
            trip.setUpdatedBy(userId);
        });

        List<Trip> savedTrips = tripRepository.saveAll(trips);
        log.info("Successfully assigned PSP {} to {} trips", passengerServicePermitId, savedTrips.size());

        return savedTrips.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public TripResponse removePassengerServicePermitFromTrip(UUID tripId, String userId) {
        log.info("Removing PSP from trip {} by user: {}", tripId, userId);

        // Get the trip
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with ID: " + tripId));

        // Check if trip has a PSP assigned
        if (trip.getPassengerServicePermit() == null) {
            throw new BadRequestException("Trip does not have a passenger service permit assigned");
        }

        // Remove PSP from trip
        trip.setPassengerServicePermit(null);
        trip.setUpdatedBy(userId);

        Trip savedTrip = tripRepository.save(trip);
        log.info("Successfully removed PSP from trip {}", tripId);

        return mapToResponse(savedTrip);
    }

    private void validateTripRequest(TripRequest request) {
        if (request.getScheduledDepartureTime().isAfter(request.getScheduledArrivalTime())) {
            throw new ConflictException("Scheduled departure time cannot be after arrival time");
        }
        
        if (request.getActualDepartureTime() != null && request.getActualArrivalTime() != null) {
            if (request.getActualDepartureTime().isAfter(request.getActualArrivalTime())) {
                throw new ConflictException("Actual departure time cannot be after arrival time");
            }
        }
        
        try {
            TripStatusEnum.valueOf(request.getStatus());
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid status: " + request.getStatus());
        }
    }

    private PassengerServicePermit validateAndGetPassengerServicePermit(UUID passengerServicePermitId) {
        return passengerServicePermitRepository.findById(passengerServicePermitId)
                .orElseThrow(() -> new ResourceNotFoundException("Passenger Service Permit not found with id: " + passengerServicePermitId));
    }

    private Schedule validateAndGetSchedule(UUID scheduleId) {
        return scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + scheduleId));
    }

    private Bus validateAndGetBus(UUID busId) {
        return busRepository.findById(busId)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + busId));
    }

    private Trip mapToTrip(TripRequest request, String userId, PassengerServicePermit passengerServicePermit, Schedule schedule, Bus bus) {
        Trip trip = new Trip();
        trip.setPassengerServicePermit(passengerServicePermit);
        trip.setSchedule(schedule);
        trip.setTripDate(request.getTripDate());
        trip.setScheduledDepartureTime(request.getScheduledDepartureTime());
        trip.setActualDepartureTime(request.getActualDepartureTime());
        trip.setScheduledArrivalTime(request.getScheduledArrivalTime());
        trip.setActualArrivalTime(request.getActualArrivalTime());
        trip.setBus(bus);
        trip.setDriverId(request.getDriverId());
        trip.setConductorId(request.getConductorId());
        trip.setStatus(TripStatusEnum.valueOf(request.getStatus()));
        trip.setNotes(request.getNotes());
        trip.setCreatedBy(userId);
        trip.setUpdatedBy(userId);
        return trip;
    }

    private void updateTripFromRequest(Trip trip, TripRequest request, PassengerServicePermit passengerServicePermit, Schedule schedule, Bus bus, String userId) {
        trip.setPassengerServicePermit(passengerServicePermit);
        trip.setSchedule(schedule);
        trip.setTripDate(request.getTripDate());
        trip.setScheduledDepartureTime(request.getScheduledDepartureTime());
        trip.setActualDepartureTime(request.getActualDepartureTime());
        trip.setScheduledArrivalTime(request.getScheduledArrivalTime());
        trip.setActualArrivalTime(request.getActualArrivalTime());
        trip.setBus(bus);
        trip.setDriverId(request.getDriverId());
        trip.setConductorId(request.getConductorId());
        trip.setStatus(TripStatusEnum.valueOf(request.getStatus()));
        trip.setNotes(request.getNotes());
        trip.setUpdatedBy(userId);
    }

    private TripResponse mapToResponse(Trip trip) {
        TripResponse response = mapperUtils.map(trip, TripResponse.class);
        
        // Passenger Service Permit details (nullable)
        PassengerServicePermit permit = trip.getPassengerServicePermit();
        if (permit != null) {
            response.setPassengerServicePermitId(permit.getId());
            response.setPassengerServicePermitNumber(permit.getPermitNumber());
            response.setPermitId(permit.getId());
            response.setPermitNumber(permit.getPermitNumber());
            
            // Operator details
            Operator operator = permit.getOperator();
            if (operator != null) {
                response.setOperatorId(operator.getId());
                response.setOperatorName(operator.getName());
            }
        }
        
        // Schedule details
        Schedule schedule = trip.getSchedule();
        response.setScheduleId(schedule.getId());
        response.setScheduleName(schedule.getName());
        
        // Route details
        Route route = schedule.getRoute();
        response.setRouteId(route.getId());
        response.setRouteName(route.getName());
        
        // Route Group details
        if (route.getRouteGroup() != null) {
            response.setRouteGroupId(route.getRouteGroup().getId());
            response.setRouteGroupName(route.getRouteGroup().getName());
        }
        
        // Bus details
        if (trip.getBus() != null) {
            response.setBusId(trip.getBus().getId());
            response.setBusPlateNumber(trip.getBus().getPlateNumber());
            response.setBusModel(trip.getBus().getModel());
        }
        
        return response;
    }

    @Override
    public BulkPspAssignmentResponse bulkAssignPspsToTrips(BulkPspAssignmentRequest request, String userId) {
        log.info("Processing bulk PSP assignment for {} assignments by user: {}", 
                request.getAssignments().size(), userId);
        
        List<BulkPspAssignmentResponse.AssignmentResult> successfulResults = new ArrayList<>();
        List<BulkPspAssignmentResponse.AssignmentResult> failedResults = new ArrayList<>();
        
        // Process each assignment
        for (BulkPspAssignmentRequest.PspTripAssignment assignment : request.getAssignments()) {
            try {
                // Attempt to assign PSP to trip
                TripResponse tripResponse = assignPassengerServicePermitToTrip(
                        assignment.getTripId(), 
                        assignment.getPassengerServicePermitId(), 
                        userId
                );
                
                // Add to successful results
                successfulResults.add(BulkPspAssignmentResponse.AssignmentResult.builder()
                        .tripId(assignment.getTripId())
                        .passengerServicePermitId(assignment.getPassengerServicePermitId())
                        .success(true)
                        .tripResponse(tripResponse)
                        .build());
                        
            } catch (Exception e) {
                log.warn("Failed to assign PSP {} to trip {}: {}", 
                        assignment.getPassengerServicePermitId(), 
                        assignment.getTripId(), 
                        e.getMessage());
                
                // Add to failed results
                failedResults.add(BulkPspAssignmentResponse.AssignmentResult.builder()
                        .tripId(assignment.getTripId())
                        .passengerServicePermitId(assignment.getPassengerServicePermitId())
                        .success(false)
                        .errorMessage(e.getMessage())
                        .build());
            }
        }
        
        // Build final response
        BulkPspAssignmentResponse response = BulkPspAssignmentResponse.builder()
                .totalRequested(request.getAssignments().size())
                .successfulAssignments(successfulResults.size())
                .failedAssignments(failedResults.size())
                .processedAt(java.time.LocalDateTime.now())
                .successfulResults(successfulResults)
                .failedResults(failedResults)
                .build();
                
        log.info("Bulk PSP assignment completed: {} successful, {} failed out of {} total", 
                response.getSuccessfulAssignments(), 
                response.getFailedAssignments(), 
                response.getTotalRequested());
                
        return response;
    }
}