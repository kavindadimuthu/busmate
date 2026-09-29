package com.busmate.routeschedule.postimport.repository;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.busmate.routeschedule.postimport.entity.PostImportDraft;

@Repository
public interface PostImportDraftRepository extends JpaRepository<PostImportDraft, UUID> {

    Page<PostImportDraft> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /** How many drafts this person has created since {@code since} — the per-person rate limit. */
    long countByCreatedByAndCreatedAtAfter(String createdBy, Instant since);
}
