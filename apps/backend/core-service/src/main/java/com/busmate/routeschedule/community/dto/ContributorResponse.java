package com.busmate.routeschedule.community.dto;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import com.busmate.routeschedule.community.entity.Affiliation;
import com.busmate.routeschedule.community.entity.ContributorLevel;
import com.busmate.routeschedule.community.entity.ContributorStatus;

/** A contributor record as staff and the contributor themselves see it. Names stay in user-service. */
public record ContributorResponse(
        UUID userId,
        ContributorStatus status,
        ContributorLevel level,
        String motivation,
        String homeDistrict,
        Set<UUID> corridorRouteGroupIds,
        Affiliation affiliation,
        String affiliationDetail,
        String agreementVersion,
        boolean agreementCurrent,
        Instant agreementAcceptedAt,
        Instant appliedAt,
        UUID decidedBy,
        Instant decidedAt,
        String decisionReason) {
}
