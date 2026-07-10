package com.busmate.ticketing_service.dto.request;

import lombok.Data;

import java.math.BigDecimal;

/** Passenger self-service booking request - always paid online (via {@code PaymentGateway}), unlike the conductor-issue flow which supports cash. */
@Data
public class BookingRequestDTO {
    private String passengerId;
    private String busId;
    private String tripId;
    private String startLocationId;
    private String endLocationId;
    private BigDecimal fareAmount;
    private String seatNumber;
}
