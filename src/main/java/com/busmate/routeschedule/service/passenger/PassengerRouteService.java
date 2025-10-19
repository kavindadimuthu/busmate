package com.busmate.routeschedule.service.passenger;

import com.busmate.routeschedule.dto.response.passenger.PassengerRouteResponse;
import com.busmate.routeschedule.dto.response.passenger.PassengerPaginatedResponse;
import com.busmate.routeschedule.enums.DirectionEnum;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.util.UUID;

public interface PassengerRouteService {
    
    /**
     * Search routes between locations with basic filtering
     */
    PassengerPaginatedResponse<PassengerRouteResponse> searchRoutes(
            String fromCity,
            String toCity,
            UUID fromStopId,
            UUID toStopId,
            DirectionEnum direction,
            Double maxDistance,
            String searchText,
            Pageable pageable
    );
    
    /**
     * Get all available routes with filtering
     */
    PassengerPaginatedResponse<PassengerRouteResponse> getAllRoutes(
            String city,
            String region,
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