package com.busmatelk.telemetry.device.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Device ingest-token generation and hashing.
 *
 * <p>Tokens are 256-bit random values with a recognizable prefix ({@code bmt_}, "BusMate
 * telemetry") so leaked tokens are identifiable in logs/scanners. Only the SHA-256 hash is stored.
 * A plain (unsalted) SHA-256 is the right tool here — unlike passwords, these tokens are
 * high-entropy random strings, so rainbow/dictionary attacks don't apply, and a deterministic hash
 * is what lets the ingest path (Phase 2) look a presented token up by index instead of scanning
 * bcrypt rows.
 */
public final class DeviceTokens {

    private static final SecureRandom RANDOM = new SecureRandom();

    private DeviceTokens() {
    }

    public static String generate() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return "bmt_" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static String hash(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
