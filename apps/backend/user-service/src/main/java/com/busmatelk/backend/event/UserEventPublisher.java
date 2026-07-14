package com.busmatelk.backend.event;

import com.busmatelk.backend.kafka.KafkaCorrelation;
import com.busmatelk.backend.model.User;
import com.busmatelk.backend.repository.UserRepository;
import com.busmatelk.backend.repository.UserTypeRepository;
import lombok.RequiredArgsConstructor;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class UserEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(UserEventPublisher.class);
    private static final String TOPIC = "user-events";

    private final KafkaTemplate<String, UserEvent> kafkaTemplate;
    private final UserRepository userRepository;
    private final UserTypeRepository userTypeRepository;

    public void publishUserCreated(User user) {
        String triggeredBy = user.getCreatedBy() != null
                ? user.getCreatedBy().getUserId().toString()
                : user.getUserId().toString();

        send(user.getUserId().toString(), new UserEvent(
                "user.created",
                user.getUserId().toString(),
                user.getUserType().getName(),
                triggeredBy,
                Map.of("email", user.getEmail(), "accountStatus", user.getAccountStatus()),
                Instant.now()));
    }

    public void publishUserUpdated(UUID userId, List<String> changedFields) {
        send(userId.toString(), new UserEvent(
                "user.updated",
                userId.toString(),
                userTypeNameOf(userId),
                resolveTriggeredBy(userId.toString()),
                Map.of("changedFields", changedFields),
                Instant.now()));
    }

    public void publishUserDeleted(UUID userId) {
        send(userId.toString(), new UserEvent(
                "user.deleted",
                userId.toString(),
                userTypeNameOf(userId),
                resolveTriggeredBy(userId.toString()),
                Map.of(),
                Instant.now()));
    }

    public void publishPermissionChanged(UUID userId, String permission, boolean isGranted) {
        send(userId.toString(), new UserEvent(
                "user.permission_changed",
                userId.toString(),
                userTypeNameOf(userId),
                resolveTriggeredBy(userId.toString()),
                Map.of("permission", permission, "isGranted", isGranted),
                Instant.now()));
    }

    public void publishTypePermissionChanged(UUID userTypeId, String permission, boolean isGranted) {
        String userTypeName = userTypeRepository.findById(userTypeId)
                .map(ut -> ut.getName())
                .orElse(null);

        send(userTypeId.toString(), new UserEvent(
                "user.permission_changed",
                null,
                userTypeName,
                resolveTriggeredBy("system"),
                Map.of("userTypeId", userTypeId.toString(), "permission", permission, "isGranted", isGranted),
                Instant.now()));
    }

    private String userTypeNameOf(UUID userId) {
        return userRepository.findById(userId).map(u -> u.getUserType().getName()).orElse(null);
    }

    /**
     * UserService/PermissionService write methods (per the plan) don't carry a separate
     * "who's calling" parameter distinct from the subject userId, so this reads the caller
     * off the security context (populated by JwtAuthFilter) the same way PermissionCheckAspect
     * does, falling back to the given default when there's no authenticated caller (e.g.
     * self-registration, which happens before the new user has a session).
     */
    private String resolveTriggeredBy(String fallback) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof String principal
                && !"anonymousUser".equals(principal)) {
            return principal;
        }
        return fallback;
    }

    private void send(String key, UserEvent event) {
        try {
            ProducerRecord<String, UserEvent> record = new ProducerRecord<>(TOPIC, key, event);
            KafkaCorrelation.stamp(record);
            kafkaTemplate.send(record);
        } catch (Exception e) {
            // Best-effort — a Kafka hiccup should never fail the write that already succeeded.
            log.warn("Failed to publish user event {} for key {}: {}", event.eventType(), key, e.getMessage());
        }
    }
}
