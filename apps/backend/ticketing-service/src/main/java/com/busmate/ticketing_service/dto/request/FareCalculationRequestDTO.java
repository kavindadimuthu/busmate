package com.busmate.ticketing_service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class FareCalculationRequestDTO {
    private String busType;
    private String routeId;
    private double distanceFromStartToBoardingPoint;
    private double distanceFromStartToAlightingPoint;
}