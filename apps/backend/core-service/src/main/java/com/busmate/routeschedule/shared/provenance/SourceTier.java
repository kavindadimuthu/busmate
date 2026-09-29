package com.busmate.routeschedule.shared.provenance;

/**
 * Where a reference record came from, ordered by precedence — a lower number outranks a higher one
 * (ADR-007, amended by ADR-018 so that SRC_4 also covers an accepted contributor's observation).
 */
public enum SourceTier {
    /** Authority-issued: gazetted routes, official timetables. Re-gazetting is rare, so this barely decays. */
    SRC_1(1, 90, "Authority", 730),
    /** An operator running on BusMate. */
    SRC_2(2, 90, "Operator", 365),
    /** An operator's shared file or feed. */
    SRC_3(3, 80, "Operator", 270),
    /** Field observation by BusMate or an accepted contributor. Schedules drift over months, not years. */
    SRC_4(4, 50, "BusMate", 180),
    /** Passenger reports, unverified. What someone saw two months ago says little about today. */
    SRC_5(5, 30, "Passenger reports", 60),
    /** Derived from historical patterns; re-derive it periodically rather than trust an old estimate. */
    SRC_6(6, 20, "Estimated", 90);

    private final int rank;
    private final int defaultConfidence;
    private final String defaultLabel;
    /** Days for the distance to {@link ConfidenceDecay#FLOOR} to halve (ADR-018). */
    private final int confidenceHalfLifeDays;

    SourceTier(int rank, int defaultConfidence, String defaultLabel, int confidenceHalfLifeDays) {
        this.rank = rank;
        this.defaultConfidence = defaultConfidence;
        this.defaultLabel = defaultLabel;
        this.confidenceHalfLifeDays = confidenceHalfLifeDays;
    }

    public int rank() {
        return rank;
    }

    public int defaultConfidence() {
        return defaultConfidence;
    }

    public String defaultLabel() {
        return defaultLabel;
    }

    public int confidenceHalfLifeDays() {
        return confidenceHalfLifeDays;
    }

    /** True when this tier wins over {@code other} on precedence. */
    public boolean outranks(SourceTier other) {
        return rank < other.rank;
    }

    /**
     * The tiers staff may record. A report ({@code SRC_5}) is included so a staff member transcribing someone
     * else's timetable can say that is what it is (ADR-025) — that says less about the record, not more.
     * Derived data ({@code SRC_6}) is not: nobody transcribes an estimate.
     */
    public boolean staffEnterable() {
        return this != SRC_6;
    }
}
