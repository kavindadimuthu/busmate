package com.busmate.routeschedule.shared.provenance;

/**
 * How far a passenger should trust a displayed value ([05 §6](trust and data policy)). Keys travel over
 * the wire; each app supplies its own wording, so translating never touches the server.
 */
public enum TrustLabel {
    /** Issued by the authority. */
    OFFICIAL,
    /** From an operator's own timetable. */
    OPERATOR_TIMETABLE,
    /** Field observation by BusMate or an accepted contributor — not official. */
    OBSERVED,
    /** Reported and not yet verified. */
    REPORTED,
    /** Calculated or inferred, not observed. */
    ESTIMATED,
    /** From a live vehicle position. */
    LIVE
}
