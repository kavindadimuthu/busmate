package com.busmate.routeschedule.community.dto;

/**
 * Either the proposal was created ({@code changeset} set), or a similarly named stop already
 * exists nearby and the contributor needs to confirm before it is ({@code duplicateCandidate} set,
 * nothing created). Never both.
 */
public record ProposeStopResponse(ChangesetResponse changeset, DuplicateStopCandidate duplicateCandidate) {
}
