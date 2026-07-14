package com.busmatelk.backend.operator;

import com.busmatelk.backend.model.OperatorSyncOutbox;
import com.busmatelk.backend.repository.OperatorSyncOutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Entry point for the unified operator lifecycle sync, called from the userType=="operator"
 * branch of user-service's account mutation paths (AuthService.createUser(),
 * UserProfileService.updateProfile(), UserService.deleteUser()/reactivateUser()). Always
 * attempts the synchronous call to core-service first; only on failure does it fall back to
 * the operator_sync_outbox table for OperatorSyncRetryJob to pick up later. This keeps the
 * common case (core-service reachable) a single extra HTTP call with no added latency from
 * a queue, while still giving durability when it's down — without needing Kafka, which has
 * no broker deployed anywhere in this platform.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OperatorSyncService {

    public static final String OPERATOR_USER_TYPE = "operator";

    private static final String OP_CREATE = "CREATE";
    private static final String OP_UPDATE = "UPDATE";
    private static final String OP_STATUS_UPDATE = "STATUS_UPDATE";

    private static final int MAX_ERROR_MESSAGE_LENGTH = 1000;

    private final OperatorSyncClient operatorSyncClient;
    private final OperatorSyncOutboxRepository outboxRepository;

    /** Called right after a new operator account + profile is persisted. */
    public void syncCreate(UUID userId, String userTypeName, Map<String, Object> profileData, String accountStatus) {
        if (!OPERATOR_USER_TYPE.equals(userTypeName)) {
            return;
        }
        OperatorSyncPayload payload = toPayload(userId, profileData, accountStatus);
        try {
            operatorSyncClient.createOrGetOperator(payload);
        } catch (RestClientException e) {
            enqueue(OP_CREATE, payload, e);
        }
    }

    /** Called after an operator's profile (organization_name/operator_type/region/...) is patched. */
    public void syncProfileUpdate(UUID userId, String userTypeName, Map<String, Object> mergedProfileData, String accountStatus) {
        if (!OPERATOR_USER_TYPE.equals(userTypeName)) {
            return;
        }
        OperatorSyncPayload payload = toPayload(userId, mergedProfileData, accountStatus);
        try {
            operatorSyncClient.updateOperator(userId, payload);
        } catch (RestClientException e) {
            enqueue(OP_UPDATE, payload, e);
        }
    }

    /** Called after an operator account is deactivated or reactivated. */
    public void syncStatus(UUID userId, String userTypeName, String status) {
        if (!OPERATOR_USER_TYPE.equals(userTypeName)) {
            return;
        }
        try {
            operatorSyncClient.updateStatus(userId, status);
        } catch (RestClientException e) {
            enqueue(OP_STATUS_UPDATE, new OperatorSyncPayload(userId, null, null, null, status), e);
        }
    }

    /**
     * The current sync state of a user's linked operator, for display in the admin UI —
     * "PENDING"/"FAILED" if the most recent sync attempt hasn't landed, empty if it has (or
     * there's never been a failure, i.e. every sync so far has gone through synchronously).
     */
    public Optional<String> getLatestSyncStatus(UUID userId) {
        return outboxRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
                .map(OperatorSyncOutbox::getSyncStatus)
                .filter(status -> !"SYNCED".equals(status));
    }

    /** Manual retry for an admin-facing "retry sync" action — resets FAILED rows for a fresh attempt cycle. */
    public void retryFailed(UUID userId) {
        List<OperatorSyncOutbox> failed = outboxRepository.findByUserIdAndSyncStatus(userId, "FAILED");
        Instant now = Instant.now();
        for (OperatorSyncOutbox row : failed) {
            row.setSyncStatus("PENDING");
            row.setAttempts(0);
            row.setLastError(null);
            row.setNextAttemptAt(now);
        }
        outboxRepository.saveAll(failed);
    }

    private void enqueue(String operation, OperatorSyncPayload payload, RestClientException cause) {
        log.warn("Operator sync ({}) failed for userId {}, queuing for retry: {}",
                operation, payload.userId(), cause.getMessage());

        OperatorSyncOutbox row = OperatorSyncOutbox.builder()
                .userId(payload.userId())
                .operation(operation)
                .name(payload.name())
                .operatorType(payload.operatorType())
                .region(payload.region())
                .operatorStatus(payload.status())
                .syncStatus("PENDING")
                .attempts(0)
                .lastError(truncate(cause.getMessage()))
                .nextAttemptAt(Instant.now())
                .build();
        outboxRepository.save(row);
    }

    private OperatorSyncPayload toPayload(UUID userId, Map<String, Object> profileData, String accountStatus) {
        return new OperatorSyncPayload(
                userId,
                asString(profileData.get("organization_name")),
                asString(profileData.get("operator_type")),
                asString(profileData.get("region")),
                accountStatus);
    }

    private String asString(Object value) {
        return value != null ? value.toString() : null;
    }

    private String truncate(String message) {
        if (message == null) {
            return null;
        }
        return message.length() > MAX_ERROR_MESSAGE_LENGTH ? message.substring(0, MAX_ERROR_MESSAGE_LENGTH) : message;
    }
}
