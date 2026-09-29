package com.busmate.routeschedule.community.entity;

/** Why a passenger says something is wrong (INC-056). Short list; free text lives in the note. */
public enum ReportReason {
    WRONG_TIME,
    WRONG_DAYS,
    BUS_DID_NOT_COME,
    WRONG_OPERATOR_OR_PLATE,
    OTHER;

    /**
     * Whether this reason makes sense for what was reported. A time or a day means the departure itself
     * ({@code SCHEDULE}); who runs it can be reported either against the departure as a whole — most
     * passengers cannot say which of several alternating vehicles they mean — or, once something can name
     * one, against that specific {@code SCHEDULE_WORKING}.
     */
    public boolean appliesTo(ReportedEntityType type) {
        if (this == WRONG_TIME || this == WRONG_DAYS || this == BUS_DID_NOT_COME) {
            return type == ReportedEntityType.SCHEDULE;
        }
        return true; // WRONG_OPERATOR_OR_PLATE and OTHER fit either
    }
}
