package com.busmate.ticketing_service.payhere;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Bound from application.yml's `payhere.*`, which itself reads config/secrets/.env's
 * TICKETING_PAYHERE_* keys (INC-008). merchantSecret must never leave this service - it is used
 * only to compute/verify hashes server-side and is never sent to conductor-mobile.
 */
@Component
@ConfigurationProperties(prefix = "payhere")
public class PayHereProperties {

    private String merchantId;
    private String merchantSecret;
    private boolean sandbox = true;

    public String getMerchantId() {
        return merchantId;
    }

    public void setMerchantId(String merchantId) {
        this.merchantId = merchantId;
    }

    public String getMerchantSecret() {
        return merchantSecret;
    }

    public void setMerchantSecret(String merchantSecret) {
        this.merchantSecret = merchantSecret;
    }

    public boolean isSandbox() {
        return sandbox;
    }

    public void setSandbox(boolean sandbox) {
        this.sandbox = sandbox;
    }
}
