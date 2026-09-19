package com.busmate.routeschedule.shared.provenance;

import java.time.Instant;

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
        SourceTier tier = resolve(requested);
        entity.setProvenance(Provenance.of(tier, requestedLabel, null, Instant.now()));
    }

    /**
     * An edit. The record keeps its source unless the request names one, and is observed now. Two
     * cases fall back to BusMate's own observation, because the previous credit no longer describes
     * the data: an official record edited by anyone but MOT, and a contributor's record edited by staff.
     */
    public void stampEdit(ProvenancedEntity entity, SourceTier requested, String requestedLabel) {
        Provenance current = entity.getProvenance();
        if (requested != null) {
            stampCreate(entity, requested, requestedLabel);
            return;
        }
        if (current == null) {
            stampCreate(entity, null, null);
            return;
        }
        boolean officialEditedByNonMot = current.getSourceTier() == SourceTier.SRC_1 && !isMot();
        if (officialEditedByNonMot || current.getAttributedUserId() != null) {
            entity.setProvenance(Provenance.of(SourceTier.SRC_4, null, null, Instant.now()));
            return;
        }
        current.setObservedAt(Instant.now());
        if (requestedLabel != null && !requestedLabel.isBlank()) {
            current.setAttributionLabel(requestedLabel.strip());
        }
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
                    "Source " + requested + " cannot be recorded by staff; use SRC_1 to SRC_4");
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
