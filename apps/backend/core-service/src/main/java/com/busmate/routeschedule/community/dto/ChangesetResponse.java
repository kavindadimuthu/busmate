package com.busmate.routeschedule.community.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import com.busmate.routeschedule.community.entity.ChangesetAction;
import com.busmate.routeschedule.community.entity.ChangesetEntityType;
import com.busmate.routeschedule.community.entity.ChangesetStatus;
import com.busmate.routeschedule.community.entity.ObservationMethod;
import com.fasterxml.jackson.databind.JsonNode;

public record ChangesetResponse(
        UUID id,
        ChangesetEntityType entityType,
        ChangesetAction action,
        UUID targetId,
        JsonNode proposedValues,
        JsonNode targetSnapshot,
        LocalDate observedOn,
        ObservationMethod observationMethod,
        String note,
        ChangesetStatus status,
        UUID proposerUserId,
        Instant createdAt,
        UUID decidedBy,
        Instant decidedAt,
        String decisionReason) {
}
