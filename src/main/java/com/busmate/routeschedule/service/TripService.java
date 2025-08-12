package com.busmate.routeschedule.service;

import com.busmate.routeschedule.dto.request.TripRequest;
import com.busmate.routeschedule.dto.response.TripResponse;
import com.busmate.routeschedule.enums.TripStatusEnum;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface TripService {
    TripResponse createTrip(TripRequest request, String userId);
    TripResponse getTripById(UUID id);
    List<TripResponse> getAllTrips();
    List<TripResponse> getTripsByAssignment(UUID assignmentId);
    List<TripResponse> getTripsByDate(LocalDate tripDate);
    List<TripResponse> getTripsByDateRange(LocalDate startDate, LocalDate endDate);
    List<TripResponse> getTripsByStatus(TripStatusEnum status);
    List<TripResponse> getTripsByBus(UUID busId);
    List<TripResponse> getTripsByDriver(UUID driverId);
    List<TripResponse> getTripsByConductor(UUID conductorId);
    TripResponse updateTrip(UUID id, TripRequest request, String userId);
    TripResponse updateTripStatus(UUID id, TripStatusEnum status, String userId);
    TripResponse startTrip(UUID id, String userId);
    TripResponse completeTrip(UUID id, String userId);
    TripResponse cancelTrip(UUID id, String cancellationReason, String userId);
    void deleteTrip(UUID id);
    List<TripResponse> generateTripsForAssignment(UUID assignmentId, LocalDate fromDate, LocalDate toDate, String userId);
}