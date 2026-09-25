package com.busmate.routeschedule.network.enums;

/**
 * Whether a route's recorded stops are all of its stops (ADR-023). Only a person asserts anything but
 * {@code UNKNOWN}: nothing infers it, and existing routes stay {@code UNKNOWN} until an owner who knows says
 * otherwise.
 */
public enum StopListCompletenessEnum {
    /** Every stop between the endpoints is recorded. */
    COMPLETE,
    /** Some stops are recorded and more are known to exist. */
    PARTIAL,
    /** Nobody has said either way. */
    UNKNOWN
}
