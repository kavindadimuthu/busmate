package com.busmate.routeschedule.service.passenger;

import com.busmate.routeschedule.dto.request.FindMyBusRequest;
import com.busmate.routeschedule.dto.response.passenger.FindMyBusResponse;

/**
 * Service interface for passenger query operations.
 * Provides APIs for passengers to find buses and routes.
 */
public interface PassengerQueryService {
    
    /**
     * Find buses/routes between two stops.
     * 
     * Algorithm:
     * 1. Validate input and identify possible routes
     * 2. Fetch schedules for candidate routes
     * 3. Look for trips (dynamic data)
     * 4. Fallback to static route info if needed
     * 5. Sort and return results
     * 
     * @param request The search request containing from/to stops and filters
     * @return Response containing matching buses/routes with best available data
     */
    FindMyBusResponse findMyBus(FindMyBusRequest request);
}
