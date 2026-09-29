package com.busmate.routeschedule.shared.provenance;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;

import org.springframework.stereotype.Component;

import com.busmate.routeschedule.shared.exception.BadRequestException;
import com.busmate.routeschedule.shared.exception.ForbiddenException;
import com.busmate.routeschedule.shared.exception.UnauthorizedException;
import com.busmate.routeschedule.shared.security.Caller;
import com.busmate.routeschedule.shared.security.CallerContext;

import lombok.RequiredArgsConstructor;

/**
 * Applies the provenance rules of ADR-018 on staff writes. A caller can never set the credited user:
 * that is stamped only by the review flow that applies a contributor's changeset.
 */
@Component
@RequiredArgsConstructor
public class ProvenanceStamper {

    private final CallerContext callerContext;

    /** A new record: the requested source, or field observation credited to BusMate. */
    public void stampCreate(ProvenancedEntity entity, SourceTier requested, String requestedLabel) {
        stampCreate(entity, requested, requestedLabel, null);
    }

    /**
     * As above, dated to {@code observedOn} when the information dates from before it was typed in (ADR-025):
     * a year-old post is reported as of that date, not confirmed today. Never in the future.
     */
    public void stampCreate(ProvenancedEntity entity, SourceTier requested, String requestedLabel, LocalDate observedOn) {
        SourceTier tier = resolve(requested);
        entity.setProvenance(Provenance.of(tier, requestedLabel, null, observedAt(observedOn)));
    }

    /**
     * An edit. The record keeps its source unless the request names one, and is observed now. Two
     * cases fall back to BusMate's own observation, because the previous credit no longer describes
     * the data: an official record edited by anyone but MOT, and a contributor's record edited by staff.
     */
    public void stampEdit(ProvenancedEntity entity, SourceTier requested, String requestedLabel) {
        stampEdit(entity, requested, requestedLabel, null);
    }

    /**
     * An edit that may state the date the information dates from. A report ({@code SRC_5}) that is edited
     * without saying so is not re-observed: correcting a typo in an unverified report does not confirm it, so
     * it keeps its age (ADR-025).
     */
    public void stampEdit(ProvenancedEntity entity, SourceTier requested, String requestedLabel, LocalDate observedOn) {
        Provenance current = entity.getProvenance();
        if (requested != null) {
            stampCreate(entity, requested, requestedLabel, observedOn);
            return;
        }
        if (current == null) {
            stampCreate(entity, null, null, observedOn);
            return;
        }
        boolean officialEditedByNonMot = current.getSourceTier() == SourceTier.SRC_1 && !isMot();
        if (officialEditedByNonMot || current.getAttributedUserId() != null) {
            entity.setProvenance(Provenance.of(SourceTier.SRC_4, null, null, observedAt(observedOn)));
            return;
        }
        if (observedOn != null || current.getSourceTier() != SourceTier.SRC_5) {
            current.setObservedAt(observedAt(observedOn));
        }
        if (requestedLabel != null && !requestedLabel.isBlank()) {
            current.setAttributionLabel(requestedLabel.strip());
        }
    }

    private static Instant observedAt(LocalDate observedOn) {
        if (observedOn == null) {
            return Instant.now();
        }
        if (observedOn.isAfter(LocalDate.now(ZoneOffset.UTC))) {
            throw new BadRequestException("The date it was observed cannot be in the future");
        }
        return observedOn.atStartOfDay(ZoneOffset.UTC).toInstant();
    }

    /** Gives {@code child} the same source, observation time and credit as {@code parent}. */
    public void copy(ProvenancedEntity parent, ProvenancedEntity child) {
        Provenance p = parent.getProvenance();
        child.setProvenance(Provenance.of(p.getSourceTier(), p.getAttributionLabel(), p.getAttributedUserId(),
                p.getObservedAt()));
        child.getProvenance().setBaseConfidence(p.getBaseConfidence());
    }

    /** Validates a requested tier for the current caller; null means the default. */
    public SourceTier resolve(SourceTier requested) {
        if (requested == null) {
            return SourceTier.SRC_4;
        }
        if (!requested.staffEnterable()) {
            throw new BadRequestException(
                    "Source " + requested + " cannot be recorded by staff; use SRC_1 to SRC_5");
        }
        if (requested == SourceTier.SRC_1 && !isMot()) {
            throw new ForbiddenException("Only the Ministry of Transport can mark a record official");
        }
        return requested;
    }

    private boolean isMot() {
        try {
            Caller caller = callerContext.require();
            return caller.hasRole(Caller.MOT);
        } catch (UnauthorizedException e) {
            return false;
        }
    }
}
