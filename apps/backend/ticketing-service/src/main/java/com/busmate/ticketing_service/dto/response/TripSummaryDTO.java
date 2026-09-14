package com.busmate.ticketing_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

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
    /**
     * Revenue split by how the fare was paid — one entry per method actually used on this trip
     * (INC-009). Deliberately a list rather than named cash/digital fields so new payment
     * methods need no contract change; group by each entry's custody for the "cash the conductor
     * must hand over" vs "already settled" totals. See ADR-011.
     */
    private List<PaymentBreakdownEntryDTO> paymentBreakdown;
}
