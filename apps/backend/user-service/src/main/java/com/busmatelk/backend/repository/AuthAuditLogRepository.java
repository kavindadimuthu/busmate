package com.busmatelk.backend.repository;

import com.busmatelk.backend.model.AuthAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AuthAuditLogRepository extends JpaRepository<AuthAuditLog, UUID> {
    Page<AuthAuditLog> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    /** Only used by tests to check the most recent write regardless of which user it's about
     * (e.g. a refresh-reuse failure, which is intentionally recorded with a null userId — see
     * AuthService.refresh). */
    Optional<AuthAuditLog> findTopByOrderByCreatedAtDesc();
}
