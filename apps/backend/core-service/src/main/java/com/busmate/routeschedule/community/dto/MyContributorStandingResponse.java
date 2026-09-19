package com.busmate.routeschedule.community.dto;

/**
 * Where the signed-in user stands. {@code status} is NONE when they have never applied;
 * {@code cannotApplyReason} says why the application form is closed to them, if it is.
 */
public record MyContributorStandingResponse(
        String status,
        boolean activeContributor,
        boolean canApply,
        CannotApplyReason cannotApplyReason,
        ContributorResponse contributor) {

    public enum CannotApplyReason {
        NOT_A_PASSENGER, EMAIL_NOT_VERIFIED, ACCOUNT_NOT_ACTIVE, ALREADY_APPLIED, ALREADY_CONTRIBUTOR, SUSPENDED
    }
}
