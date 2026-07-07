package com.busmate.ticketing_service.dto;


import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class RouteFareDTO {
    private String routeId;
    private int sectionId;
    private String sectionName;
    private double distanceFromStart;

}
