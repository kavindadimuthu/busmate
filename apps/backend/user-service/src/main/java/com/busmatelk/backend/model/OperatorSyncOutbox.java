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
 * Durability fallback for the operator lifecycle sync to core-service, used in place of a
 * Kafka-backed event bus (no broker is deployed in this platform — see
 * docs/plans/Unified-Operator-Lifecycle-Management-Plan.md). A row is only ever written
 * when the synchronous call to core-service's /internal/operators fails; on success nothing
 * is persisted here at all. OperatorSyncRetryJob polls PENDING rows and retries with backoff.
 *
 * operation is one of CREATE, UPDATE, STATUS_UPDATE (plain String, matching this codebase's
 * existing convention of not using Java enums for state fields — see User.accountStatus).
 * syncStatus is one of PENDING, SYNCED, FAILED (FAILED is terminal after max attempts and
 * needs the manual "retry" action from the admin dashboard, added in Step 3 of the plan).
 */
@Entity
@Table(name = "operator_sync_outbox")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperatorSyncOutbox {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String operation;

    private String name;

    @Column(name = "operator_type")
    private String operatorType;

    private String region;

    /** The target Operator.status value being synced — not this row's own lifecycle state. */
    @Column(name = "operator_status")
    private String operatorStatus;

    @Column(name = "sync_status", nullable = false)
    @Builder.Default
    private String syncStatus = "PENDING";

    @Builder.Default
    private int attempts = 0;

    @Column(name = "last_error", columnDefinition = "text")
    private String lastError;

    @Column(name = "next_attempt_at")
    private Instant nextAttemptAt;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private Instant createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private Instant updatedAt;
}
