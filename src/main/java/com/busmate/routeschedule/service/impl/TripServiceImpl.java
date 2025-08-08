package com.busmate.routeschedule.service.impl;

import com.busmate.routeschedule.dto.request.TripRequest;
import com.busmate.routeschedule.dto.response.TripResponse;
import com.busmate.routeschedule.entity.*;
import com.busmate.routeschedule.enums.TripStatusEnum;
import com.busmate.routeschedule.exception.ConflictException;
import com.busmate.routeschedule.exception.ResourceNotFoundException;
import com.busmate.routeschedule.repository.*;
import com.busmate.routeschedule.service.TripService;
import com.busmate.routeschedule.util.MapperUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TripServiceImpl implements TripService {
    private final TripRepository tripRepository;
    private final PassengerServicePermitScheduleAssignmentRepository assignmentRepository;
    private final BusRepository busRepository;
    private final MapperUtils mapperUtils;

    @Override
    public TripResponse createTrip(TripRequest request, String userId) {
        validateTripRequest(request);
        
        PassengerServicePermitScheduleAssignment assignment = validateAndGetAssignment(request.getAssignmentId());
        Bus bus = request.getBusId() != null ? validateAndGetBus(request.getBusId()) : null;
        
        // Check for duplicate trip
        if (tripRepository.existsByTripDateAndAssignmentId(request.getTripDate(), request.getAssignmentId())) {
            throw new ConflictException("Trip already exists for assignment " + request.getAssignmentId() + 
                    " on date " + request.getTripDate());
        }

        Trip trip = mapToTrip(request, userId, assignment, bus);
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
    public List<TripResponse> getTripsByAssignment(UUID assignmentId) {
        return tripRepository.findByAssignmentId(assignmentId).stream()
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
        
        PassengerServicePermitScheduleAssignment assignment = validateAndGetAssignment(request.getAssignmentId());
        Bus bus = request.getBusId() != null ? validateAndGetBus(request.getBusId()) : null;

        // Check for duplicate if assignment or date changed
        if (!trip.getAssignment().getId().equals(request.getAssignmentId()) || 
            !trip.getTripDate().equals(request.getTripDate())) {
            if (tripRepository.existsByTripDateAndAssignmentId(request.getTripDate(), request.getAssignmentId())) {
                throw new ConflictException("Trip already exists for assignment " + request.getAssignmentId() + 
                        " on date " + request.getTripDate());
            }
        }

        updateTripFromRequest(trip, request, assignment, bus, userId);
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
    public List<TripResponse> generateTripsForAssignment(UUID assignmentId, LocalDate fromDate, LocalDate toDate, String userId) {
        PassengerServicePermitScheduleAssignment assignment = validateAndGetAssignment(assignmentId);
        
        List<Trip> generatedTrips = new ArrayList<>();
        LocalDate currentDate = fromDate;
        
        while (!currentDate.isAfter(toDate)) {
            if (!tripRepository.existsByTripDateAndAssignmentId(currentDate, assignmentId)) {
                Trip trip = new Trip();
                trip.setAssignment(assignment);
                trip.setTripDate(currentDate);
                
                // Set default scheduled times based on schedule
                if (assignment.getSchedule() != null && !assignment.getSchedule().getScheduleStops().isEmpty()) {
                    // Get first and last schedule stops for departure and arrival times
                    var scheduleStops = assignment.getSchedule().getScheduleStops();
                    scheduleStops.sort((s1, s2) -> Integer.compare(s1.getStopOrder(), s2.getStopOrder()));
                    
                    if (!scheduleStops.isEmpty()) {
                        trip.setScheduledDepartureTime(scheduleStops.get(0).getDepartureTime());
                        trip.setScheduledArrivalTime(scheduleStops.get(scheduleStops.size() - 1).getArrivalTime());
                    }
                }
                
                trip.setStatus(TripStatusEnum.pending);
                trip.setCreatedBy(userId);
                trip.setUpdatedBy(userId);
                
                generatedTrips.add(trip);
            }
            currentDate = currentDate.plusDays(1);
        }
        
        List<Trip> savedTrips = tripRepository.saveAll(generatedTrips);
        return savedTrips.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
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

    private PassengerServicePermitScheduleAssignment validateAndGetAssignment(UUID assignmentId) {
        return assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));
    }

    private Bus validateAndGetBus(UUID busId) {
        return busRepository.findById(busId)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + busId));
    }

    private Trip mapToTrip(TripRequest request, String userId, PassengerServicePermitScheduleAssignment assignment, Bus bus) {
        Trip trip = new Trip();
        trip.setAssignment(assignment);
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

    private void updateTripFromRequest(Trip trip, TripRequest request, PassengerServicePermitScheduleAssignment assignment, Bus bus, String userId) {
        trip.setAssignment(assignment);
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
        response.setAssignmentId(trip.getAssignment().getId());
        response.setPermitNumber(trip.getAssignment().getPassengerServicePermit().getPermitNumber());
        response.setScheduleName(trip.getAssignment().getSchedule().getName());
        response.setRouteName(trip.getAssignment().getSchedule().getRoute().getName());
        
        if (trip.getBus() != null) {
            response.setBusId(trip.getBus().getId());
            response.setBusPlateNumber(trip.getBus().getPlateNumber());
            response.setBusModel(trip.getBus().getModel());
        }
        
        return response;
    }
}