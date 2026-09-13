package com.busmate.ticketing_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Everything conductor-mobile needs to call PayHere.startPayment() - the app never holds
 * merchant_secret and doesn't need its own copy of merchant_id (INC-008).
 */
@Data
@AllArgsConstructor
public class PayHereHashResponseDTO {
    private String merchantId;
    private String orderId;
    private BigDecimal amount;
    private String currency;
    private String hash;
    private boolean sandbox;
}
