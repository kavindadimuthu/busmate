package com.busmatelk.backend.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Generates opaque, single-use bearer tokens (refresh tokens, one-time email tokens) and hashes
 * them for storage. Tokens are 256-bit random values; only their SHA-256 hash is ever persisted,
 * so a database leak can't be replayed.
 */
public final class OpaqueTokenGenerator {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final Base64.Encoder URL_ENCODER = Base64.getUrlEncoder().withoutPadding();

    private OpaqueTokenGenerator() {
    }

    public static String generate() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return URL_ENCODER.encodeToString(bytes);
    }

    public static String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return URL_ENCODER.encodeToString(hashed);
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 is mandated on every JVM — unreachable.
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
