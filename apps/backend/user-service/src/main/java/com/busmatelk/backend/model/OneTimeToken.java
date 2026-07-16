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
 * A single-use, short-lived token backing the email-verify and password-reset flows. The raw
 * token is never stored — only its SHA-256 hash — so a database leak can't be replayed, and it's
 * single-use ({@code consumedAt}) so a link can't be reused once acted on.
 */
@Entity
@Table(name = "one_time_tokens",
        indexes = @Index(name = "idx_one_time_tokens_user_type", columnList = "user_id, type"))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OneTimeToken {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OneTimeTokenType type;

    @Column(name = "token_hash", nullable = false, unique = true)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "consumed_at")
    private Instant consumedAt;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private Instant createdAt;
}
