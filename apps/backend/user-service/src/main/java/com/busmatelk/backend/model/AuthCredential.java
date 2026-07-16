package com.busmatelk.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * The email/password secret for a user, kept in its own table (1:1 with {@link User}) so the
 * profile row never carries a hash. Users who only authenticate through a social provider have
 * no row here. Password hashes are bcrypt (Spring's DelegatingPasswordEncoder), which is the
 * same scheme Supabase/GoTrue used — so hashes imported from Supabase verify without a re-hash.
 */
@Entity
@Table(name = "auth_credentials")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthCredential {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "password_updated_at")
    private Instant passwordUpdatedAt;

    // Reserved for the lockout logic in the cross-cutting hardening phase; unused in Phase 1.
    @Column(name = "failed_attempts", nullable = false)
    @Builder.Default
    private int failedAttempts = 0;

    @Column(name = "locked_until")
    private Instant lockedUntil;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private Instant createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private Instant updatedAt;
}
