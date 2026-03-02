package com.busmate.routeschedule.operations.service;

import com.busmate.routeschedule.operations.dto.request.FindMyBusDetailsRequest;
import com.busmate.routeschedule.operations.dto.request.FindMyBusRequest;
import com.busmate.routeschedule.operations.dto.response.FindMyBusDetailsResponse;
import com.busmate.routeschedule.operations.dto.response.FindMyBusResponse;
import com.busmate.routeschedule.operations.dto.response.PassengerPaginatedResponse;
import com.busmate.routeschedule.operations.dto.response.PassengerStopResponse;

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
    
    /**
     * Get comprehensive details for a specific schedule/trip between two stops.
     * 
     * This API provides detailed information when a passenger selects a specific
     * schedule from the Find My Bus results. It includes:
     * - Complete route information
     * - Full schedule details with ALL stops (not just origin/destination)
     * - All three time types (verified, unverified, calculated) for each stop
     * - Schedule calendar information (which days it operates)
     * - Schedule exceptions (cancelled/added days)
     * - Trip details if tripId provided (bus, operator, PSP, real-time data)
     * 
     * This is the "drill-down" API after Find My Bus - providing everything
     * needed for the passenger to understand the full journey.
     * 
     * @param request Request with scheduleId (required), tripId (optional), from/to stops
     * @return Comprehensive schedule/trip details with all timing information
     */
    FindMyBusDetailsResponse findMyBusDetails(FindMyBusDetailsRequest request);

    /**
     * Search bus stops by name, city, or text.
     * Used for autocomplete and stop selection in the passenger search form.
     *
     * @param name          Stop name or partial name
     * @param city          City name filter
     * @param searchText    General search text (takes priority over name)
     * @param accessibleOnly Filter to accessible stops only
     * @param page          Page number (0-based)
     * @param size          Page size
     * @return Paginated list of matching stops
     */
    PassengerPaginatedResponse<PassengerStopResponse> searchStops(
            String name, String city, String searchText, Boolean accessibleOnly,
            Integer page, Integer size);
}
