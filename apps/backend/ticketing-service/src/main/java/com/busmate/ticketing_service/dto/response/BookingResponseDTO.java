package com.busmate.ticketing_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BookingResponseDTO {
    private Long ticketId;
    /** Opaque payment-gateway reference the client passes back to the confirm step. */
    private String paymentReference;
    /** PENDING | SUCCESS | FAILED, mirrors PaymentGateway.PaymentStatus. */
    private String paymentStatus;
    /** Null for the dummy gateway; populated by a real gateway that requires a redirect. */
    private String redirectUrl;
    private BigDecimal fareAmount;
}
