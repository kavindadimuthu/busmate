package com.busmate.routeschedule.community.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

import com.busmate.routeschedule.community.dto.MyContributorStandingResponse.CannotApplyReason;
import com.busmate.routeschedule.shared.client.AccountDirectory;

import lombok.extern.slf4j.Slf4j;

/**
 * What a passenger's account must be before they may apply to contribute (INC-029, relaxable by INC-078).
 *
 * <p>The rule is an active account with a verified email. Email verification needs outgoing email, which isn't set up
 * yet, so until it is nobody new can reach that state and the application flow can't be tried by hand.
 * {@code community.applications.require-verified-account=false} lifts exactly those two conditions: an unverified
 * email, and an account still {@code pending} because it was never verified. A suspended or deactivated account, a
 * staff account and an account that can't be looked up are refused either way.
 *
 * <p>Production refuses to start with the rule relaxed, so it can't reach real contributors by a forgotten setting.
 */
@Slf4j
@Component
public class ApplicantAccountRule {

    private static final String ACTIVE = "active";
    private static final String PENDING = "pending";

    private final boolean requireVerified;

    public ApplicantAccountRule(
            @Value("${community.applications.require-verified-account:true}") boolean requireVerified,
            Environment environment) {
        if (!requireVerified && environment.acceptsProfiles(Profiles.of("prod"))) {
            throw new IllegalStateException(
                    "Refusing to start: community.applications.require-verified-account=false lets people with an "
                            + "unverified email apply to contribute. It is for local testing before email is set up; "
                            + "production must require a verified account.");
        }
        if (!requireVerified) {
            log.warn("[INC-078] Contributor applications do NOT require a verified email or active account. Local testing only.");
        }
        this.requireVerified = requireVerified;
    }

    public boolean requiresVerifiedAccount() {
        return requireVerified;
    }

    /** Why this account can't apply yet, or null when it may. {@code account} is null when user-service has no such user. */
    public CannotApplyReason check(AccountDirectory.Account account) {
        if (account == null) {
            return CannotApplyReason.ACCOUNT_NOT_ACTIVE;
        }
        String status = account.accountStatus();
        boolean usable = ACTIVE.equals(status) || (!requireVerified && PENDING.equals(status));
        if (!usable) {
            return CannotApplyReason.ACCOUNT_NOT_ACTIVE;
        }
        if (requireVerified && !Boolean.TRUE.equals(account.emailVerified())) {
            return CannotApplyReason.EMAIL_NOT_VERIFIED;
        }
        return null;
    }
}
