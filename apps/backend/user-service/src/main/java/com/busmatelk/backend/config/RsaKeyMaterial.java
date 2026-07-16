package com.busmatelk.backend.config;

import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;

/**
 * The RSA keypair access tokens are signed with (Phase 2b), plus the {@code kid} that ties a
 * signed token's header back to the matching entry in {@code GET /public/jwks.json}.
 */
public record RsaKeyMaterial(RSAPrivateKey privateKey, RSAPublicKey publicKey, String kid) {
}
