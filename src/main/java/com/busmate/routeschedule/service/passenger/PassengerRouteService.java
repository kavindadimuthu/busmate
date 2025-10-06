package com.busmate.routeschedule.service.passenger;

import com.busmate.routeschedule.dto.response.passenger.PassengerRouteResponse;
import com.busmate.routeschedule.dto.response.passenger.PassengerPaginatedResponse;
import com.busmate.routeschedule.enums.DirectionEnum;
import com.busmate.routeschedule.enums.OperatorTypeEnum;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public interface PassengerRouteService {
    
    /**
     * Search routes between locations with comprehensive filtering
     */
    PassengerPaginatedResponse<PassengerRouteResponse> searchRoutes(
            // Location-based search
            String fromCity,
            String toCity,
            UUID fromStopId,
            UUID toStopId,
            
            // Geographic search
            Double fromLat,
            Double fromLng,
            Double toLat,
            Double toLng,
            Double radius,
            
            // Service filters
            OperatorTypeEnum operatorType,
            UUID operatorId,
            DirectionEnum direction,
            
            // Time-based filters
            LocalDate departureDate,
            LocalTime earliestTime,
            LocalTime latestTime,
            
            // Service preferences
            Boolean isAccessible,
            Integer maxDuration,
            Double maxDistance,
            
            // Pagination & sorting
            Pageable pageable
    );
    
    /**
     * Get all available routes with filtering
     */
    PassengerPaginatedResponse<PassengerRouteResponse> getAllRoutes(
            String city,
            String region,
            OperatorTypeEnum operatorType,
            UUID operatorId,
            DirectionEnum direction,
            Boolean isActive,
            Double maxDistance,
            Double minDistance,
            String search,
            Pageable pageable
    );
    
    /**
     * Get comprehensive details for a specific route
     */
    PassengerRouteResponse getRouteDetails(
            UUID routeId,
            Boolean includeStops,
            Boolean includeSchedules,
            Boolean includeTrips,
            LocalDate date
    );
}