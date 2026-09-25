package com.busmate.routeschedule.community.dto;

import com.busmate.routeschedule.community.entity.Affiliation;
import com.busmate.routeschedule.network.dto.response.StopResponse;

/**
 * Everything a reviewer needs for one changeset: the proposal, the record it targets as it stands
 * right now (null for a brand-new stop), how far apart the proposed and current positions are, the
 * contributor's declared affiliation and track record, and whether the target already outranks
 * community data so approval is blocked (ADR-018 precedence). For a working proposal (ADR-026) there is no stop:
 * {@code scheduleContext} says which departure it is and who is already recorded on it.
 */
public record ChangesetReviewResponse(
        ChangesetResponse changeset,
        StopResponse currentStop,
        Double positionDistanceMeters,
        Affiliation proposerAffiliation,
        ContributorTrackRecord proposerTrackRecord,
        boolean targetOutranksCommunityTier,
        boolean stale,
        ScheduleWorkingContext scheduleContext) {
}
