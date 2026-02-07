package com.busmate.routeschedule.passenger.service;

import com.busmate.routeschedule.passenger.dto.request.FindMyBusRequest;
import com.busmate.routeschedule.passenger.dto.response.FindMyBusResponse;

/**
 * Service interface for passenger query operations.
 * Provides the "Find My Bus" feature for passengers to search for bus services.
 */
public interface PassengerQueryService {
    
    /**
     * Find buses/routes between two stops.
     * 
     * Returns schedule-based results with timing information and optional trip details.
     * Results include route data, schedule timings, and trip information (bus, operator, permit)
     * when available.
     * 
     * Algorithm:
     * 1. Validate input stops exist
     * 2. Query routes with schedules between the two stops
     * 3. Validate schedules against calendar and exceptions for the search date
     * 4. Apply time preference to resolve schedule times (verified/unverified/calculated)
     * 5. Include trip information if available for the schedule
     * 6. Sort by departure time and return
     * 
     * Time Preference:
     * - VERIFIED_ONLY: Only verified times (most reliable)
     * - PREFER_UNVERIFIED: Verified > Unverified
     * - PREFER_CALCULATED/DEFAULT: Verified > Unverified > Calculated
     * 
     * @param request Search request with from/to stops, date, time, and filters
     * @return Response with matching bus services including time source indicators
     */
    FindMyBusResponse findMyBus(FindMyBusRequest request);
}
