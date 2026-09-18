package com.busmate.ticketing_service.payhere;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * PayHere's checkout hash and notify_url signature both use the same MD5-chain formula
 * (support.payhere.lk/api-&-mobile-sdk/checkout-api). Merchant ID is account-level and shared
 * (PayHereProperties.merchantId); the Merchant Secret is assigned per registered Domain/App, so
 * a hash correct for one app/domain is not correct for another - the conductor mobile app
 * (PayHereProperties.merchantSecret, INC-008) and passenger-web's own domain
 * (PayHereCheckoutProperties.merchantSecret, INC-013) each have their own. Every secret is read
 * server-side only, from config/secrets/.env - a hash computed in a client would expose it.
 */
@Service
@RequiredArgsConstructor
public class PayHereHashService {

    private final PayHereProperties properties;
    private final PayHereCheckoutProperties checkoutProperties;

    /** Hash the conductor's app sends alongside PayHere.startPayment() (INC-008). */
    public String generateCheckoutHash(String orderId, BigDecimal amount, String currency) {
        return hash(properties.getMerchantId(), orderId, amount, currency, properties.getMerchantSecret());
    }

    /** Hash for passenger-web's own hosted-checkout domain (INC-013, ADR-014). */
    public String generatePassengerCheckoutHash(String orderId, BigDecimal amount, String currency) {
        return hash(properties.getMerchantId(), orderId, amount, currency, checkoutProperties.getMerchantSecret());
    }

    private String hash(String merchantId, String orderId, BigDecimal amount, String currency, String secret) {
        String secretDigest = md5Upper(secret);
        String amountStr = formatAmount(amount);
        return md5Upper(merchantId + orderId + amountStr + currency + secretDigest);
    }

    /**
     * True if the notify_url payload's md5sig genuinely came from PayHere. Never trust a notify
     * payload whose signature doesn't match this - it wasn't sent by PayHere. One webhook serves
     * both payment paths, so a notification might have been signed with either app/domain's
     * secret - it is accepted if it matches either, and rejected only if it matches neither.
     */
    public boolean verifyNotifySignature(String orderId, String payhereAmount, String payhereCurrency,
            String statusCode, String merchantId, String md5sig) {
        if (!properties.getMerchantId().equals(merchantId)) {
            return false;
        }
        return matchesSignature(orderId, payhereAmount, payhereCurrency, statusCode, merchantId, md5sig,
                properties.getMerchantSecret())
                || matchesSignature(orderId, payhereAmount, payhereCurrency, statusCode, merchantId, md5sig,
                checkoutProperties.getMerchantSecret());
    }

    private boolean matchesSignature(String orderId, String payhereAmount, String payhereCurrency,
            String statusCode, String merchantId, String md5sig, String secret) {
        if (secret == null || secret.isBlank()) {
            return false;
        }
        String secretDigest = md5Upper(secret);
        String expected = md5Upper(merchantId + orderId + payhereAmount + payhereCurrency + statusCode + secretDigest);
        return expected.equalsIgnoreCase(md5sig);
    }

    private static String formatAmount(BigDecimal amount) {
        return amount.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString();
    }

    private static String md5Upper(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("MD5");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString().toUpperCase();
        } catch (NoSuchAlgorithmException e) {
            // MD5 is a JDK-guaranteed algorithm; this can't actually happen.
            throw new IllegalStateException("MD5 unavailable", e);
        }
    }
}
