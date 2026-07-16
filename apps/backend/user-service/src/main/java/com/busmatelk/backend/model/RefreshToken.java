package com.busmatelk.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * A single issued refresh token. The raw token is never stored — only its SHA-256 hash — so a
 * database leak can't be replayed. Tokens rotate on every use: the presented token is revoked and
 * a successor is issued in the same {@code familyId}. If an already-revoked token is presented
 * again (a replay / theft signal), the whole family is revoked. See {@code RefreshTokenService}.
 */
@Entity
@Table(name = "refresh_tokens",
        indexes = {
                @Index(name = "idx_refresh_tokens_family", columnList = "family_id"),
                @Index(name = "idx_refresh_tokens_user", columnList = "user_id")
        })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "token_hash", nullable = false, unique = true)
    private String tokenHash;

    /** Rotation lineage — every token minted by rotating a predecessor keeps the same family. */
    @Column(name = "family_id", nullable = false)
    private UUID familyId;

    @Column(name = "issued_at", updatable = false)
    @CreationTimestamp
    private Instant issuedAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    /** Null while the token is live; set when rotated, revoked, or its family is burned. */
    @Column(name = "revoked_at")
    private Instant revokedAt;

    // Captured for audit once the request context is threaded through (later phase); nullable now.
    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "ip")
    private String ip;
}
