package com.busmate.ticketing_service.dto.request;

import lombok.Data;

import java.math.BigDecimal;

/**
 * INC-008: conductor-mobile calls this before PayHere.startPayment() to get a
 * server-computed hash (merchant_secret never leaves ticketing-service).
 */
@Data
public class PayHereHashRequestDTO {
    /** Client-generated correlation id; becomes PayHere's order_id and, on success, the
     *  ticket's transactionRef - lets the notify webhook find the same record later. */
    private String orderId;
    private BigDecimal amount;
}
