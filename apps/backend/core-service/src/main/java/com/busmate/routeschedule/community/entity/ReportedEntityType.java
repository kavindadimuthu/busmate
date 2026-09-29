package com.busmate.routeschedule.community.entity;

/** What a passenger's report is about (INC-056). Not a {@link ChangesetEntityType}: a report proposes
 * nothing, it only says something is wrong. */
public enum ReportedEntityType {
    SCHEDULE,
    SCHEDULE_WORKING
}
