package com.busmate.routeschedule.shared.provenance;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Data;

/** Where a network record came from, when it was last observed, and whom to credit (ADR-018). */
@Data
@Embeddable
public class Provenance {

    @Enumerated(EnumType.STRING)
    @Column(name = "source_tier", nullable = false)
    private SourceTier sourceTier;

    @Column(name = "observed_at", nullable = false)
    private Instant observedAt;

    @Column(name = "base_confidence", nullable = false)
    private Integer baseConfidence;

    /** The contributor credited, when there is one; never set from a client request. */
    @Column(name = "attributed_user_id")
    private UUID attributedUserId;

    /** Display credit such as "BusMate" or an organisation. */
    @Column(name = "attribution_label", nullable = false)
    private String attributionLabel;

    public static Provenance of(SourceTier tier, String label, UUID attributedUserId, Instant observedAt) {
        Provenance p = new Provenance();
        p.sourceTier = tier;
        p.baseConfidence = tier.defaultConfidence();
        p.attributionLabel = label != null && !label.isBlank() ? label.strip() : tier.defaultLabel();
        p.attributedUserId = attributedUserId;
        p.observedAt = observedAt;
        return p;
    }
}
