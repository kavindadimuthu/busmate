package com.busmatelk.backend.service;

import com.busmatelk.backend.config.RsaKeyMaterial;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AccessTokenVerifierTest {

    private static final String LEGACY_SECRET = "test-legacy-hs256-secret-at-least-32-bytes-long";
    private static final String KID = "test-key-1";

    private AccessTokenVerifier verifier;
    private RSAPrivateKey rsaPrivateKey;

    @BeforeEach
    void setUp() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        KeyPair keyPair = generator.generateKeyPair();
        rsaPrivateKey = (RSAPrivateKey) keyPair.getPrivate();

        RsaKeyMaterial keyMaterial = new RsaKeyMaterial(rsaPrivateKey, (RSAPublicKey) keyPair.getPublic(), KID);
        verifier = new AccessTokenVerifier(keyMaterial, LEGACY_SECRET);
    }

    @Test
    void verifiesAnRs256Token() {
        String token = Jwts.builder()
                .setSubject("user-1")
                .setHeaderParam("kid", KID)
                .setExpiration(Date.from(Instant.now().plusSeconds(60)))
                .signWith(rsaPrivateKey, SignatureAlgorithm.RS256)
                .compact();

        Claims claims = verifier.verify(token);

        assertThat(claims.getSubject()).isEqualTo("user-1");
    }

    @Test
    void stillAcceptsALegacyHs256Token() {
        Key legacyKey = Keys.hmacShaKeyFor(LEGACY_SECRET.getBytes(StandardCharsets.UTF_8));
        String token = Jwts.builder()
                .setSubject("user-2")
                .setExpiration(Date.from(Instant.now().plusSeconds(60)))
                .signWith(legacyKey, SignatureAlgorithm.HS256)
                .compact();

        Claims claims = verifier.verify(token);

        assertThat(claims.getSubject()).isEqualTo("user-2");
    }

    @Test
    void rejectsAnHs256TokenSignedWithTheWrongSecret() {
        Key wrongKey = Keys.hmacShaKeyFor("a-completely-different-secret-value-1234567890".getBytes(StandardCharsets.UTF_8));
        String token = Jwts.builder()
                .setSubject("user-3")
                .setExpiration(Date.from(Instant.now().plusSeconds(60)))
                .signWith(wrongKey, SignatureAlgorithm.HS256)
                .compact();

        assertThatThrownBy(() -> verifier.verify(token)).isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void rejectsAnExpiredRs256Token() {
        String token = Jwts.builder()
                .setSubject("user-4")
                .setHeaderParam("kid", KID)
                .setExpiration(Date.from(Instant.now().minusSeconds(60)))
                .signWith(rsaPrivateKey, SignatureAlgorithm.RS256)
                .compact();

        assertThatThrownBy(() -> verifier.verify(token)).isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void rejectsGarbage() {
        assertThatThrownBy(() -> verifier.verify("not-a-jwt")).isInstanceOf(InvalidTokenException.class);
    }
}
