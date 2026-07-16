package com.busmatelk.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

/**
 * Loads the RSA keypair access tokens are signed with (auth migration Phase 2b — see
 * docs/plans/Self-Hosted-Auth-Migration-Plan.md). Falls back to generating an ephemeral,
 * in-memory keypair when none is configured, purely so a fresh local checkout works with zero
 * setup.
 *
 * <p><b>Production/multi-instance warning:</b> {@code auth.jwt.rsa.private-key} and
 * {@code .public-key} MUST be set via env vars in any environment running more than one
 * user-service instance. An instance that falls back to the ephemeral generator mints tokens
 * that no *other* instance — and no client relying on whichever instance happens to answer its
 * {@code GET /public/jwks.json} request — can verify.
 */
@Configuration
public class JwtKeyConfig {

    private static final Logger log = LoggerFactory.getLogger(JwtKeyConfig.class);

    @Bean
    public RsaKeyMaterial jwtRsaKeyMaterial(
            @Value("${auth.jwt.rsa.private-key:}") String privateKeyPem,
            @Value("${auth.jwt.rsa.public-key:}") String publicKeyPem,
            @Value("${auth.jwt.rsa.kid:busmate-user-service-key-1}") String kid) {

        boolean hasPrivate = !privateKeyPem.isBlank();
        boolean hasPublic = !publicKeyPem.isBlank();

        if (hasPrivate != hasPublic) {
            throw new IllegalStateException(
                    "auth.jwt.rsa.private-key and auth.jwt.rsa.public-key must both be set, or both left unset");
        }

        if (hasPrivate) {
            return new RsaKeyMaterial(parsePrivateKey(privateKeyPem), parsePublicKey(publicKeyPem), kid);
        }

        log.warn("auth.jwt.rsa.private-key/public-key are not set - generating an EPHEMERAL RSA keypair "
                + "for this process only. This is fine for a single local-dev instance; every other "
                + "environment (and any multi-instance deployment) MUST set real keys via env vars, or "
                + "tokens issued here won't verify anywhere else. See config/secrets/.env.example.");
        KeyPair keyPair = generateEphemeralKeyPair();
        return new RsaKeyMaterial((RSAPrivateKey) keyPair.getPrivate(), (RSAPublicKey) keyPair.getPublic(), kid);
    }

    private static KeyPair generateEphemeralKeyPair() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            return generator.generateKeyPair();
        } catch (NoSuchAlgorithmException e) {
            // RSA is a mandatory JCA algorithm on every JVM — unreachable.
            throw new IllegalStateException("RSA not available on this JVM", e);
        }
    }

    private static RSAPrivateKey parsePrivateKey(String pem) {
        try {
            KeyFactory factory = KeyFactory.getInstance("RSA");
            return (RSAPrivateKey) factory.generatePrivate(new PKCS8EncodedKeySpec(decodePem(pem)));
        } catch (NoSuchAlgorithmException | InvalidKeySpecException e) {
            throw new IllegalStateException("Invalid auth.jwt.rsa.private-key (expected a PKCS8 PEM)", e);
        }
    }

    private static RSAPublicKey parsePublicKey(String pem) {
        try {
            KeyFactory factory = KeyFactory.getInstance("RSA");
            return (RSAPublicKey) factory.generatePublic(new X509EncodedKeySpec(decodePem(pem)));
        } catch (NoSuchAlgorithmException | InvalidKeySpecException e) {
            throw new IllegalStateException("Invalid auth.jwt.rsa.public-key (expected an X.509 PEM)", e);
        }
    }

    /**
     * Strips PEM armor and whitespace before base64-decoding the body. Accepts the header/footer
     * either as real newlines or as literal {@code \n} — the common way to fit a multi-line PEM
     * into a single-line env var.
     */
    private static byte[] decodePem(String pem) {
        String base64 = pem
                .replace("\\n", "\n")
                .replaceAll("-----BEGIN [^-]+-----", "")
                .replaceAll("-----END [^-]+-----", "")
                .replaceAll("\\s", "");
        return Base64.getDecoder().decode(base64);
    }
}
