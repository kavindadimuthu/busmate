package com.busmatelk.backend.service;

import com.busmatelk.backend.model.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Issues the short-lived access token for the in-house auth path. (The refresh token is opaque and
 * stored — see {@link RefreshTokenService}.)
 *
 * <p><b>Token-format note:</b> the access token is an HS256 JWT signed with the same shared secret
 * the API gateway and {@code JwtAuthFilter} verify against ({@code auth.jwt.secret}, defaulting to
 * the existing {@code SUPABASE_JWT_SECRET}), and it deliberately reproduces GoTrue's claim shape —
 * {@code sub}, {@code email}, and a nested {@code app_metadata} carrying {@code user_type}/
 * {@code account_status} — so every verifier across the platform keeps working unchanged. The
 * planned RS256 + JWKS upgrade (Phase 2b) is a coordinated switch of all those verifiers and is
 * intentionally kept separate from this refresh-token hardening.
 */
@Service
public class TokenService {

    private final Key signingKey;
    private final long accessTtlSeconds;
    private final String issuer;

    public TokenService(
            @Value("${auth.jwt.secret}") String secret,
            @Value("${auth.jwt.access-token-ttl-seconds}") long accessTtlSeconds,
            @Value("${auth.jwt.issuer}") String issuer) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
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
                .setSubject(user.getUserId().toString())
                .claim("email", user.getEmail())
                .claim("app_metadata", appMetadata)
                .setIssuer(issuer)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusSeconds(accessTtlSeconds)))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();

        return new AccessToken(value, accessTtlSeconds);
    }
}
