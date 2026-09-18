package com.busmate.ticketing_service.core;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * core-service's answer about one journey on one trip: what it costs to price it, and whether it
 * can still be booked (INC-011). Mirrors {@code InternalBookingContextResponse} on the other side.
 *
 * <p>Every field here used to arrive from the browser. None of them do now.
 */
public record BookingContext(
        String tripId,
        String tripStatus,
        LocalDate tripDate,
        LocalTime scheduledDepartureFromBoardingStop,
        String busId,
        Integer busCapacity,
        String busServiceClass,
        String routeId,
        Double boardingDistanceKm,
        Double alightingDistanceKm,
        Integer boardingStopOrder,
        Integer alightingStopOrder) {
}
