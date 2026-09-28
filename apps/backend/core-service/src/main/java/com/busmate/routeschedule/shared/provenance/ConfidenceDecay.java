package com.busmate.routeschedule.shared.provenance;

import java.time.Duration;
import java.time.Instant;

/**
 * How much a record's confidence has decayed since it was last observed (ADR-018: "confidence decays at
 * read time... no nightly job rewrites rows"). A pure function of the record's tier, base confidence and
 * age — computed fresh on every read, so nothing is stored or scheduled.
 *
 * <p>Each tier decays at its own rate, reflecting how quickly that kind of claim usually goes stale: a
 * gazetted route outlives a passenger's report of what they saw yesterday. Confidence never reaches zero —
 * a record that has not been touched in years still says something, just less — and it never rises: an old
 * record read again tomorrow is not "more confirmed" for having been looked at.
 */
public final class ConfidenceDecay {

    /** Never claim a record has no evidence behind it at all, however old. */
    static final int FLOOR = 10;

    private ConfidenceDecay() {
    }

    /**
     * The confidence a record's age has left it with: half of the distance from {@code baseConfidence}
     * down to {@link #FLOOR} is gone every {@link SourceTier#confidenceHalfLifeDays()}.
     */
    public static Integer effectiveConfidence(SourceTier tier, Integer baseConfidence, Instant observedAt, Instant now) {
        if (tier == null || baseConfidence == null || observedAt == null || now == null) {
            return baseConfidence;
        }
        double ageDays = Duration.between(observedAt, now).toMinutes() / (24.0 * 60);
        if (ageDays <= 0) {
            return baseConfidence;
        }
        double decayed = FLOOR + (baseConfidence - FLOOR) * Math.pow(0.5, ageDays / tier.confidenceHalfLifeDays());
        return (int) Math.round(decayed);
    }
}
