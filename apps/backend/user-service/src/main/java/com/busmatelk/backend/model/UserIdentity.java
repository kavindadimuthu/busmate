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
 * A login method attached to a user. Every password user gets a {@code provider = "local"} row
 * whose {@code providerUserId} is the email; social logins (Phase 4) add {@code "google"} /
 * {@code "facebook"} rows against the provider's subject id. The unique (provider, providerUserId)
 * constraint is what lets a returning social login map back to an existing account (account linking).
 */
@Entity
@Table(name = "user_identities",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_identity_provider_subject",
                columnNames = {"provider", "provider_user_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserIdentity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /** {@code local}, {@code google}, {@code facebook}, ... */
    @Column(nullable = false)
    private String provider;

    /** The provider's subject id for this identity; for {@code local} this is the email. */
    @Column(name = "provider_user_id", nullable = false)
    private String providerUserId;

    private String email;

    @Column(name = "linked_at", updatable = false)
    @CreationTimestamp
    private Instant linkedAt;
}
