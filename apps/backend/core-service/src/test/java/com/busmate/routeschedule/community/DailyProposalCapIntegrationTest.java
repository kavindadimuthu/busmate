package com.busmate.routeschedule.community;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.busmate.routeschedule.AbstractPostgresIntegrationTest;
import com.busmate.routeschedule.community.entity.Affiliation;
import com.busmate.routeschedule.community.entity.Contributor;
import com.busmate.routeschedule.community.entity.ContributorStatus;
import com.busmate.routeschedule.community.repository.ContributorRepository;

/** A tight daily cap, so the limit itself can be exercised without proposing hundreds of stops. */
@SpringBootTest(properties = "community.proposals.daily-cap=2")
@ActiveProfiles("test")
@Transactional
@DisplayName("INC-030 daily proposal cap")
class DailyProposalCapIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private ContributorRepository contributors;

    private MockMvc mvc;
    private final UUID contributor = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        Contributor c = new Contributor();
        c.setUserId(contributor);
        c.setStatus(ContributorStatus.ACTIVE);
        c.setMotivation("m");
        c.setAffiliation(Affiliation.NONE);
        c.setAgreementVersion("draft-1");
        c.setAgreementAcceptedAt(Instant.now());
        c.setAppliedAt(Instant.now());
        contributors.saveAndFlush(c);
    }

    private String proposalJson(String name, double lat, double lng) {
        return "{\"name\":\"" + name + "\",\"location\":{\"latitude\":" + lat + ",\"longitude\":" + lng
                + ",\"city\":\"Test\",\"country\":\"Sri Lanka\"},"
                + "\"observedOn\":\"2026-09-01\",\"observationMethod\":\"RODE_THE_ROUTE\"}";
    }

    @Test
    @DisplayName("INC-030 a contributor is refused once they hit today's cap")
    void inc030_dailyCapIsEnforced() throws Exception {
        for (int i = 0; i < 2; i++) {
            mvc.perform(post("/api/community/stop-proposals").with(user(contributor.toString()).roles("PASSENGER"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(proposalJson("Stop " + i, 6.8 + i * 0.01, 79.9 + i * 0.01)))
                    .andExpect(status().isCreated());
        }
        mvc.perform(post("/api/community/stop-proposals").with(user(contributor.toString()).roles("PASSENGER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(proposalJson("Stop 3", 6.83, 79.93)))
                .andExpect(status().isConflict());
    }
}
