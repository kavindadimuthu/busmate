package com.busmatelk.backend.operator;

import com.busmatelk.backend.model.OperatorSyncOutbox;
import com.busmatelk.backend.repository.OperatorSyncOutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;

import java.time.Instant;
import java.util.List;

/**
 * Polls operator_sync_outbox for PENDING rows whose backoff window has elapsed and retries
 * them against core-service, one at a time in createdAt order. Processing sequentially
 * (rather than in parallel) keeps a given userId's rows in the order they were enqueued —
 * e.g. its CREATE row is always attempted before a later UPDATE row for the same operator,
 * so an UPDATE never races ahead of the CREATE it depends on within a single run.
 *
 * Known limitation: if a CREATE row is still backing off (nextAttemptAt in the future) while
 * a later UPDATE row for the same userId has already become due, the UPDATE will be attempted
 * first and fail with a 404 from core-service (no Operator exists yet) — it simply retries
 * again on a later tick once the CREATE has gone through. Acceptable for a best-effort,
 * eventually-consistent fallback; not worth the added complexity of per-user sequencing.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OperatorSyncRetryJob {

    private static final int MAX_ATTEMPTS = 8;
    private static final long BASE_BACKOFF_SECONDS = 15;
    private static final long MAX_BACKOFF_SECONDS = 600;
    private static final int MAX_ERROR_MESSAGE_LENGTH = 1000;

    private final OperatorSyncOutboxRepository outboxRepository;
    private final OperatorSyncClient operatorSyncClient;

    @Scheduled(fixedDelayString = "${operator-sync.retry-interval-ms:30000}")
    public void retryPending() {
        List<OperatorSyncOutbox> due = outboxRepository
                .findBySyncStatusAndNextAttemptAtLessThanEqualOrderByCreatedAtAsc("PENDING", Instant.now());
        for (OperatorSyncOutbox row : due) {
            attempt(row);
        }
    }

    @Transactional
    void attempt(OperatorSyncOutbox row) {
        row.setAttempts(row.getAttempts() + 1);
        try {
            switch (row.getOperation()) {
                case "CREATE" -> operatorSyncClient.createOrGetOperator(toPayload(row));
                case "UPDATE" -> operatorSyncClient.updateOperator(row.getUserId(), toPayload(row));
                case "STATUS_UPDATE" -> operatorSyncClient.updateStatus(row.getUserId(), row.getOperatorStatus());
                default -> throw new IllegalStateException("Unknown outbox operation: " + row.getOperation());
            }
            row.setSyncStatus("SYNCED");
            row.setLastError(null);
            log.info("Operator sync outbox {} ({}) for userId {} succeeded on attempt {}",
                    row.getId(), row.getOperation(), row.getUserId(), row.getAttempts());
        } catch (RestClientException e) {
            row.setLastError(truncate(e.getMessage()));
            if (row.getAttempts() >= MAX_ATTEMPTS) {
                row.setSyncStatus("FAILED");
                log.error("Operator sync outbox {} ({}) for userId {} failed permanently after {} attempts: {}",
                        row.getId(), row.getOperation(), row.getUserId(), row.getAttempts(), e.getMessage());
            } else {
                row.setNextAttemptAt(Instant.now().plusSeconds(backoffSeconds(row.getAttempts())));
                log.warn("Operator sync outbox {} ({}) for userId {} failed (attempt {}/{}), retrying at {}: {}",
                        row.getId(), row.getOperation(), row.getUserId(), row.getAttempts(), MAX_ATTEMPTS,
                        row.getNextAttemptAt(), e.getMessage());
            }
        }
        outboxRepository.save(row);
    }

    private long backoffSeconds(int attempts) {
        long backoff = BASE_BACKOFF_SECONDS * (1L << (attempts - 1));
        return Math.min(backoff, MAX_BACKOFF_SECONDS);
    }

    private OperatorSyncPayload toPayload(OperatorSyncOutbox row) {
        return new OperatorSyncPayload(row.getUserId(), row.getName(), row.getOperatorType(), row.getRegion(), row.getOperatorStatus());
    }

    private String truncate(String message) {
        if (message == null) {
            return null;
        }
        return message.length() > MAX_ERROR_MESSAGE_LENGTH ? message.substring(0, MAX_ERROR_MESSAGE_LENGTH) : message;
    }
}
