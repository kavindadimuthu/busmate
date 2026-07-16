package com.busmatelk.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * An immutable record of a security- or account-relevant event: logins (success/failure),
 * refreshes, password/email flows, social login, and admin-initiated account status changes.
 * Nothing ever updates a row here — only inserts, via {@link com.busmatelk.backend.service.AuditLogService}.
 */
@Entity
@Table(name = "auth_audit_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    /** The account the event is about. Null only for a failed login against an unknown email. */
    @Column(name = "user_id")
    private UUID userId;

    /**
     * Who performed the action. Equal to {@code userId} for self-service events (login, own
     * password change); a different admin/staff id for actions taken on someone else's account
     * (suspend, deactivate, delete, reactivate, admin-created user).
     */
    @Column(name = "actor_id")
    private UUID actorId;

    /** e.g. {@code login.success}, {@code refresh.reuse_detected}, {@code account.suspended}. */
    @Column(nullable = false)
    private String action;

    /** Free-form context (e.g. "status=suspended"); intentionally not JSON — see Phase 3/5 notes. */
    private String details;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private Instant createdAt;
}
