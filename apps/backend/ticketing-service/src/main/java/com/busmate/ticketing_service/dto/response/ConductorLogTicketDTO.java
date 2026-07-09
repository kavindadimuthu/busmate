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
    private String passengerId;
    private String startLocationId;
    private String endLocationId;
    private String seatNumber;
    private int passengerCount;
    private double fareAmount;
    // Kept for backward compatibility (was overloaded to carry different things by different
    // methods); the two explicit fields below are authoritative for the conductor app.
    private String paymentStatus;
    // CONDUCTOR (cash, issued on the bus) vs ONLINE (passenger-booked online).
    private String issueMethod;
    // VALID (validated / boarded) vs NOT_VALID (booked but not yet validated).
    private String validationStatus;
    private LocalDateTime issuedAt;
}
