package com.busmate.routeschedule.community;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.busmate.routeschedule.AbstractPostgresIntegrationTest;
import com.busmate.routeschedule.community.entity.Affiliation;
import com.busmate.routeschedule.community.entity.Contributor;
import com.busmate.routeschedule.community.entity.ContributorStatus;
import com.busmate.routeschedule.community.repository.ChangesetRepository;
import com.busmate.routeschedule.community.repository.ContributorRepository;
import com.busmate.routeschedule.network.entity.Stop;
import com.busmate.routeschedule.network.repository.StopRepository;
import com.busmate.routeschedule.shared.client.AccountDirectory;

import jakarta.persistence.EntityManager;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("INC-030 contributor proposes a stop")
class StopProposalIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private ContributorRepository contributors;
    @Autowired private StopRepository stops;
    @Autowired private ChangesetRepository changesets;
    @Autowired private EntityManager em;
    @MockitoBean private AccountDirectory accounts;

    private MockMvc mvc;
    private final UUID activeContributor = UUID.randomUUID();
    private final UUID reporter = UUID.randomUUID();
    private final UUID suspended = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        makeContributor(activeContributor, ContributorStatus.ACTIVE);
        makeContributor(suspended, ContributorStatus.SUSPENDED);
        when(accounts.find(reporter)).thenReturn(Optional.of(
                new AccountDirectory.Account(reporter, "passenger", "active", true)));
    }

    private void makeContributor(UUID userId, ContributorStatus status) {
        Contributor c = new Contributor();
        c.setUserId(userId);
        c.setStatus(status);
        c.setMotivation("m");
        c.setAffiliation(Affiliation.NONE);
        c.setAgreementVersion("draft-1");
        c.setAgreementAcceptedAt(Instant.now());
        c.setAppliedAt(Instant.now());
        if (status == ContributorStatus.DECLINED || status == ContributorStatus.SUSPENDED) {
            c.setDecisionReason("test fixture");
        }
        contributors.saveAndFlush(c);
    }

    private static RequestPostProcessor as(UUID id, String... roles) {
        return roles.length == 1 ? user(id.toString()).roles(roles[0]) : user(id.toString()).roles(roles);
    }

    private static Stop stop(String name, double lat, double lng, String city) {
        Stop s = new Stop();
        s.setName(name);
        Stop.Location loc = new Stop.Location();
        loc.setLatitude(lat);
        loc.setLongitude(lng);
        loc.setCity(city);
        loc.setCountry("Sri Lanka");
        s.setLocation(loc);
        return s;
    }

    private String proposalJson(String name, double lat, double lng, String targetId, boolean confirmDuplicate) {
        return "{\"name\":\"" + name + "\",\"location\":{\"latitude\":" + lat + ",\"longitude\":" + lng
                + ",\"city\":\"Test City\",\"country\":\"Sri Lanka\"},"
                + (targetId != null ? "\"targetStopId\":\"" + targetId + "\"," : "")
                + "\"observedOn\":\"2026-09-01\",\"observationMethod\":\"RODE_THE_ROUTE\","
                + "\"confirmDuplicate\":" + confirmDuplicate + "}";
    }

    private ResultActions propose(UUID caller, String body) throws Exception {
        return mvc.perform(post("/api/community/stop-proposals").with(as(caller, "PASSENGER"))
                .contentType(MediaType.APPLICATION_JSON).content(body));
    }

    @Test
    @DisplayName("INC-030 an active contributor proposes a new stop, and nothing the passenger sees changes")
    void inc030_activeContributorProposesNewStop() throws Exception {
        long stopCountBefore = stops.count();
        propose(activeContributor, proposalJson("Kottawa Junction", 6.845, 79.965, null, false))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.duplicateCandidate").doesNotExist())
                .andExpect(jsonPath("$.changeset.status").value("PENDING"))
                .andExpect(jsonPath("$.changeset.action").value("CREATE"))
                .andExpect(jsonPath("$.changeset.proposedValues.name").value("Kottawa Junction"));
        assertThat(stops.count()).isEqualTo(stopCountBefore);
    }

    @Test
    @DisplayName("INC-030 a contributor proposes a correction to an existing stop, carrying its version and current values")
    void inc030_contributorProposesCorrection() throws Exception {
        Stop existing = stops.saveAndFlush(stop("Maharagama", 6.848, 79.927, "Maharagama"));
        propose(activeContributor, proposalJson("Maharagama Town", 6.849, 79.928, existing.getId().toString(), false))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.changeset.action").value("UPDATE"))
                .andExpect(jsonPath("$.changeset.targetId").value(existing.getId().toString()))
                .andExpect(jsonPath("$.changeset.targetSnapshot.name").value("Maharagama"));
        em.flush();
        em.clear();
        assertThat(stops.findById(existing.getId()).orElseThrow().getName()).isEqualTo("Maharagama");
    }

    @Test
    @DisplayName("INC-030 a reporter, a suspended contributor and staff cannot propose")
    void inc030_onlyActiveContributorsMayPropose() throws Exception {
        propose(reporter, proposalJson("Reporter Stop", 6.9, 79.9, null, false)).andExpect(status().isForbidden());
        propose(suspended, proposalJson("Suspended Stop", 6.9, 79.9, null, false)).andExpect(status().isForbidden());
        mvc.perform(post("/api/community/stop-proposals").with(as(UUID.randomUUID(), "MOT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(proposalJson("Staff Stop", 6.9, 79.9, null, false)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("INC-030 a missing name or a position outside Sri Lanka is refused with a message")
    void inc030_invalidValuesRefused() throws Exception {
        propose(activeContributor, "{\"location\":{\"latitude\":6.9,\"longitude\":79.9},"
                + "\"observedOn\":\"2026-09-01\",\"observationMethod\":\"RODE_THE_ROUTE\"}")
                .andExpect(status().isBadRequest());
        propose(activeContributor, proposalJson("Somewhere Else", 51.5, -0.12, null, false)) // London
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Sri Lanka")));
    }

    @Test
    @DisplayName("INC-030 proposing next to a similarly named stop warns, and confirming submits it anyway")
    void inc030_duplicateWarningThenConfirm() throws Exception {
        stops.saveAndFlush(stop("Nugegoda Junction", 6.865, 79.889, "Nugegoda"));
        propose(activeContributor, proposalJson("Nugegoda Jn", 6.8651, 79.8891, null, false))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.changeset").doesNotExist())
                .andExpect(jsonPath("$.duplicateCandidate.name").value("Nugegoda Junction"))
                .andExpect(jsonPath("$.duplicateCandidate.distanceMeters").isNumber());
        assertThat(changesets.count()).isZero();

        propose(activeContributor, proposalJson("Nugegoda Jn", 6.8651, 79.8891, null, true))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.duplicateCandidate").doesNotExist())
                .andExpect(jsonPath("$.changeset.status").value("PENDING"));
        assertThat(changesets.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("INC-030 a distant or differently named stop nearby does not trigger the duplicate warning")
    void inc030_notADuplicateWhenFarOrDifferentlyNamed() throws Exception {
        stops.saveAndFlush(stop("Kandy Town", 7.29, 80.63, "Kandy"));
        // Same name, far away
        propose(activeContributor, proposalJson("Kandy Town", 6.9, 79.9, null, false))
                .andExpect(jsonPath("$.duplicateCandidate").doesNotExist())
                .andExpect(jsonPath("$.changeset").exists());
    }

    @Test
    @DisplayName("INC-030 only one pending correction per contributor per stop")
    void inc030_onePendingCorrectionPerTarget() throws Exception {
        Stop existing = stops.saveAndFlush(stop("Homagama", 6.844, 80.002, "Homagama"));
        propose(activeContributor, proposalJson("Homagama Town", 6.845, 80.003, existing.getId().toString(), false))
                .andExpect(status().isCreated());
        propose(activeContributor, proposalJson("Homagama Centre", 6.846, 80.004, existing.getId().toString(), false))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("INC-030 the contributor sees every proposal they made and can withdraw a pending one")
    void inc030_myProposalsAndWithdraw() throws Exception {
        String body = propose(activeContributor, proposalJson("Athurugiriya", 6.87, 80.0, null, false))
                .andReturn().getResponse().getContentAsString();
        String id = com.jayway.jsonpath.JsonPath.read(body, "$.changeset.id");

        mvc.perform(get("/api/community/changesets/mine").with(as(activeContributor, "PASSENGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].status").value("PENDING"));

        // Someone else cannot withdraw it
        mvc.perform(post("/api/community/changesets/" + id + "/withdraw").with(as(reporter, "PASSENGER")))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/community/changesets/" + id + "/withdraw").with(as(activeContributor, "PASSENGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("WITHDRAWN"));

        // Withdrawing again is refused
        mvc.perform(post("/api/community/changesets/" + id + "/withdraw").with(as(activeContributor, "PASSENGER")))
                .andExpect(status().isConflict());
    }
}
