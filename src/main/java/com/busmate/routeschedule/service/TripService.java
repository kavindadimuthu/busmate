package com.busmate.routeschedule.service;

import com.busmate.routeschedule.dto.request.BulkPspAssignmentRequest;
import com.busmate.routeschedule.dto.request.TripRequest;
import com.busmate.routeschedule.dto.response.BulkPspAssignmentResponse;
import com.busmate.routeschedule.dto.response.TripFilterOptionsResponse;
import com.busmate.routeschedule.dto.response.TripResponse;
import com.busmate.routeschedule.dto.response.TripStatisticsResponse;
import com.busmate.routeschedule.enums.TripStatusEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface TripService {
    TripResponse createTrip(TripRequest request, String userId);
    TripResponse getTripById(UUID id);
    List<TripResponse> getAllTrips();
    
    // Enhanced getAllTrips with filtering, pagination, and search
    Page<TripResponse> getAllTripsWithFilters(
            Pageable pageable, 
            String search, 
            TripStatusEnum status,
            UUID routeId,
            UUID operatorId,
            UUID scheduleId,
            UUID passengerServicePermitId,
            UUID busId,
            LocalDate fromDate,
            LocalDate toDate,
            Boolean hasPsp,
            Boolean hasBus,
            Boolean hasDriver,
            Boolean hasConductor
    );
    
    List<TripResponse> getTripsByPassengerServicePermit(UUID passengerServicePermitId);
    List<TripResponse> getTripsBySchedule(UUID scheduleId);
    List<TripResponse> getTripsByRoute(UUID routeId);
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
    List<TripResponse> generateTripsForSchedule(UUID scheduleId, LocalDate fromDate, LocalDate toDate, String userId);
    
    // PSP Assignment methods
    TripResponse assignPassengerServicePermitToTrip(UUID tripId, UUID passengerServicePermitId, String userId);
    List<TripResponse> bulkAssignPassengerServicePermitToTrips(List<UUID> tripIds, UUID passengerServicePermitId, String userId);
    TripResponse removePassengerServicePermitFromTrip(UUID tripId, String userId);
    
    // Bulk PSP Assignment (many-to-many)
    BulkPspAssignmentResponse bulkAssignPspsToTrips(BulkPspAssignmentRequest request, String userId);
    
    // Statistics and Filter Options
    TripStatisticsResponse getStatistics();
    TripFilterOptionsResponse getFilterOptions();
}