package com.busmate.ticketing_service.payment;

import com.busmate.ticketing_service.entity.Online;
import com.busmate.ticketing_service.payhere.PayHereCheckoutProperties;
import com.busmate.ticketing_service.payhere.PayHereHashService;
import com.busmate.ticketing_service.payhere.PayHereProperties;
import com.busmate.ticketing_service.repository.OnlineRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * INC-013: PayHerePaymentGateway builds a real checkout form and reads real webhook state,
 * without needing live PayHere credentials to verify either.
 */
@ExtendWith(MockitoExtension.class)
class PayHerePaymentGatewayTest {

    @Mock
    private OnlineRepo onlineRepo;

    private PayHerePaymentGateway gateway;

    @BeforeEach
    void setUp() {
        PayHereProperties properties = new PayHereProperties();
        properties.setMerchantId("test-merchant-id");
        properties.setMerchantSecret("test-merchant-secret");
        properties.setSandbox(true);

        PayHereCheckoutProperties checkoutProperties = new PayHereCheckoutProperties();
        checkoutProperties.setUrl("https://sandbox.payhere.lk/pay/checkout");
        checkoutProperties.setAppBaseUrl("http://localhost:4000");
        checkoutProperties.setGatewayBaseUrl("http://localhost:8080");

        gateway = new PayHerePaymentGateway(new PayHereHashService(properties), properties, checkoutProperties, onlineRepo);
    }

    @Test
    void initiateBuildsACheckoutFormThatVerifiesAgainstPayHereOwnFormula() {
        PaymentGateway.PaymentInitiationRequest request = new PaymentGateway.PaymentInitiationRequest(
                "TICKET-42", new BigDecimal("135.00"), "passenger-1", "BusMate ticket bus/trip");

        PaymentGateway.PaymentInitiationResult result = gateway.initiate(request);

        assertThat(result.status()).isEqualTo(PaymentGateway.PaymentStatus.PENDING);
        assertThat(result.gatewayReference()).isEqualTo("TICKET-42");
        assertThat(result.redirectUrl()).isEqualTo("https://sandbox.payhere.lk/pay/checkout");

        var fields = result.checkoutFields();
        assertThat(fields.get("merchant_id")).isEqualTo("test-merchant-id");
        assertThat(fields.get("order_id")).isEqualTo("TICKET-42");
        assertThat(fields.get("amount")).isEqualTo("135.00");
        assertThat(fields.get("currency")).isEqualTo("LKR");
        assertThat(fields.get("return_url")).isEqualTo("http://localhost:4000/booking/payhere-return?order_id=TICKET-42");
        assertThat(fields.get("cancel_url")).isEqualTo("http://localhost:4000/booking/payhere-cancel?order_id=TICKET-42");
        assertThat(fields.get("notify_url")).isEqualTo("http://localhost:8080/api/v1/payments/payhere/notify");

        // The hash PayHerePaymentGateway sends must be exactly the one a real checkout page
        // would compute and verify - reusing PayHereHashService, not a bespoke formula.
        PayHereHashService reference = new PayHereHashService(new PayHereProperties() {{
            setMerchantId("test-merchant-id");
            setMerchantSecret("test-merchant-secret");
        }});
        String expectedHash = reference.generateCheckoutHash("TICKET-42", new BigDecimal("135.00"), "LKR");
        assertThat(fields.get("hash")).isEqualTo(expectedHash);
    }

    @Test
    void confirmReadsWhateverTheWebhookHasRecorded_success() {
        Online online = new Online();
        online.setStatus(Online.Status.SUCCESS);
        when(onlineRepo.findByTransactionRef("TICKET-42")).thenReturn(Optional.of(online));

        var result = gateway.confirm("TICKET-42");

        assertThat(result.status()).isEqualTo(PaymentGateway.PaymentStatus.SUCCESS);
        assertThat(result.gatewayReference()).isEqualTo("TICKET-42");
    }

    @Test
    void confirmReadsWhateverTheWebhookHasRecorded_stillPending() {
        Online online = new Online();
        online.setStatus(Online.Status.PENDING);
        when(onlineRepo.findByTransactionRef("TICKET-42")).thenReturn(Optional.of(online));

        assertThat(gateway.confirm("TICKET-42").status()).isEqualTo(PaymentGateway.PaymentStatus.PENDING);
    }

    @Test
    void confirmTreatsNoWebhookYetAsPending_notAsSuccess() {
        when(onlineRepo.findByTransactionRef("TICKET-99")).thenReturn(Optional.empty());

        // Nothing has arrived from PayHere yet - must never be optimistically treated as paid.
        assertThat(gateway.confirm("TICKET-99").status()).isEqualTo(PaymentGateway.PaymentStatus.PENDING);
    }

    @Test
    void confirmTreatsFailedOrRefundedAsFailed() {
        Online failed = new Online();
        failed.setStatus(Online.Status.FAILED);
        when(onlineRepo.findByTransactionRef("A")).thenReturn(Optional.of(failed));
        assertThat(gateway.confirm("A").status()).isEqualTo(PaymentGateway.PaymentStatus.FAILED);

        Online refunded = new Online();
        refunded.setStatus(Online.Status.REFUNDED);
        when(onlineRepo.findByTransactionRef("B")).thenReturn(Optional.of(refunded));
        assertThat(gateway.confirm("B").status()).isEqualTo(PaymentGateway.PaymentStatus.FAILED);
    }
}
