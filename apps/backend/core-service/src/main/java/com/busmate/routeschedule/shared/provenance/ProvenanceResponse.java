package com.busmate.routeschedule.shared.provenance;

import java.time.Instant;
import lombok.Data;

/**
 * The provenance of a network record. The stop, route and schedule read endpoints are public, so this
 * carries the display credit only — never the credited user's id, which would publish a contributor's
 * identity.
 */
@Data
public class ProvenanceResponse {
    private SourceTier sourceTier;
    private Instant observedAt;
    private Integer baseConfidence;
    private String attributionLabel;
}
