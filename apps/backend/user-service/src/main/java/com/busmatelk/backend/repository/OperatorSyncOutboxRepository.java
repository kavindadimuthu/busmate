package com.busmatelk.backend.repository;

import com.busmatelk.backend.model.OperatorSyncOutbox;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OperatorSyncOutboxRepository extends JpaRepository<OperatorSyncOutbox, UUID> {

    List<OperatorSyncOutbox> findBySyncStatusAndNextAttemptAtLessThanEqualOrderByCreatedAtAsc(
            String syncStatus, Instant now);

    /** The most recent sync attempt for a user — its syncStatus is that operator's current sync state. */
    Optional<OperatorSyncOutbox> findTopByUserIdOrderByCreatedAtDesc(UUID userId);

    List<OperatorSyncOutbox> findByUserIdAndSyncStatus(UUID userId, String syncStatus);
}
