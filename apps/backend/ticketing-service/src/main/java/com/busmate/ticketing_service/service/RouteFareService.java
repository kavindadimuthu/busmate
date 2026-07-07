package com.busmate.ticketing_service.service;


import com.busmate.ticketing_service.dto.RouteFareDTO;
import com.busmate.ticketing_service.dto.request.FareCalculationRequestDTO;

public interface RouteFareService {

    boolean saveRouteFare(RouteFareDTO routeFareDTO);
    String calculateFare(FareCalculationRequestDTO requestDTO);
}
