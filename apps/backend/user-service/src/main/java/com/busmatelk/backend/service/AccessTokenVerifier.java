package com.busmatelk.backend.service;

import com.busmatelk.backend.config.RsaKeyMaterial;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwsHeader;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SigningKeyResolverAdapter;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.security.interfaces.RSAPublicKey;

/**
 * Verifies access tokens for every consumer inside this service ({@code JwtAuthFilter},
 * {@code InternalService}). The verification key is resolved from the JWT header's algorithm:
 * RS256 (everything TokenService issues since Phase 2b) verifies against the RSA public key;
 * HS256 — tokens issued before the cutover deploy, still alive until they expire — verifies
 * against the legacy shared secret. Once auth.jwt.access-token-ttl-seconds has elapsed past the
 * cutover, no HS256 tokens remain in the wild and that branch (plus auth.jwt.secret) can be
 * deleted.
 */
@Component
public class AccessTokenVerifier {

    private final RSAPublicKey rsaPublicKey;
    private final Key legacyHmacKey;

    public AccessTokenVerifier(RsaKeyMaterial keyMaterial, @Value("${auth.jwt.secret}") String legacySecret) {
        this.rsaPublicKey = keyMaterial.publicKey();
        this.legacyHmacKey = Keys.hmacShaKeyFor(legacySecret.getBytes(StandardCharsets.UTF_8));
    }

    /** Throws {@link InvalidTokenException} for anything expired, tampered, or unsupported. */
    public Claims verify(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKeyResolver(new SigningKeyResolverAdapter() {
                        @Override
                        public Key resolveSigningKey(JwsHeader header, Claims claims) {
                            return keyFor(header);
                        }

                        @Override
                        public Key resolveSigningKey(JwsHeader header, String plaintext) {
                            return keyFor(header);
                        }
                    })
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (JwtException | IllegalArgumentException e) {
            throw new InvalidTokenException("Invalid or expired token");
        }
    }

    private Key keyFor(JwsHeader header) {
        String algorithm = header.getAlgorithm();
        if ("RS256".equals(algorithm)) {
            return rsaPublicKey;
        }
        if ("HS256".equals(algorithm)) {
            return legacyHmacKey;
        }
        throw new UnsupportedJwtException("Unsupported JWT algorithm: " + algorithm);
    }
}
