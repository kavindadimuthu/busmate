package com.busmate.ticketing_service.dto;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data

public class BaseFareDTO {
    private int section;
    private double normalFare;
    private Double semiLuxuryFare;
    private Double luxuryFare;
    private Double superLuxuryFare;
    private Double expresswaySuperLuxuryFare;

}
