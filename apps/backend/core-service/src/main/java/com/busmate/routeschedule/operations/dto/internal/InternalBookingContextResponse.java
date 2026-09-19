package com.busmate.routeschedule.operations.dto.internal;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Everything ticketing-service needs to price and authorise a passenger booking for one journey
 * on one trip (INC-011), and deliberately nothing else.
 *
 * It exists because pricing used to be assembled by the client: the browser sent the route, the
 * two stop distances and a guessed bus type, then told ticketing-service what the fare was. Those
 * are all core-service's facts, so core-service answers them — ticketing-service reads its own
 * fare tables against this and reaches its own figure.
 *
 * Distances are the resolved ones (verified, else unverified, else calculated), matching how the
 * passenger query surfaces them, so a fare never silently disagrees with the journey a passenger
 * was shown.
 */
public record InternalBookingContextResponse(
        UUID tripId,
        String tripStatus,
        LocalDate tripDate,
        /** Departure from the passenger's boarding stop, not from the start of the route. */
        LocalTime scheduledDepartureFromBoardingStop,
        UUID busId,
        Integer busCapacity,
        String busServiceClass,
        UUID routeId,
        Double boardingDistanceKm,
        Double alightingDistanceKm,
        Integer boardingStopOrder,
        Integer alightingStopOrder,
        /** Who owns the bus on this trip, if one is assigned yet (INC-021: stamps every ticket sold). */
        UUID operatorId) {
}
