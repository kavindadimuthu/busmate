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
}
