package com.busmate.routeschedule.scheduling.enums;

/**
 * How much of a schedule's timetable is known (ADR-023). Only a person asserts anything but {@code UNKNOWN}.
 * Trip generation still needs a departure and an arrival, so an {@code ORIGIN_ONLY} schedule is shown to
 * passengers but generates no trips.
 */
public enum TimingCompletenessEnum {
    /** Every stop of the route has a time. */
    ALL_STOPS,
    /** Only the first and last stops have times. */
    ENDPOINTS_ONLY,
    /** Only the departure from the first stop is known. */
    ORIGIN_ONLY,
    /** Nobody has said. */
    UNKNOWN
}
