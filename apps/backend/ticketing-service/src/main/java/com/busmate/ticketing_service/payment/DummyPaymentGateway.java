package com.busmate.ticketing_service.payment;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Placeholder {@link PaymentGateway} used until a real provider is integrated. `initiate()`
 * always returns PENDING (no redirect URL, since there's nothing to redirect to) and `confirm()`
 * always succeeds - simulating the passenger completing payment on a real gateway's checkout
 * page. Swap this bean out for a real implementation (e.g. PayHerePaymentGateway) when ready;
 * nothing else in the codebase needs to change since callers only depend on {@link PaymentGateway}.
 */
@Slf4j
@Service
public class DummyPaymentGateway implements PaymentGateway {

    @Override
    public PaymentInitiationResult initiate(PaymentInitiationRequest request) {
        String reference = "DUMMY-" + UUID.randomUUID();
        log.info("[DummyPaymentGateway] initiated payment {} for {} (amount={})",
                reference, request.passengerId(), request.amount());
        return new PaymentInitiationResult(reference, PaymentStatus.PENDING, null);
    }

    @Override
    public PaymentConfirmationResult confirm(String gatewayReference) {
        log.info("[DummyPaymentGateway] confirming payment {}", gatewayReference);
        return new PaymentConfirmationResult(gatewayReference, PaymentStatus.SUCCESS);
    }
}
