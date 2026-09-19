package com.busmate.routeschedule.shared.provenance;

import java.time.Instant;
import java.util.UUID;

import lombok.Data;

/** The provenance of a network record as staff see it. */
@Data
public class ProvenanceResponse {
    private SourceTier sourceTier;
    private Instant observedAt;
    private Integer baseConfidence;
    private UUID attributedUserId;
    private String attributionLabel;
}
