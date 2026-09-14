package com.busmate.ticketing_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * One sale stage's share of a trip (INC-010, ADR-012) — on the bus vs pre-booked. Cancelled
 * tickets are excluded; the trip summary reports them separately.
 *
 * boardedCount matters mainly for PRE_BOOKED: those passengers may not have boarded yet, and
 * "pre-booked, still awaiting boarding" is the number a conductor works from. An ON_BUS ticket is
 * boarded when it is sold.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class SaleStageBreakdownEntryDTO {
    /** ON_BUS | PRE_BOOKED | UNKNOWN. Clients must tolerate stages they don't recognise. */
    private String stage;
    private int ticketCount;
    private int boardedCount;
    private BigDecimal amount;
}
