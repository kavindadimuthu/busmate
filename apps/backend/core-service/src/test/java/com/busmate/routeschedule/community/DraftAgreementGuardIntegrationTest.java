package com.busmate.routeschedule.community;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.busmate.routeschedule.AbstractPostgresIntegrationTest;
import com.busmate.routeschedule.community.entity.Affiliation;
import com.busmate.routeschedule.community.entity.Contributor;
import com.busmate.routeschedule.community.entity.ContributorStatus;
import com.busmate.routeschedule.community.repository.ContributorRepository;
import com.busmate.routeschedule.community.service.ContributorService;
import com.busmate.routeschedule.shared.exception.ConflictException;
import com.busmate.routeschedule.shared.security.Caller;

/** The production default: with the draft agreement in force, nobody can be accepted. */
@SpringBootTest(properties = "community.agreement.allow-draft-acceptance=false")
@ActiveProfiles("test")
@Transactional
@DisplayName("INC-029 draft agreement guard")
class DraftAgreementGuardIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired private ContributorService service;
    @Autowired private ContributorRepository contributors;

    @Test
    @DisplayName("INC-029 no one can be accepted while the agreement is still a draft")
    void inc029_draftAgreementBlocksAcceptance() {
        Contributor c = new Contributor();
        c.setUserId(UUID.randomUUID());
        c.setStatus(ContributorStatus.APPLIED);
        c.setMotivation("m");
        c.setAffiliation(Affiliation.NONE);
        c.setAgreementVersion("draft-1");
        c.setAgreementAcceptedAt(Instant.now());
        c.setAppliedAt(Instant.now());
        contributors.saveAndFlush(c);
        Caller mot = new Caller(UUID.randomUUID(), java.util.Set.of(Caller.MOT));
        assertThatThrownBy(() -> service.accept(mot, c.getUserId()))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("still a draft");
        assertThat(contributors.findById(c.getUserId()).orElseThrow().getStatus()).isEqualTo(ContributorStatus.APPLIED);
    }
}
