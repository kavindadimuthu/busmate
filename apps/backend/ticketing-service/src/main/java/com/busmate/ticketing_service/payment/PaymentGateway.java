package com.busmate.ticketing_service.payment;

import java.math.BigDecimal;

/**
 * Provider-agnostic online payment gateway contract. A real integration (PayHere, Stripe, etc.)
 * implements this interface and becomes a drop-in replacement for {@link DummyPaymentGateway} -
 * no caller (booking flow, controller, frontend contract) needs to change.
 *
 * Two-step shape mirrors how a real redirect/webhook-based gateway actually works:
 * {@link #initiate} starts the payment (for a real gateway this is where you'd get a redirect
 * URL to send the passenger to), and {@link #confirm} finalizes it once the passenger has
 * completed payment (for a real gateway this is normally driven by a webhook callback, but is
 * exposed here as a callable step so a client-driven "confirm" also works).
 */
public interface PaymentGateway {

    PaymentInitiationResult initiate(PaymentInitiationRequest request);

    PaymentConfirmationResult confirm(String gatewayReference);

    record PaymentInitiationRequest(
            String transactionRef,
            BigDecimal amount,
            String passengerId,
            String description) {
    }

    record PaymentInitiationResult(
            String gatewayReference,
            PaymentStatus status,
            /** Null for the dummy gateway; a real gateway would return a checkout URL here. */
            String redirectUrl) {
    }

    record PaymentConfirmationResult(
            String gatewayReference,
            PaymentStatus status) {
    }

    enum PaymentStatus { PENDING, SUCCESS, FAILED }
}
