package com.busmate.routeschedule.shared.provenance;

/**
 * Where a reference record came from, ordered by precedence — a lower number outranks a higher one
 * (ADR-007, amended by ADR-018 so that SRC_4 also covers an accepted contributor's observation).
 */
public enum SourceTier {
    /** Authority-issued: gazetted routes, official timetables. */
    SRC_1(1, 90, "Authority"),
    /** An operator running on BusMate. */
    SRC_2(2, 90, "Operator"),
    /** An operator's shared file or feed. */
    SRC_3(3, 80, "Operator"),
    /** Field observation by BusMate or an accepted contributor. */
    SRC_4(4, 50, "BusMate"),
    /** Passenger reports, unverified. */
    SRC_5(5, 30, "Passenger reports"),
    /** Derived from historical patterns. */
    SRC_6(6, 20, "Estimated");

    private final int rank;
    private final int defaultConfidence;
    private final String defaultLabel;

    SourceTier(int rank, int defaultConfidence, String defaultLabel) {
        this.rank = rank;
        this.defaultConfidence = defaultConfidence;
        this.defaultLabel = defaultLabel;
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

    /** True when this tier wins over {@code other} on precedence. */
    public boolean outranks(SourceTier other) {
        return rank < other.rank;
    }

    /** The tiers staff may record directly; reports and derived data arrive by other routes. */
    public boolean staffEnterable() {
        return this == SRC_1 || this == SRC_2 || this == SRC_3 || this == SRC_4;
    }
}
