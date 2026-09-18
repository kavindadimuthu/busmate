package com.busmate.ticketing_service.payhere;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration specific to the passenger-booking hosted-checkout path (INC-013, ADR-014) -
 * separate from {@link PayHereProperties}'s merchant credentials, which both this and the
 * conductor card-payment path (INC-008) share.
 */
@Component
@ConfigurationProperties(prefix = "payhere.checkout")
@Getter
@Setter
public class PayHereCheckoutProperties {

    /** Off until a human sets real sandbox credentials and confirms a live test (ADR-014). */
    private boolean enabled = false;

    /**
     * PayHere assigns a distinct Merchant Secret per registered Domain/App - the conductor
     * mobile app's secret (PayHereProperties) will not produce a valid hash for a checkout
     * initiated from passenger-web's own domain. Merchant ID is account-level and shared
     * (PayHereProperties.merchantId); only the secret differs here.
     */
    private String merchantSecret;

    /** PayHere's hosted checkout page - sandbox and live have different hosts. */
    private String url = "https://sandbox.payhere.lk/pay/checkout";

    /** passenger-web's own base URL, for PayHere's return_url/cancel_url. */
    private String appBaseUrl = "http://localhost:4000";

    /**
     * The publicly-reachable base URL of this backend's own api-gateway, for PayHere's
     * notify_url. Must be a tunnel (cloudflared/ngrok) or a real deployment while testing -
     * PayHere's servers cannot reach a bare localhost address (same accepted gap as ADR-010).
     */
    private String gatewayBaseUrl = "http://localhost:8080";
}
