package com.busmate.routeschedule.community;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.busmate.routeschedule.AbstractPostgresIntegrationTest;
import com.busmate.routeschedule.community.entity.Affiliation;
import com.busmate.routeschedule.community.entity.Contributor;
import com.busmate.routeschedule.community.entity.ContributorStatus;
import com.busmate.routeschedule.community.entity.Changeset;
import com.busmate.routeschedule.community.repository.ChangesetRepository;
import com.busmate.routeschedule.community.repository.ContributorRepository;
import com.busmate.routeschedule.network.entity.Stop;
import com.busmate.routeschedule.network.repository.StopRepository;
import com.busmate.routeschedule.shared.provenance.Provenance;
import com.busmate.routeschedule.shared.provenance.SourceTier;

import jakarta.persistence.EntityManager;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("INC-031 staff review of stop proposals")
class StopReviewIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private ContributorRepository contributors;
    @Autowired private StopRepository stops;
    @Autowired private ChangesetRepository changesets;
    @Autowired private EntityManager em;

    private MockMvc mvc;
    private final UUID contributor = UUID.randomUUID();
    private final UUID mot = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        Contributor c = new Contributor();
        c.setUserId(contributor);
        c.setStatus(ContributorStatus.ACTIVE);
        c.setMotivation("m");
        c.setHomeDistrict("Colombo");
        c.setAffiliation(Affiliation.NONE);
        c.setAgreementVersion("draft-1");
        c.setAgreementAcceptedAt(Instant.now());
        c.setAppliedAt(Instant.now());
        contributors.saveAndFlush(c);
    }

    private static RequestPostProcessor as(UUID id, String role) {
        return user(id.toString()).roles(role);
    }

    private static Stop stopEntity(String name, double lat, double lng, String city, SourceTier tier) {
        Stop s = new Stop();
        s.setName(name);
        Stop.Location loc = new Stop.Location();
        loc.setLatitude(lat);
        loc.setLongitude(lng);
        loc.setCity(city);
        loc.setCountry("Sri Lanka");
        s.setLocation(loc);
        s.setProvenance(Provenance.of(tier, tier == SourceTier.SRC_1 ? "MOT" : "BusMate", null, Instant.parse("2020-01-01T00:00:00Z")));
        return s;
    }

    private String createProposalJson(String name, double lat, double lng) {
        return "{\"name\":\"" + name + "\",\"location\":{\"latitude\":" + lat + ",\"longitude\":" + lng
                + ",\"city\":\"Test\",\"country\":\"Sri Lanka\"},"
                + "\"observedOn\":\"2026-09-01\",\"observationMethod\":\"RODE_THE_ROUTE\"}";
    }

    private String updateProposalJson(String targetId, String name, double lat, double lng) {
        return "{\"targetStopId\":\"" + targetId + "\",\"name\":\"" + name + "\",\"location\":{\"latitude\":" + lat
                + ",\"longitude\":" + lng + ",\"city\":\"Test\",\"country\":\"Sri Lanka\"},"
                + "\"observedOn\":\"2026-09-01\",\"observationMethod\":\"RODE_THE_ROUTE\"}";
    }

    private String proposeCreate(String name, double lat, double lng) throws Exception {
        String body = mvc.perform(post("/api/community/stop-proposals").with(as(contributor, "PASSENGER"))
                        .contentType(MediaType.APPLICATION_JSON).content(createProposalJson(name, lat, lng)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return com.jayway.jsonpath.JsonPath.read(body, "$.changeset.id");
    }

    private String proposeUpdate(Stop target, String name, double lat, double lng) throws Exception {
        String body = mvc.perform(post("/api/community/stop-proposals").with(as(contributor, "PASSENGER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateProposalJson(target.getId().toString(), name, lat, lng)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return com.jayway.jsonpath.JsonPath.read(body, "$.changeset.id");
    }

    private ResultActions approve(String id) throws Exception {
        return mvc.perform(post("/api/community/changesets/" + id + "/approve").with(as(mot, "MOT")));
    }

    @Test
    @DisplayName("INC-031 staff see the queue and one proposal's review detail")
    void inc031_staffSeeQueueAndDetail() throws Exception {
        Stop existing = stops.saveAndFlush(stopEntity("Kaduwela", 6.933, 79.984, "Kaduwela", SourceTier.SRC_4));
        String id = proposeUpdate(existing, "Kaduwela Town", 6.9331, 79.9841);

        mvc.perform(get("/api/community/changesets").param("status", "PENDING").with(as(mot, "MOT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].changeset.status").value("PENDING"))
                .andExpect(jsonPath("$.content[0].currentStop.name").value("Kaduwela"))
                .andExpect(jsonPath("$.content[0].positionDistanceMeters").isNumber())
                .andExpect(jsonPath("$.content[0].proposerAffiliation").value("NONE"))
                .andExpect(jsonPath("$.content[0].proposerTrackRecord.approved").value(0));

        mvc.perform(get("/api/community/changesets/" + id + "/review").with(as(mot, "MOT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStop.name").value("Kaduwela"))
                .andExpect(jsonPath("$.targetOutranksCommunityTier").value(false))
                .andExpect(jsonPath("$.stale").value(false));
    }

    @Test
    @DisplayName("INC-031 approving a new stop writes it, labelled observed and credited")
    void inc031_approveCreateWritesStopCreditedObserved() throws Exception {
        String id = proposeCreate("Malabe Junction", 6.906, 79.972);
        approve(id).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("APPROVED"));

        Stop created = stops.findAll().stream().filter(s -> "Malabe Junction".equals(s.getName())).findFirst().orElseThrow();
        assertThat(created.getProvenance().getSourceTier()).isEqualTo(SourceTier.SRC_4);
        assertThat(created.getProvenance().getAttributionLabel()).isEqualTo("Community contributor");
        assertThat(created.getProvenance().getAttributedUserId()).isEqualTo(contributor);
        assertThat(created.getProvenance().getObservedAt()).isEqualTo(java.time.LocalDate.parse("2026-09-01")
                .atStartOfDay(java.time.ZoneOffset.UTC).toInstant());
    }

    @Test
    @DisplayName("INC-031 approving a correction updates the existing stop and records the version it wrote")
    void inc031_approveUpdateWritesAndSetsAppliedVersion() throws Exception {
        Stop existing = stops.saveAndFlush(stopEntity("Battaramulla", 6.899, 79.918, "Battaramulla", SourceTier.SRC_4));
        String id = proposeUpdate(existing, "Battaramulla Junction", 6.8991, 79.9181);

        approve(id).andExpect(status().isOk());
        em.flush();
        em.clear();
        Stop updated = stops.findById(existing.getId()).orElseThrow();
        assertThat(updated.getName()).isEqualTo("Battaramulla Junction");
        assertThat(updated.getProvenance().getAttributedUserId()).isEqualTo(contributor);

        Changeset applied = changesets.findById(UUID.fromString(id)).orElseThrow();
        assertThat(applied.getAppliedVersion()).isEqualTo(updated.getVersion());
    }

    @Test
    @DisplayName("INC-031 nobody can approve their own proposal")
    void inc031_cannotApproveOwnProposal() throws Exception {
        String id = proposeCreate("Self Approve Attempt", 6.9, 79.9);
        mvc.perform(post("/api/community/changesets/" + id + "/approve").with(as(contributor, "MOT")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("INC-031 a proposal against a stop that changed since cannot be approved")
    void inc031_staleProposalCannotBeApproved() throws Exception {
        Stop existing = stops.saveAndFlush(stopEntity("Rajagiriya", 6.909, 79.897, "Rajagiriya", SourceTier.SRC_4));
        String id = proposeUpdate(existing, "Rajagiriya Junction", 6.9091, 79.8971);

        // Someone else edits the stop in the meantime, bumping its version.
        existing.setDescription("Edited by someone else");
        stops.saveAndFlush(existing);

        approve(id).andExpect(status().isConflict());
    }

    @Test
    @DisplayName("INC-031 a proposal against an official record is not applied and stays pending")
    void inc031_officialRecordNotApplied() throws Exception {
        Stop official = stops.saveAndFlush(stopEntity("Fort Station", 6.934, 79.850, "Colombo", SourceTier.SRC_1));
        String id = proposeUpdate(official, "Fort Railway Station", 6.9341, 79.8501);

        approve(id).andExpect(status().isConflict());
        assertThat(changesets.findById(UUID.fromString(id)).orElseThrow().getStatus().name()).isEqualTo("PENDING");
        em.flush();
        em.clear();
        assertThat(stops.findById(official.getId()).orElseThrow().getName()).isEqualTo("Fort Station");
    }

    @Test
    @DisplayName("INC-031 rejecting requires a reason from the list, and it's visible on the changeset")
    void inc031_rejectRequiresReasonVisibleToContributor() throws Exception {
        String id = proposeCreate("Bad Proposal", 6.9, 79.9);
        mvc.perform(post("/api/community/changesets/" + id + "/reject").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/community/changesets/" + id + "/reject").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"CANNOT_VERIFY\",\"note\":\"No evidence given\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.decisionReason").value("Can't verify this: No evidence given"));

        mvc.perform(get("/api/community/changesets/mine").with(as(contributor, "PASSENGER")))
                .andExpect(jsonPath("$.content[0].decisionReason").value("Can't verify this: No evidence given"));
    }

    @Test
    @DisplayName("INC-031 reverting restores the stop's previous values and provenance")
    void inc031_revertRestoresPreviousValuesAndProvenance() throws Exception {
        Stop existing = stops.saveAndFlush(stopEntity("Nawala", 6.891, 79.888, "Nawala", SourceTier.SRC_4));
        String id = proposeUpdate(existing, "Nawala Junction", 6.8911, 79.8881);
        approve(id).andExpect(status().isOk());

        mvc.perform(post("/api/community/changesets/" + id + "/revert").with(as(mot, "MOT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REVERTED"));

        em.flush();
        em.clear();
        Stop reverted = stops.findById(existing.getId()).orElseThrow();
        assertThat(reverted.getName()).isEqualTo("Nawala");
        assertThat(reverted.getProvenance().getSourceTier()).isEqualTo(SourceTier.SRC_4);
        assertThat(reverted.getProvenance().getAttributionLabel()).isEqualTo("BusMate");
        assertThat(reverted.getProvenance().getAttributedUserId()).isNull();
    }

    @Test
    @DisplayName("INC-031 revert is refused if the stop changed again after the approval")
    void inc031_revertRefusedIfChangedSinceApproval() throws Exception {
        Stop existing = stops.saveAndFlush(stopEntity("Athurugiriya", 6.870, 80.000, "Athurugiriya", SourceTier.SRC_4));
        String id = proposeUpdate(existing, "Athurugiriya Town", 6.8701, 80.0001);
        approve(id).andExpect(status().isOk());

        em.flush();
        em.clear();
        Stop afterApproval = stops.findById(existing.getId()).orElseThrow();
        afterApproval.setDescription("Edited again after approval");
        stops.saveAndFlush(afterApproval);

        mvc.perform(post("/api/community/changesets/" + id + "/revert").with(as(mot, "MOT")))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("INC-031 reverting a new stop is refused with a clear message")
    void inc031_revertNotSupportedForCreate() throws Exception {
        String id = proposeCreate("Not Revertible", 6.9, 79.9);
        approve(id).andExpect(status().isOk());
        mvc.perform(post("/api/community/changesets/" + id + "/revert").with(as(mot, "MOT")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("new stop")));
    }
}
