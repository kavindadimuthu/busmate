package com.busmate.routeschedule.passenger.service;

import com.busmate.routeschedule.passenger.dto.response.PassengerTripResponse;
import com.busmate.routeschedule.passenger.dto.response.PassengerPaginatedResponse;
import com.busmate.routeschedule.enums.TripStatusEnum;
import com.busmate.routeschedule.enums.OperatorTypeEnum;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public interface PassengerTripService {
    
    /**
     * Find trips between stops with comprehensive filtering
     */
    PassengerPaginatedResponse<PassengerTripResponse> searchTrips(
            // Route definition
            UUID fromStopId,
            UUID toStopId,
            String fromCity,
            String toCity,
            UUID routeId,
            
            // Time filters
            LocalDate date,
            LocalTime timeAfter,
            LocalTime timeBefore,
            
            // Service filters
            OperatorTypeEnum operatorType,
            UUID operatorId,
            TripStatusEnum status,
            
            // Bus preferences
            Boolean isAccessible,
            Boolean hasAirConditioning,
            Integer minCapacity,
            
            // Pagination & sorting
            Pageable pageable
    );
    
    /**
     * Get comprehensive information about a specific trip
     */
    PassengerTripResponse getTripDetails(
            UUID tripId,
            Boolean includeRoute,
            Boolean includeStops,
            Boolean includeBus,
            Boolean includeTracking
    );
    
    /**
     * Get real-time status and location of a trip
     */
    PassengerTripResponse getTripStatus(UUID tripId);
    
    /**
     * Get currently running trips with optional filtering
     */
    PassengerPaginatedResponse<PassengerTripResponse> getActiveTrips(
            UUID routeId,
            String fromCity,
            String toCity,
            Double nearLat,
            Double nearLng,
            Double radius,
            OperatorTypeEnum operatorType,
            UUID operatorId,
            LocalTime departedAfter,
            LocalTime arrivingBefore,
            Pageable pageable
    );
}
