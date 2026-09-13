package com.busmate.ticketing_service.payhere;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * PayHere's checkout hash and notify_url signature both use the same MD5-chain formula
 * (support.payhere.lk/api-&-mobile-sdk/checkout-api). merchantSecret is read server-side only
 * (PayHereProperties, from config/secrets/.env) - a hash computed in the app would expose it.
 */
@Service
@RequiredArgsConstructor
public class PayHereHashService {

    private final PayHereProperties properties;

    /** Hash the conductor's app sends alongside PayHere.startPayment(). */
    public String generateCheckoutHash(String orderId, BigDecimal amount, String currency) {
        String secretDigest = md5Upper(properties.getMerchantSecret());
        String amountStr = formatAmount(amount);
        return md5Upper(properties.getMerchantId() + orderId + amountStr + currency + secretDigest);
    }

    /**
     * True if the notify_url payload's md5sig genuinely came from PayHere. Never trust a notify
     * payload whose signature doesn't match this - it wasn't sent by PayHere.
     */
    public boolean verifyNotifySignature(String orderId, String payhereAmount, String payhereCurrency,
            String statusCode, String merchantId, String md5sig) {
        if (!properties.getMerchantId().equals(merchantId)) {
            return false;
        }
        String secretDigest = md5Upper(properties.getMerchantSecret());
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
