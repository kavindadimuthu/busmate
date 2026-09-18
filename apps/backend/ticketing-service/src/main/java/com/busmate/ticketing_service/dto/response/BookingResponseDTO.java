package com.busmate.ticketing_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BookingResponseDTO {
    /** The first booked ticket. Kept so single-seat clients need no change; see ticketIds. */
    private Long ticketId;
    /** One ticket per seat booked, in the order the seats were requested. */
    private List<Long> ticketIds;
    /** Opaque payment-gateway reference the client passes back to the confirm step. */
    private String paymentReference;
    /** PENDING | SUCCESS | FAILED, mirrors PaymentGateway.PaymentStatus. */
    private String paymentStatus;
    /**
     * Null in dummy-gateway mode. Once PayHere is enabled (INC-013, ADR-014), the checkout
     * page's POST target - submit checkoutFields to this URL as a form, don't navigate to it as
     * a link.
     */
    private String redirectUrl;
    /** Null unless redirectUrl is set. Hidden form fields to POST to redirectUrl. */
    private Map<String, String> checkoutFields;
    /** What one seat costs on this journey — server-computed, never what the client asked for. */
    private BigDecimal farePerSeat;
    /** The total being charged: farePerSeat × seats. */
    private BigDecimal fareAmount;
}
