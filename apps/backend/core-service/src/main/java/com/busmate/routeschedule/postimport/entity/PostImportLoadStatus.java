package com.busmate.routeschedule.postimport.entity;

public enum PostImportLoadStatus {
    /** Nothing from this draft has been loaded yet — reading and reviewing, staff may still be editing it. */
    NOT_LOADED,
    /** Approve has run; {@code loadResult} says what happened, row by row. Loading again changes nothing new. */
    LOADED,
}
