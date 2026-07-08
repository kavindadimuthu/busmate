package com.busmatelk.backend.event;

import java.time.Instant;
import java.util.Map;

public record UserEvent(
    String eventType,      // user.created, user.updated, user.deleted, user.permission_changed
    String userId,
    String userType,
    String triggeredBy,
    Map<String, Object> payload,
    Instant timestamp
) {}
