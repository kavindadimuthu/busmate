package com.busmate.routeschedule.community;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
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

/** A contributor corrects a working already on record, or says it has stopped (INC-058, ADR-027). */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("INC-058 contributors correct or end a working")
class WorkingCorrectionIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private OperationsFixtures fx;
    @Autowired private ContributorRepository contributors;
    @Autowired private EntityManager em;

    private MockMvc mvc;
    private final UUID mot = UUID.randomUUID();
    private final UUID proposer = UUID.randomUUID();
    private final UUID steward = UUID.randomUUID();
    private final UUID otherSteward = UUID.randomUUID();
    private RouteGroup corridor;
    private RouteGroup elsewhere;
    private Schedule schedule;
    private String workingId;

    @BeforeEach
    void setUp() throws Exception {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        corridor = fx.routeGroup();
        elsewhere = fx.routeGroup();
        schedule = fx.schedule(fx.route(corridor));
        contributor(proposer, null);
        contributor(steward, corridor);
        contributor(otherSteward, elsewhere);
        em.flush();

        String res = mvc.perform(post("/api/schedules/" + schedule.getId() + "/workings").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"operatorNameObserved\":\"Original Travels\",\"vehicles\":[{\"plateObserved\":\"AA-1111\"}]}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        workingId = JsonPath.read(res, "$.id");
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

    private String body(String extra) {
        return "{\"targetWorkingId\":\"" + workingId + "\",\"observedOn\":\"2026-09-01\",\"observationMethod\":\"RODE_THE_ROUTE\"" + extra + "}";
    }

    private org.springframework.test.web.servlet.ResultActions propose(UUID by, String json) throws Exception {
        return mvc.perform(post("/api/community/working-corrections").with(as(by, "PASSENGER"))
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    @Test
    @DisplayName("INC-058 a contributor proposes a correction; nothing changes until it is approved")
    void inc058_proposeWritesNothing() throws Exception {
        propose(proposer, body(",\"operatorNameObserved\":\"Corrected Travels\""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.entityType").value("SCHEDULE_WORKING"))
                .andExpect(jsonPath("$.action").value("UPDATE"))
                .andExpect(jsonPath("$.targetId").value(workingId))
                .andExpect(jsonPath("$.status").value("PENDING"));

        mvc.perform(get("/api/schedules/" + schedule.getId() + "/workings").with(as(mot, "MOT")))
                .andExpect(jsonPath("$[0].operatorNameObserved").value("Original Travels"));
    }

    @Test
    @DisplayName("INC-058 the merged proposal keeps what the contributor didn't mention")
    void inc058_mergedProposalKeepsUntouchedFields() throws Exception {
        String res = propose(proposer, body(",\"platesObserved\":[\"BB-2222\"]"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String id = JsonPath.read(res, "$.id");

        mvc.perform(get("/api/community/changesets/" + id + "/review").with(as(mot, "MOT")))
                .andExpect(jsonPath("$.changeset.proposedValues.operatorNameObserved").value("Original Travels"))
                .andExpect(jsonPath("$.changeset.proposedValues.platesObserved[0]").value("BB-2222"));
    }

    @Test
    @DisplayName("INC-058 a correction refuses to say nothing, targets an unknown working, or duplicates a pending one")
    void inc058_refusals() throws Exception {
        propose(proposer, body("")).andExpect(status().isBadRequest());
        propose(proposer, "{\"targetWorkingId\":\"" + UUID.randomUUID() + "\",\"operatorNameObserved\":\"X\","
                        + "\"observedOn\":\"2026-09-01\",\"observationMethod\":\"OTHER\"}")
                .andExpect(status().isNotFound());
        propose(proposer, body(",\"operatorNameObserved\":\"X\"")).andExpect(status().isCreated());
        propose(proposer, body(",\"operatorNameObserved\":\"Y\"")).andExpect(status().isConflict());
    }

    @Test
    @DisplayName("INC-058 a steward sees it only in their corridor — the working's schedule's route group")
    void inc058_stewardScope() throws Exception {
        propose(proposer, body(",\"operatorNameObserved\":\"Corrected Travels\"")).andExpect(status().isCreated());

        mvc.perform(get("/api/community/changesets?status=PENDING&entityType=SCHEDULE_WORKING").with(as(steward, "PASSENGER")))
                .andExpect(jsonPath("$.content.length()").value(1));
        mvc.perform(get("/api/community/changesets?status=PENDING").with(as(otherSteward, "PASSENGER")))
                .andExpect(jsonPath("$.content.length()").value(0));
    }

    @Test
    @DisplayName("INC-058 approval writes the correction through the same capability staff use")
    void inc058_approvalWritesTheCorrection() throws Exception {
        String res = propose(proposer, body(",\"operatorNameObserved\":\"Corrected Travels\""))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String id = JsonPath.read(res, "$.id");

        mvc.perform(post("/api/community/changesets/" + id + "/approve").with(as(steward, "PASSENGER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("APPROVED"));

        mvc.perform(get("/api/schedules/" + schedule.getId() + "/workings").with(as(mot, "MOT")))
                .andExpect(jsonPath("$[0].operatorNameObserved").value("Corrected Travels"))
                .andExpect(jsonPath("$[0].vehicles[0].plateObserved").value("AA-1111")); // untouched
    }

    @Test
    @DisplayName("INC-058 ending is a correction too: it applies through the same 'end' rule")
    void inc058_endingIsACorrection() throws Exception {
        String res = propose(proposer, body(",\"effectiveEndDate\":\"2027-01-15\""))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String id = JsonPath.read(res, "$.id");

        mvc.perform(post("/api/community/changesets/" + id + "/approve").with(as(mot, "MOT")))
                .andExpect(status().isOk());
        mvc.perform(get("/api/schedules/" + schedule.getId() + "/workings").with(as(mot, "MOT")))
                .andExpect(jsonPath("$[0].effectiveEndDate").value("2027-01-15"));
    }

    @Test
    @DisplayName("INC-058 a correction against a working that changed since is refused as outdated, not merged")
    void inc058_staleCorrectionRefused() throws Exception {
        String res = propose(proposer, body(",\"operatorNameObserved\":\"Corrected Travels\""))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String id = JsonPath.read(res, "$.id");

        mvc.perform(put("/api/schedule-workings/" + workingId).with(as(mot, "MOT")).contentType(MediaType.APPLICATION_JSON)
                .content("{\"serviceClass\":\"LUXURY\"}")).andExpect(status().isOk());

        mvc.perform(post("/api/community/changesets/" + id + "/approve").with(as(mot, "MOT")))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("INC-058 an approved working correction is not offered for revert")
    void inc058_revertNotOffered() throws Exception {
        String res = propose(proposer, body(",\"operatorNameObserved\":\"Corrected Travels\""))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String id = JsonPath.read(res, "$.id");
        mvc.perform(post("/api/community/changesets/" + id + "/approve").with(as(mot, "MOT"))).andExpect(status().isOk());
        mvc.perform(post("/api/community/changesets/" + id + "/revert").with(as(mot, "MOT"))).andExpect(status().isConflict());
    }
}
