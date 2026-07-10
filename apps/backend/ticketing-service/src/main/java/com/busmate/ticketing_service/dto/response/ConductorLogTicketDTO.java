package com.busmate.ticketing_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ConductorLogTicketDTO {
    private Long ticketId;
    // Needed by admin (operator/MOT) listing views, which have no other way to know which
    // bus/trip/conductor a ticket belongs to - previously only ever set via path params on the
    // request, never echoed back on the DTO itself.
    private String busId;
    private String tripId;
    private String conductorId;
    private String passengerId;
    private String startLocationId;
    private String endLocationId;
    private String seatNumber;
    private int passengerCount;
    private double fareAmount;
    // Kept for backward compatibility (was overloaded to carry different things by different
    // methods); the explicit fields below are authoritative.
    private String paymentStatus;
    // CONDUCTOR (cash, issued on the bus) vs ONLINE (passenger-booked online).
    private String issueMethod;
    // VALID (validated / boarded) | NOT_VALID (not yet boarded) | CANCELLED.
    private String validationStatus;
    // Transaction-level payment status (PENDING/COMPLETED/FAILED/REFUNDED/ISSUED), distinct
    // from validationStatus which is about boarding, not payment.
    private String transactionStatus;
    // Human-friendly derived summary for UIs that don't want to reconstruct the state machine:
    // CANCELLED | PENDING_PAYMENT | PAYMENT_FAILED | BOARDED | CONFIRMED.
    private String bookingStatus;
    private LocalDateTime issuedAt;
}
