package com.busmatelk.backend.controller;

import com.busmatelk.backend.config.RsaKeyMaterial;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigInteger;
import java.security.interfaces.RSAPublicKey;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Publishes the RSA public key access tokens are signed with (Phase 2b), so every verifier
 * across the platform — the API gateway, the management portal, this service's own filters —
 * can validate a token's signature without ever holding a shared secret. Mounted under
 * {@code /public/**}, which {@code SecurityConfig} already permits unauthenticated.
 */
@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
public class JwksController {

    private final RsaKeyMaterial keyMaterial;

    @GetMapping("/jwks.json")
    public Map<String, Object> jwks() {
        RSAPublicKey publicKey = keyMaterial.publicKey();
        return Map.of("keys", List.of(Map.of(
                "kty", "RSA",
                "use", "sig",
                "alg", "RS256",
                "kid", keyMaterial.kid(),
                "n", base64Url(publicKey.getModulus()),
                "e", base64Url(publicKey.getPublicExponent())
        )));
    }

    /** JWK requires unsigned, big-endian integers — strip the sign byte BigInteger prepends. */
    private static String base64Url(BigInteger value) {
        byte[] bytes = value.toByteArray();
        if (bytes.length > 1 && bytes[0] == 0) {
            bytes = Arrays.copyOfRange(bytes, 1, bytes.length);
        }
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
