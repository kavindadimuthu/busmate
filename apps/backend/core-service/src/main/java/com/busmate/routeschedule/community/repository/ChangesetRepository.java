package com.busmate.routeschedule.community.repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.busmate.routeschedule.community.entity.Changeset;
import com.busmate.routeschedule.community.entity.ChangesetEntityType;
import com.busmate.routeschedule.community.entity.ChangesetStatus;

public interface ChangesetRepository extends JpaRepository<Changeset, UUID> {

    Page<Changeset> findByProposerUserIdOrderByCreatedAtDesc(UUID proposerUserId, Pageable pageable);

    Page<Changeset> findByProposerUserIdAndStatusOrderByCreatedAtDesc(UUID proposerUserId, ChangesetStatus status,
                                                                       Pageable pageable);

    Page<Changeset> findByEntityTypeAndStatusOrderByCreatedAtAsc(ChangesetEntityType entityType,
                                                                  ChangesetStatus status, Pageable pageable);

    Optional<Changeset> findByProposerUserIdAndTargetIdAndStatus(UUID proposerUserId, UUID targetId,
                                                                   ChangesetStatus status);

    long countByProposerUserIdAndEntityTypeAndCreatedAtAfter(UUID proposerUserId, ChangesetEntityType entityType,
                                                              Instant since);
}
