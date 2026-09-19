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
    private String operatorId;
    private String passengerId;
    private String startLocationId;
    private String endLocationId;
    private String seatNumber;
    private int passengerCount;
    private double fareAmount;
    // Kept for backward compatibility (was overloaded to carry different things by different
    // methods); the explicit fields below are authoritative.
    private String paymentStatus;
    // CONDUCTOR (issued on the bus) vs ONLINE (passenger-booked online). Says WHO issued the
    // ticket, never HOW it was paid for - a conductor-issued ticket can be CASH or CARD since
    // INC-008. Use paymentMethod for that.
    private String issueMethod;
    // How the fare was actually paid: CASH | CARD (conductor-collected via PayHere's in-app
    // SDK) | PAYHERE (passenger's own online booking). Open-ended - clients must tolerate codes
    // they don't recognise. Null only for pre-INC-008 rows whose transaction has neither a cash
    // nor an online sub-record.
    private String paymentMethod;
    // Who holds this fare's money: ON_HAND (conductor must hand it over) | SETTLED (reached the
    // operator's account) | UNKNOWN. Sent per ticket so clients group revenue without keeping
    // their own copy of the method-to-custody mapping, which would drift the moment a payment
    // method is added (INC-009, ADR-011).
    private String custody;
    // Who sold the ticket: CONDUCTOR | ONLINE today, open-ended (counter, agent later). Same codes
    // as issueMethod, kept as its own field so clients read "channel" without knowing that.
    private String saleChannel;
    // When it was sold relative to boarding: ON_BUS | PRE_BOOKED | UNKNOWN. Classified here so
    // clients never map channels to stages themselves (INC-010, ADR-012).
    private String saleStage;
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
