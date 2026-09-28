package com.busmate.routeschedule.postimport.entity;

public enum PostImportDraftStatus {
    /** The AI answered in the expected shape; the checks have been run and are shown to staff. */
    READ,
    /** The AI's answer did not fit the expected shape at all — nothing is shown as a partial table. */
    FAILED,
}
