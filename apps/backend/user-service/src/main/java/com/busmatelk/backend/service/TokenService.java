package com.busmatelk.backend.service;

import com.busmatelk.backend.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
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
import java.util.UUID;

/**
 * Issues and validates the session tokens for the in-house auth path.
 *
 * <p><b>Phase 1 note:</b> tokens are HS256 JWTs signed with the same shared secret the API
 * gateway and {@code JwtAuthFilter} already verify against ({@code auth.jwt.secret}, defaulting
 * to the existing {@code SUPABASE_JWT_SECRET}), and the access token deliberately reproduces
 * GoTrue's claim shape — {@code sub}, {@code email}, and a nested {@code app_metadata} carrying
 * {@code user_type}/{@code account_status}. That lets the rest of the platform keep verifying
 * tokens unchanged while the credential store moves in-house. The refresh token is likewise a
 * stateless JWT here. Phase 2 replaces all of this with RS256 + JWKS and opaque, stored,
 * rotating refresh tokens with real revocation.
 */
@Service
public class TokenService {

    private final Key signingKey;
    private final long accessTtlSeconds;
    private final long refreshTtlSeconds;
    private final String issuer;

    public TokenService(
            @Value("${auth.jwt.secret}") String secret,
            @Value("${auth.jwt.access-token-ttl-seconds}") long accessTtlSeconds,
            @Value("${auth.jwt.refresh-token-ttl-seconds}") long refreshTtlSeconds,
            @Value("${auth.jwt.issuer}") String issuer) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTtlSeconds = accessTtlSeconds;
        this.refreshTtlSeconds = refreshTtlSeconds;
        this.issuer = issuer;
    }

    /** The session pair handed back to a client on login/refresh. */
    public record IssuedTokens(String accessToken, String refreshToken, long expiresIn) {
    }

    public IssuedTokens issueTokens(User user) {
        Instant now = Instant.now();

        Map<String, Object> appMetadata = new HashMap<>();
        appMetadata.put("user_type", user.getUserType().getName());
        appMetadata.put("account_status", user.getAccountStatus());

        String accessToken = Jwts.builder()
                .setSubject(user.getUserId().toString())
                .claim("email", user.getEmail())
                .claim("app_metadata", appMetadata)
                .setIssuer(issuer)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusSeconds(accessTtlSeconds)))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();

        String refreshToken = Jwts.builder()
                .setSubject(user.getUserId().toString())
                .claim("type", "refresh")
                .setIssuer(issuer)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusSeconds(refreshTtlSeconds)))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();

        return new IssuedTokens(accessToken, refreshToken, accessTtlSeconds);
    }

    /**
     * Validates a refresh token and returns the user id it was issued for. Throws
     * {@link InvalidTokenException} (mapped to 401) for anything expired, tampered, or that
     * isn't actually a refresh token.
     */
    public UUID parseRefreshToken(String refreshToken) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(signingKey)
                    .build()
                    .parseClaimsJws(refreshToken)
                    .getBody();

            if (!"refresh".equals(claims.get("type", String.class))) {
                throw new InvalidTokenException("Provided token is not a refresh token");
            }
            return UUID.fromString(claims.getSubject());
        } catch (JwtException | IllegalArgumentException e) {
            throw new InvalidTokenException("Invalid or expired refresh token");
        }
    }
}
