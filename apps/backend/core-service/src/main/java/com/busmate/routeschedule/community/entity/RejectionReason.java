package com.busmate.routeschedule.community.entity;

/** The short list a reviewer picks from when rejecting a proposal (INC-031). */
public enum RejectionReason {
    DUPLICATE("Duplicate of an existing stop"),
    WRONG_POSITION("Position is wrong"),
    CANNOT_VERIFY("Can't verify this"),
    NOT_A_STOP("Not a real stop"),
    OTHER("Other");

    private final String label;

    RejectionReason(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    /** Whether this reason can be given for a proposal about this kind of record. */
    public boolean appliesTo(ChangesetEntityType type) {
        return type == ChangesetEntityType.STOP || this == DUPLICATE || this == CANNOT_VERIFY || this == OTHER;
    }

    /** The wording the contributor sees; the stop wording would read wrongly for anything else. */
    public String label(ChangesetEntityType type) {
        if (type == ChangesetEntityType.STOP) {
            return label;
        }
        return this == DUPLICATE ? "Already recorded for this departure" : label;
    }
}
