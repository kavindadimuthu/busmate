package com.busmatelk.backend.service;

import com.busmatelk.backend.model.AuthAuditLog;
import com.busmatelk.backend.repository.AuthAuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Writes {@code auth_audit_log} rows for security- and account-relevant events. Every write runs
 * in its own transaction ({@code REQUIRES_NEW}): a failed-login or reuse-detected audit entry must
 * survive even though the very method recording it is about to throw and roll its own transaction
 * back (the same rationale as {@code RefreshTokenService.rotate}'s {@code noRollbackFor}, but here
 * the caller's exception still needs to propagate, so a nested transaction is the right tool
 * instead). Never lets an audit-write failure break the auth flow it's observing.
 */
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    private final AuthAuditLogRepository auditLogRepository;

    /**
     * Self-service event — the actor and the subject are the same account. Deliberately its own
     * {@code @Transactional} method rather than delegating to the {@code (userId, actorId, ...)}
     * overload: a same-class delegation would call the other method directly on {@code this},
     * bypassing Spring's transactional proxy entirely and silently losing {@code REQUIRES_NEW}.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(UUID userId, String action, String details) {
        save(userId, userId, action, details);
    }

    /** Admin-initiated event — {@code actorId} performed {@code action} against {@code userId}. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(UUID userId, UUID actorId, String action, String details) {
        save(userId, actorId, action, details);
    }

    private void save(UUID userId, UUID actorId, String action, String details) {
        try {
            auditLogRepository.save(AuthAuditLog.builder()
                    .userId(userId)
                    .actorId(actorId)
                    .action(action)
                    .details(details)
                    .build());
        } catch (RuntimeException e) {
            log.warn("Failed to write audit log entry [{}] for user {}", action, userId, e);
        }
    }
}
