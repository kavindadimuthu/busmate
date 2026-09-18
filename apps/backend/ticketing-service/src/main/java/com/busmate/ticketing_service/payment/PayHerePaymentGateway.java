package com.busmate.ticketing_service.payment;

import com.busmate.ticketing_service.entity.Online;
import com.busmate.ticketing_service.payhere.PayHereCheckoutProperties;
import com.busmate.ticketing_service.payhere.PayHereHashService;
import com.busmate.ticketing_service.payhere.PayHereProperties;
import com.busmate.ticketing_service.repository.OnlineRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * PayHere's hosted checkout page as the {@link PaymentGateway} for passenger self-booking
 * (INC-013, ADR-014). Off by default ({@code payhere.checkout.enabled: false}) - the active bean
 * only once a human sets real sandbox credentials and confirms a live test; until then
 * {@link DummyPaymentGateway} stays active.
 *
 * <p>Reuses {@link PayHereHashService} and {@link PayHereProperties} from INC-008's
 * conductor-card-payment path - the checkout hash formula and merchant credentials are the same
 * regardless of who is paying. The {@code notify_url} webhook ({@code applyPayHereNotification})
 * is untouched: it already looks up whichever {@link Online} row matches the order's
 * {@code transactionRef}, and a passenger booking's row is created the same way a conductor
 * card payment's is.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "payhere.checkout", name = "enabled", havingValue = "true")
public class PayHerePaymentGateway implements PaymentGateway {

    private static final String CURRENCY = "LKR";

    private final PayHereHashService hashService;
    private final PayHereProperties properties;
    private final PayHereCheckoutProperties checkoutProperties;
    private final OnlineRepo onlineRepo;

    @Override
    public PaymentInitiationResult initiate(PaymentInitiationRequest request) {
        String orderId = request.transactionRef();
        String hash = hashService.generatePassengerCheckoutHash(orderId, request.amount(), CURRENCY);

        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("merchant_id", properties.getMerchantId());
        fields.put("return_url", checkoutProperties.getAppBaseUrl() + "/booking/payhere-return?order_id=" + orderId);
        fields.put("cancel_url", checkoutProperties.getAppBaseUrl() + "/booking/payhere-cancel?order_id=" + orderId);
        // The gateway route registered ahead of the authenticated /hash prefix (INC-008) already
        // carries this unauthenticated, verified instead by its own md5sig - shared by both
        // payment paths, since the money-reconciliation contract doesn't depend on who paid.
        // gatewayBaseUrl must be publicly reachable (a tunnel, or a real deployment) for PayHere
        // to actually call this - see PayHereCheckoutProperties.
        fields.put("notify_url", checkoutProperties.getGatewayBaseUrl() + "/api/v1/payments/payhere/notify");
        fields.put("order_id", orderId);
        fields.put("items", request.description());
        fields.put("currency", CURRENCY);
        fields.put("amount", request.amount().setScale(2, java.math.RoundingMode.HALF_UP).toPlainString());
        // PayHere requires customer contact fields for a hosted checkout, unlike the conductor's
        // in-app SDK flow. Real values aren't collected from the passenger by this increment's
        // UI (out of scope - see INC-013); these are the same kind of honest placeholder INC-008
        // used for the conductor path's walk-up passenger, revisited if PayHere's fraud rules
        // ever reject a real transaction over them.
        fields.put("first_name", "BusMate");
        fields.put("last_name", "Passenger");
        fields.put("email", "passenger@busmate.test");
        fields.put("phone", "0771234567");
        fields.put("address", "Colombo");
        fields.put("city", "Colombo");
        fields.put("country", "Sri Lanka");
        fields.put("hash", hash);

        log.info("[PayHerePaymentGateway] initiated checkout {} for {} (amount={})",
                orderId, request.passengerId(), request.amount());

        return new PaymentInitiationResult(orderId, PaymentStatus.PENDING, checkoutProperties.getUrl(), fields);
    }

    /**
     * Not a call to PayHere - there is nothing to confirm. PayHere's own checkout page is where
     * payment happens; only the {@code notify_url} webhook is authoritative about its outcome.
     * This reads whatever that webhook has already recorded against the same order, or PENDING
     * if nothing has arrived yet.
     */
    @Override
    public PaymentConfirmationResult confirm(String gatewayReference) {
        PaymentStatus status = onlineRepo.findByTransactionRef(gatewayReference)
                .map(this::toPaymentStatus)
                .orElse(PaymentStatus.PENDING);
        return new PaymentConfirmationResult(gatewayReference, status);
    }

    private PaymentStatus toPaymentStatus(Online online) {
        return switch (online.getStatus()) {
            case SUCCESS -> PaymentStatus.SUCCESS;
            case FAILED, REFUNDED -> PaymentStatus.FAILED;
            case PENDING -> PaymentStatus.PENDING;
        };
    }
}
