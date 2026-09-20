package com.busmate.routeschedule.community.dto;

/** A contributor's history so far, for the reviewer's context (INC-031). */
public record ContributorTrackRecord(long approved, long rejected) {
}
