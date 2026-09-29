package com.busmate.routeschedule.community;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.busmate.routeschedule.AbstractPostgresIntegrationTest;
import com.busmate.routeschedule.community.entity.Affiliation;
import com.busmate.routeschedule.community.entity.Contributor;
import com.busmate.routeschedule.community.entity.ContributorLevel;
import com.busmate.routeschedule.community.entity.ContributorStatus;
import com.busmate.routeschedule.community.repository.ContributorRepository;
import com.busmate.routeschedule.network.entity.RouteGroup;
import com.busmate.routeschedule.scheduling.entity.Schedule;
import com.busmate.routeschedule.support.OperationsFixtures;
import com.jayway.jsonpath.JsonPath;

import jakarta.persistence.EntityManager;

/** A contributor proposes who usually works a departure; it is reviewed like a stop (ADR-026, INC-052). */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@TestPropertySource(properties = "community.proposals.daily-cap=3")
@DisplayName("INC-052 contributors propose workings")
class WorkingProposalIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private OperationsFixtures fx;
    @Autowired private ContributorRepository contributors;
    @Autowired private EntityManager em;

    private MockMvc mvc;
    private final UUID mot = UUID.randomUUID();
    private final UUID proposer = UUID.randomUUID();
    private final UUID steward = UUID.randomUUID();
    private final UUID otherSteward = UUID.randomUUID();
    private final UUID outsider = UUID.randomUUID();
    private RouteGroup corridor;
    private RouteGroup elsewhere;
    private Schedule schedule;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        corridor = fx.routeGroup();
        elsewhere = fx.routeGroup();
        schedule = fx.schedule(fx.route(corridor));
        contributor(proposer, null);
        contributor(steward, corridor);
        contributor(otherSteward, elsewhere);
        em.flush();
    }

    private static RequestPostProcessor as(UUID id, String role) {
        return user(id.toString()).roles(role);
    }

    private void contributor(UUID id, RouteGroup stewardOf) {
        Contributor c = new Contributor();
        c.setUserId(id);
        c.setStatus(ContributorStatus.ACTIVE);
        c.setMotivation("m");
        c.setAffiliation(Affiliation.NONE);
        c.setAgreementVersion("draft-1");
        c.setAgreementAcceptedAt(Instant.now());
        c.setAppliedAt(Instant.now().minusSeconds(86_400L * 60));
        c.setDecidedAt(Instant.now().minusSeconds(86_400L * 60));
        if (stewardOf != null) {
            c.setLevel(ContributorLevel.STEWARD);
            c.getStewardScopeRouteGroupIds().add(stewardOf.getId());
            c.setStewardAppointedBy(mot);
            c.setStewardAppointedAt(Instant.now());
        }
        contributors.save(c);
    }

    private String body(Schedule s, String extra) {
        return "{\"scheduleId\":\"" + s.getId() + "\",\"operatorNameObserved\":\"Sample Express\","
                + "\"platesObserved\":[\"AA-1111\",\"AA-1112\"],\"observedOn\":\"2026-09-01\","
                + "\"observationMethod\":\"RODE_THE_ROUTE\"" + extra + "}";
    }

    private org.springframework.test.web.servlet.ResultActions propose(UUID by, String json) throws Exception {
        return mvc.perform(post("/api/community/working-proposals").with(as(by, "PASSENGER"))
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private String proposed(UUID by, Schedule s) throws Exception {
        String res = propose(by, body(s, "")).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(res, "$.id");
    }

    private org.springframework.test.web.servlet.ResultActions workings(Schedule s) throws Exception {
        return mvc.perform(get("/api/schedules/" + s.getId() + "/workings").with(as(mot, "MOT")));
    }

    @Test
    @DisplayName("INC-052 an active contributor proposes; nothing is written to the schedule until it is approved")
    void inc052_proposeWritesNothing() throws Exception {
        propose(proposer, body(schedule, ""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.entityType").value("SCHEDULE_WORKING"))
                .andExpect(jsonPath("$.action").value("CREATE"))
                .andExpect(jsonPath("$.targetId").value(schedule.getId().toString()))
                .andExpect(jsonPath("$.status").value("PENDING"));
        workings(schedule).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("INC-052 someone who is not an active contributor is refused, and an empty claim is too")
    void inc052_refusals() throws Exception {
        propose(outsider, body(schedule, "")).andExpect(status().isForbidden());
        propose(proposer, "{\"scheduleId\":\"" + schedule.getId() + "\",\"observedOn\":\"2026-09-01\",\"observationMethod\":\"OTHER\"}")
                .andExpect(status().isBadRequest());
        propose(proposer, body(schedule, ",\"observedOn\":\"2999-01-01\"")).andExpect(status().isBadRequest());
        propose(proposer, body(schedule, "").replace(schedule.getId().toString(), UUID.randomUUID().toString()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("INC-052 one pending proposal per departure per contributor")
    void inc052_onePending() throws Exception {
        proposed(proposer, schedule);
        propose(proposer, body(schedule, "")).andExpect(status().isConflict());
    }

    @Test
    @DisplayName("INC-052 the daily cap counts stop and working proposals together")
    void inc052_capIsShared() throws Exception {
        proposed(proposer, schedule);
        proposed(proposer, fx.schedule(fx.route(corridor)));
        proposed(proposer, fx.schedule(fx.route(corridor)));
        propose(proposer, body(fx.schedule(fx.route(corridor)), "")).andExpect(status().isConflict());
    }

    @Test
    @DisplayName("INC-052 a steward sees it only in their corridor, and never who proposed it")
    void inc052_stewardScope() throws Exception {
        String id = proposed(proposer, schedule);

        mvc.perform(get("/api/community/changesets?status=PENDING&entityType=SCHEDULE_WORKING").with(as(steward, "PASSENGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].changeset.proposerUserId").doesNotExist());
        mvc.perform(get("/api/community/changesets?status=PENDING").with(as(otherSteward, "PASSENGER")))
                .andExpect(jsonPath("$.content.length()").value(0));
        mvc.perform(get("/api/community/changesets/" + id + "/review").with(as(otherSteward, "PASSENGER")))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/community/changesets/" + id + "/approve").with(as(otherSteward, "PASSENGER")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/community/changesets?status=PENDING&entityType=STOP").with(as(mot, "MOT")))
                .andExpect(jsonPath("$.content.length()").value(0)); // the type filter works
    }

    @Test
    @DisplayName("INC-052 the reviewer sees the departure and who is already recorded on it")
    void inc052_reviewerContext() throws Exception {
        mvc.perform(post("/api/schedules/" + schedule.getId() + "/workings").with(as(mot, "MOT"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"operatorNameObserved\":\"Existing Travels\"}"))
                .andExpect(status().isCreated());
        String id = proposed(proposer, schedule);

        mvc.perform(get("/api/community/changesets/" + id + "/review").with(as(steward, "PASSENGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scheduleContext.scheduleId").value(schedule.getId().toString()))
                .andExpect(jsonPath("$.scheduleContext.currentWorkings[0].operatorNameObserved").value("Existing Travels"))
                .andExpect(jsonPath("$.currentStop").doesNotExist());
    }

    @Test
    @DisplayName("INC-052 approval writes the working as observed, with the plates, and passengers can then see it")
    void inc052_approvalWritesIt() throws Exception {
        String id = proposed(proposer, schedule);

        mvc.perform(post("/api/community/changesets/" + id + "/approve").with(as(steward, "PASSENGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        workings(schedule)
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].operatorNameObserved").value("Sample Express"))
                .andExpect(jsonPath("$[0].operatorResolved").value(false))
                .andExpect(jsonPath("$[0].vehicles.length()").value(2))
                .andExpect(jsonPath("$[0].trust.label").value("OBSERVED"));
    }

    @Test
    @DisplayName("INC-052 a same-operator overlap stops the approval and leaves the proposal pending")
    void inc052_overlapStopsApproval() throws Exception {
        mvc.perform(post("/api/schedules/" + schedule.getId() + "/workings").with(as(mot, "MOT"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"operatorNameObserved\":\"Sample Express\"}"))
                .andExpect(status().isCreated());
        String id = proposed(proposer, schedule);

        mvc.perform(post("/api/community/changesets/" + id + "/approve").with(as(mot, "MOT")))
                .andExpect(status().isConflict());
        mvc.perform(get("/api/community/changesets/" + id + "/review").with(as(mot, "MOT")))
                .andExpect(jsonPath("$.changeset.status").value("PENDING"));
        workings(schedule).andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("INC-052 rejection tells the contributor why; withdrawing works; an approved working is not revertible")
    void inc052_rejectWithdrawRevert() throws Exception {
        String rejected = proposed(proposer, schedule);
        mvc.perform(post("/api/community/changesets/" + rejected + "/reject").with(as(steward, "PASSENGER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"NOT_A_STOP\"}"))
                .andExpect(status().isBadRequest()); // a stop-only reason
        mvc.perform(post("/api/community/changesets/" + rejected + "/reject").with(as(steward, "PASSENGER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"DUPLICATE\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("REJECTED"));
        mvc.perform(get("/api/community/changesets/mine").with(as(proposer, "PASSENGER")))
                .andExpect(jsonPath("$.content[0].entityType").value("SCHEDULE_WORKING"))
                .andExpect(jsonPath("$.content[0].decisionReason").value("Already recorded for this departure"));

        String withdrawn = proposed(proposer, schedule);
        mvc.perform(post("/api/community/changesets/" + withdrawn + "/withdraw").with(as(proposer, "PASSENGER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("WITHDRAWN"));

        String approved = proposed(proposer, schedule);
        mvc.perform(post("/api/community/changesets/" + approved + "/approve").with(as(mot, "MOT"))).andExpect(status().isOk());
        mvc.perform(post("/api/community/changesets/" + approved + "/revert").with(as(mot, "MOT"))).andExpect(status().isConflict());
        assertThat(JsonPath.<Integer>read(workings(schedule).andReturn().getResponse().getContentAsString(), "$.length()")).isEqualTo(1);
    }
}
