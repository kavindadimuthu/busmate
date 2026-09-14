package com.busmate.ticketing_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * One payment method's share of a trip's revenue (INC-009). Callers receive a list of these
 * rather than named cash/digital fields, so a payment method added later appears on every
 * revenue surface without a contract or UI change — see ADR-011.
 *
 * Carries a machine code, never a display label: BusMate is trilingual, so labels belong to the
 * client that knows the viewer's language.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PaymentBreakdownEntryDTO {
    /** e.g. CASH | CARD | PAYHERE. Clients must tolerate codes they don't recognise. */
    private String method;
    /** ON_HAND (conductor is holding it) | SETTLED (reached the operator's account) | UNKNOWN. */
    private String custody;
    private BigDecimal amount;
    private int ticketCount;
}
