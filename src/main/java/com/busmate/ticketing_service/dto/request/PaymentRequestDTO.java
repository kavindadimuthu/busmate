package com.busmate.ticketing_service.dto.request;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PaymentRequestDTO {
    private String conductorId;
    private String busId;
    private String tripId;
    private String startLocationId;
    private String endLocationId;
    private BigDecimal fareAmount;
    private String paymentMethod;
    private String transactionRef;
    private String seatNumber;

}
