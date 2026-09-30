package com.busmate.routeschedule.community;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import com.busmate.routeschedule.community.dto.MyContributorStandingResponse.CannotApplyReason;
import com.busmate.routeschedule.community.service.ApplicantAccountRule;
import com.busmate.routeschedule.shared.client.AccountDirectory.Account;

@DisplayName("INC-078 applicant account rule")
class ApplicantAccountRuleTest {

    private static MockEnvironment profile(String... profiles) {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles(profiles);
        return env;
    }

    private static Account account(String status, Boolean verified) {
        return new Account(UUID.randomUUID(), "passenger", status, verified);
    }

    private final ApplicantAccountRule strict = new ApplicantAccountRule(true, profile("dev"));
    private final ApplicantAccountRule relaxed = new ApplicantAccountRule(false, profile("dev"));

    @Test
    @DisplayName("INC-078 by default an applicant needs an active account and a verified email")
    void inc078_strictByDefault() {
        assertThat(strict.requiresVerifiedAccount()).isTrue();
        assertThat(strict.check(account("active", true))).isNull();
        assertThat(strict.check(account("active", false))).isEqualTo(CannotApplyReason.EMAIL_NOT_VERIFIED);
        assertThat(strict.check(account("active", null))).isEqualTo(CannotApplyReason.EMAIL_NOT_VERIFIED);
        assertThat(strict.check(account("pending", false))).isEqualTo(CannotApplyReason.ACCOUNT_NOT_ACTIVE);
        assertThat(strict.check(account("pending", true))).isEqualTo(CannotApplyReason.ACCOUNT_NOT_ACTIVE);
    }

    @Test
    @DisplayName("INC-078 relaxed, an unverified email and a pending account may apply")
    void inc078_relaxedLiftsVerificationOnly() {
        assertThat(relaxed.requiresVerifiedAccount()).isFalse();
        assertThat(relaxed.check(account("pending", false))).isNull();
        assertThat(relaxed.check(account("active", false))).isNull();
        assertThat(relaxed.check(account("active", true))).isNull();
    }

    @Test
    @DisplayName("INC-078 relaxed or not, a suspended, deactivated, unknown or missing account is refused")
    void inc078_blockedAccountsStayBlocked() {
        for (ApplicantAccountRule rule : new ApplicantAccountRule[] {strict, relaxed}) {
            assertThat(rule.check(account("suspended", true))).isEqualTo(CannotApplyReason.ACCOUNT_NOT_ACTIVE);
            assertThat(rule.check(account("deactivated", true))).isEqualTo(CannotApplyReason.ACCOUNT_NOT_ACTIVE);
            assertThat(rule.check(account("something-new", true))).isEqualTo(CannotApplyReason.ACCOUNT_NOT_ACTIVE);
            assertThat(rule.check(account(null, true))).isEqualTo(CannotApplyReason.ACCOUNT_NOT_ACTIVE);
            assertThat(rule.check(null)).isEqualTo(CannotApplyReason.ACCOUNT_NOT_ACTIVE);
        }
    }

    @Test
    @DisplayName("INC-078 production refuses to start with the rule relaxed, and starts normally with it strict")
    void inc078_productionRefusesRelaxedRule() {
        assertThatThrownBy(() -> new ApplicantAccountRule(false, profile("prod")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("production must require a verified account");
        assertThat(new ApplicantAccountRule(true, profile("prod")).requiresVerifiedAccount()).isTrue();
        assertThat(new ApplicantAccountRule(false, new MockEnvironment()).requiresVerifiedAccount()).isFalse();
    }
}
