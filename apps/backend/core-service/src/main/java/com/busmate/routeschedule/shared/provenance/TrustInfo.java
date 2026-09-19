package com.busmate.routeschedule.shared.provenance;

import java.time.Instant;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** A trust label and when the value behind it was last confirmed. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "How far to trust a displayed value, and when it was last confirmed")
public class TrustInfo {
    private TrustLabel label;
    private Instant observedAt;

    /** Null when there is no label to give, so a response never carries an empty trust object. */
    public static TrustInfo of(TrustLabel label, Instant observedAt) {
        return label == null ? null : new TrustInfo(label, observedAt);
    }
}
