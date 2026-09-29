package com.busmate.routeschedule.community.dto;

import java.time.Instant;
import java.util.UUID;

import com.busmate.routeschedule.community.entity.ReportReason;
import com.busmate.routeschedule.community.entity.ReportStatus;
import com.busmate.routeschedule.community.entity.ReportedEntityType;

/** Never carries the reporter's identity outside this staff-only view — see the same boundary drawn for a
 * changeset's proposer (INC-028). A passenger reading their own report gets it back some other way if ever
 * needed; nothing today reads a report except the reporter (via 409 on a duplicate) and staff. */
public record PassengerReportResponse(
        UUID id,
        ReportedEntityType entityType,
        UUID targetId,
        ReportReason reason,
        String note,
        ReportStatus status,
        Instant createdAt,
        Instant resolvedAt,
        String resolutionNote) {
}
