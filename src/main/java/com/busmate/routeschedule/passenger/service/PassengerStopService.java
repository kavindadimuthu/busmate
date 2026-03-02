package com.busmate.routeschedule.passenger.service;

import com.busmate.routeschedule.passenger.dto.response.PassengerStopResponse;
import com.busmate.routeschedule.passenger.dto.response.PassengerNearbyStopsResponse;
import com.busmate.routeschedule.passenger.dto.response.PassengerPaginatedResponse;
import com.busmate.routeschedule.passenger.dto.response.PassengerRouteResponse;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface PassengerStopService {
    
    /**
     * Find bus stops within a specified radius
     */
    PassengerNearbyStopsResponse findNearbyStops(
            Double latitude,
            Double longitude,
            Double radius,
            Boolean hasRoutes,
            Boolean isAccessible,
            Boolean hasFacilities,
            String sort,
            String order,
            Integer limit
    );
    
    /**
     * Search for stops by name, city, or location
     */
    PassengerPaginatedResponse<PassengerStopResponse> searchStops(
            String query,
            Double nearLat,
            Double nearLng,
            String city,
            Boolean hasRoutes,
            Boolean isAccessible,
            Pageable pageable
    );
    
    /**
     * Get comprehensive information about a specific stop
     */
    PassengerStopResponse getStopDetails(
            UUID stopId,
            Boolean includeRoutes,
            Boolean includeUpcoming,
            Integer upcomingLimit,
            LocalDate date
    );
    
    /**
     * Get all routes passing through a specific stop
     * Note: operatorType filtering removed - routes are not directly linked to operators
     */
    List<PassengerRouteResponse> getRoutesForStop(
            UUID stopId,
            UUID operatorId,
            String direction,
            String destination,
            Boolean activeOnly,
            Boolean includeSchedule,
            String sort
    );
}
