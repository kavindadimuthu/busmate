package com.busmate.ticketing_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

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
    /** Null for the dummy gateway; populated by a real gateway that requires a redirect. */
    private String redirectUrl;
    /** What one seat costs on this journey — server-computed, never what the client asked for. */
    private BigDecimal farePerSeat;
    /** The total being charged: farePerSeat × seats. */
    private BigDecimal fareAmount;
}
