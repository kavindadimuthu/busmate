package com.busmate.routeschedule.community.dto;

/**
 * An active contributor whose record clears the configured promotion thresholds (ADR-022). Advisory: the
 * list narrows who staff look at, it never appoints anyone.
 */
public record PromotionCandidateResponse(
        ContributorResponse contributor,
        long approved,
        long rejected,
        long reverted,
        double approvalRate) {
}
