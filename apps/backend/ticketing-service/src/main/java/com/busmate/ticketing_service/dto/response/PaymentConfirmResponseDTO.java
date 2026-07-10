package com.busmate.ticketing_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PaymentConfirmResponseDTO {
    private Long ticketId;
    /** PENDING | SUCCESS | FAILED */
    private String paymentStatus;
    /** Whether the ticket is now fully booked/paid (true when paymentStatus == SUCCESS). */
    private boolean confirmed;
}
