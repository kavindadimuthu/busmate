package com.busmate.routeschedule.postimport.dto;

public enum RowAction {
    /** Load this row when the draft is approved. */
    LOAD,
    /** Never load this row — the AI invented it, or it isn't worth recording. */
    SKIP,
}
