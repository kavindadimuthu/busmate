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
    // Totals describe what the trip actually carried and earned, so cancelled tickets are
    // excluded - a refunded fare is not revenue. They previously counted, overstating revenue
    // on every consumer and contradicting paymentBreakdown, which never included them.
    private int totalTickets;
    private BigDecimal totalFareAmount;
    /** Boarded (validated) tickets. */
    private int validTickets;
    /** Sold but not yet boarded. Does not include cancelled tickets. */
    private int invalidTickets;
    private BigDecimal averageFarePerTicket;
    /** Cancelled on this trip - reported separately so it stays visible without inflating totals. */
    private int cancelledTickets;
    /**
     * Revenue split by how the fare was paid — one entry per method actually used on this trip
     * (INC-009). Deliberately a list rather than named cash/digital fields so new payment
     * methods need no contract change; group by each entry's custody for the "cash the conductor
     * must hand over" vs "already settled" totals. See ADR-011.
     */
    private List<PaymentBreakdownEntryDTO> paymentBreakdown;
}
