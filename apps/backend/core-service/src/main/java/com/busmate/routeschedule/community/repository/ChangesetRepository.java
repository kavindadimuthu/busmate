package com.busmate.routeschedule.community.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.busmate.routeschedule.community.entity.Changeset;
import com.busmate.routeschedule.community.entity.ChangesetEntityType;
import com.busmate.routeschedule.community.entity.ChangesetStatus;

public interface ChangesetRepository extends JpaRepository<Changeset, UUID> {

    Page<Changeset> findByProposerUserIdOrderByCreatedAtDesc(UUID proposerUserId, Pageable pageable);

    Page<Changeset> findByProposerUserIdAndStatusOrderByCreatedAtDesc(UUID proposerUserId, ChangesetStatus status,
                                                                       Pageable pageable);

    Optional<Changeset> findByProposerUserIdAndTargetIdAndStatus(UUID proposerUserId, UUID targetId,
                                                                   ChangesetStatus status);

    long countByProposerUserIdAndEntityTypeAndCreatedAtAfter(UUID proposerUserId, ChangesetEntityType entityType,
                                                              Instant since);

    // ───────────────────────────── review queue (INC-031) ─────────────────────────────

    @Query("SELECT c FROM Changeset c WHERE c.entityType = :entityType " +
           "AND (:status IS NULL OR c.status = :status) " +
           "AND (:proposerUserId IS NULL OR c.proposerUserId = :proposerUserId) " +
           "AND (:proposerUserIds IS NULL OR c.proposerUserId IN :proposerUserIds) " +
           "ORDER BY c.createdAt ASC")
    Page<Changeset> findReviewQueue(@Param("entityType") ChangesetEntityType entityType,
                                     @Param("status") ChangesetStatus status,
                                     @Param("proposerUserId") UUID proposerUserId,
                                     @Param("proposerUserIds") List<UUID> proposerUserIds,
                                     Pageable pageable);

    long countByProposerUserIdAndStatus(UUID proposerUserId, ChangesetStatus status);
}
