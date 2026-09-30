package com.busmate.ticketing_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * What booking would charge for these seats on this journey, worked out by the same code that prices a real
 * booking (INC-073). A quote, not a promise: it is computed again when seats are reserved, and the reservation's
 * own figure is what is charged.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class FareQuoteDTO {
    private String tripId;
    private int seatCount;
    private BigDecimal farePerSeat;
    private BigDecimal totalFare;
    private String currency;
}
