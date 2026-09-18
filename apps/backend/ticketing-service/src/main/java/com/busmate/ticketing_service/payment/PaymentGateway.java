package com.busmate.ticketing_service.payment;

import java.math.BigDecimal;
import java.util.Map;

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
            /** Null for the dummy gateway. For PayHere, the hosted checkout page's POST target -
             * see {@link #checkoutFields}, which must be submitted to this URL as a form
             * (ADR-014). Not a simple link to redirect the browser to. */
            String redirectUrl,
            /** Null unless {@link #redirectUrl} is set. The full set of hidden form fields
             * (including the pre-computed hash) a client must POST to {@link #redirectUrl} to
             * reach the gateway's own checkout page. */
            Map<String, String> checkoutFields) {
    }

    record PaymentConfirmationResult(
            String gatewayReference,
            PaymentStatus status) {
    }

    enum PaymentStatus { PENDING, SUCCESS, FAILED }
}
