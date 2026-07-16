package com.busmatelk.backend.service;

import com.busmatelk.backend.config.RsaKeyMaterial;
import com.busmatelk.backend.model.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.interfaces.RSAPrivateKey;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Issues the short-lived access token for the in-house auth path. (The refresh token is opaque and
 * stored — see {@link RefreshTokenService}.)
 *
 * <p><b>Token-format note (Phase 2b):</b> access tokens are RS256 JWTs signed with this service's
 * RSA private key ({@link RsaKeyMaterial}) and carry a {@code kid} header matching the entry
 * published at {@code GET /public/jwks.json}, so every verifier across the platform (this
 * service's own {@code JwtAuthFilter}/{@code InternalService}, the API gateway, the management
 * portal) can verify them without sharing a secret. The claim shape still deliberately reproduces
 * GoTrue's — {@code sub}, {@code email}, and a nested {@code app_metadata} carrying
 * {@code user_type}/{@code account_status} — since that shape is what every consumer already
 * expects; only the signature moved from HS256 to RS256. {@link AccessTokenVerifier} accepts
 * both algorithms during the cutover.
 */
@Service
public class TokenService {

    private final RSAPrivateKey signingKey;
    private final String kid;
    private final long accessTtlSeconds;
    private final String issuer;

    public TokenService(
            RsaKeyMaterial keyMaterial,
            @Value("${auth.jwt.access-token-ttl-seconds}") long accessTtlSeconds,
            @Value("${auth.jwt.issuer}") String issuer) {
        this.signingKey = keyMaterial.privateKey();
        this.kid = keyMaterial.kid();
        this.accessTtlSeconds = accessTtlSeconds;
        this.issuer = issuer;
    }

    /** A minted access token and its lifetime in seconds. */
    public record AccessToken(String value, long expiresIn) {
    }

    public AccessToken issueAccessToken(User user) {
        Instant now = Instant.now();

        Map<String, Object> appMetadata = new HashMap<>();
        appMetadata.put("user_type", user.getUserType().getName());
        appMetadata.put("account_status", user.getAccountStatus());

        String value = Jwts.builder()
                .setHeaderParam("kid", kid)
                .setSubject(user.getUserId().toString())
                .claim("email", user.getEmail())
                .claim("app_metadata", appMetadata)
                .setIssuer(issuer)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusSeconds(accessTtlSeconds)))
                .signWith(signingKey, SignatureAlgorithm.RS256)
                .compact();

        return new AccessToken(value, accessTtlSeconds);
    }
}
