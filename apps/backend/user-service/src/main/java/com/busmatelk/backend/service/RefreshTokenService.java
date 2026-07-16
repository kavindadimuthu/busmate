package com.busmatelk.backend.service;

import com.busmatelk.backend.model.RefreshToken;
import com.busmatelk.backend.repository.RefreshTokenRepository;
import com.busmatelk.backend.security.OpaqueTokenGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Owns the {@code refresh_tokens} table and the rotation/revocation policy.
 *
 * <p>Refresh tokens are opaque 256-bit random strings — never JWTs — so they are meaningless to
 * any other service and are stored only as SHA-256 hashes. Each use rotates the token (the old one
 * is revoked, a successor is issued in the same family). Presenting an already-revoked token means
 * either a replay or a stolen token being used after the legitimate client already rotated it, so
 * the entire family is burned. This is the piece Supabase used to provide for free.
 */
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${auth.jwt.refresh-token-ttl-seconds}")
    private long refreshTtlSeconds;

    /** The result of a successful rotation: who it belongs to and the fresh token to hand back. */
    public record Rotation(UUID userId, String newRefreshToken) {
    }

    /** Starts a brand-new session (a new family) and returns the raw token for the client. */
    @Transactional
    public String issue(UUID userId) {
        return mint(userId, UUID.randomUUID());
    }

    /**
     * Validates and rotates a refresh token. Throws {@link InvalidTokenException} (→ 401) for an
     * unknown, expired, or already-used token; a reused (already-revoked) token additionally burns
     * the whole family before failing.
     *
     * <p>{@code noRollbackFor} is essential: the theft-response family burn is a write that must
     * survive the very exception it raises — without it, throwing would roll the revocation back
     * and leave the stolen family alive.
     */
    @Transactional(noRollbackFor = InvalidTokenException.class)
    public Rotation rotate(String rawRefreshToken) {
        RefreshToken current = refreshTokenRepository.findByTokenHash(OpaqueTokenGenerator.hash(rawRefreshToken))
                .orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));

        if (current.getRevokedAt() != null) {
            // Reuse of a rotated/revoked token — treat as theft and revoke the live successor too.
            refreshTokenRepository.revokeFamily(current.getFamilyId(), Instant.now());
            throw new InvalidTokenException("Refresh token has already been used");
        }
        if (current.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidTokenException("Refresh token has expired");
        }

        current.setRevokedAt(Instant.now());
        refreshTokenRepository.save(current);

        String newRawToken = mint(current.getUserId(), current.getFamilyId());
        return new Rotation(current.getUserId(), newRawToken);
    }

    /** Revokes every live session for a user (logout, and later suspend/password-change). */
    @Transactional
    public void revokeAllForUser(UUID userId) {
        refreshTokenRepository.revokeActiveForUser(userId, Instant.now());
    }

    private String mint(UUID userId, UUID familyId) {
        String rawToken = OpaqueTokenGenerator.generate();
        RefreshToken token = RefreshToken.builder()
                .userId(userId)
                .tokenHash(OpaqueTokenGenerator.hash(rawToken))
                .familyId(familyId)
                .expiresAt(Instant.now().plusSeconds(refreshTtlSeconds))
                .build();
        refreshTokenRepository.save(token);
        return rawToken;
    }
}
