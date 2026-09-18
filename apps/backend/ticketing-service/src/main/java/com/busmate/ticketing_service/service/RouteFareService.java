package com.busmate.ticketing_service.service;


import com.busmate.ticketing_service.dto.RouteFareDTO;
import com.busmate.ticketing_service.dto.request.FareCalculationRequestDTO;

public interface RouteFareService {

    boolean saveRouteFare(RouteFareDTO routeFareDTO);
    String calculateFare(FareCalculationRequestDTO requestDTO);

    /**
     * The price of one journey, as a number (INC-011). Throws rather than returning an explanation
     * in place of a figure, so a booking is either priced or refused - never priced from prose.
     */
    java.math.BigDecimal priceJourney(String routeId, double boardingDistanceKm,
            double alightingDistanceKm, com.busmate.ticketing_service.fare.ServiceClass serviceClass);
}
