package com.busmate.ticketing_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TripSummaryDTO {
    private String tripId;
    private int totalTickets;
    private BigDecimal totalFareAmount;
    private int validTickets;
    private int invalidTickets;
    private BigDecimal averageFarePerTicket;
}
