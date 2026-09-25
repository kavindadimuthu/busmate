package com.busmate.routeschedule.community.entity;

/** What kind of network record a changeset proposes to change (ADR-018, ADR-026). */
public enum ChangesetEntityType {
    STOP,
    /** A new "who usually works this departure" claim; the changeset's target is the schedule. Create only. */
    SCHEDULE_WORKING
}
