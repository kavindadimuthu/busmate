package com.busmate.routeschedule.community;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
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
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.busmate.routeschedule.AbstractPostgresIntegrationTest;
import com.busmate.routeschedule.community.entity.Affiliation;
import com.busmate.routeschedule.community.entity.Changeset;
import com.busmate.routeschedule.community.entity.ChangesetAction;
import com.busmate.routeschedule.community.entity.ChangesetEntityType;
import com.busmate.routeschedule.community.entity.ChangesetStatus;
import com.busmate.routeschedule.community.entity.Contributor;
import com.busmate.routeschedule.community.entity.ContributorLevel;
import com.busmate.routeschedule.community.entity.ContributorStatus;
import com.busmate.routeschedule.community.entity.ObservationMethod;
import com.busmate.routeschedule.community.repository.ChangesetRepository;
import com.busmate.routeschedule.community.repository.ContributorRepository;
import com.busmate.routeschedule.network.entity.Route;
import com.busmate.routeschedule.network.entity.RouteGroup;
import com.busmate.routeschedule.network.entity.RouteStop;
import com.busmate.routeschedule.network.entity.Stop;
import com.busmate.routeschedule.network.repository.RouteGroupRepository;
import com.busmate.routeschedule.network.repository.RouteRepository;
import com.busmate.routeschedule.network.repository.RouteStopRepository;
import com.busmate.routeschedule.network.repository.StopRepository;
import com.busmate.routeschedule.shared.provenance.Provenance;
import com.busmate.routeschedule.shared.provenance.SourceTier;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.EntityManager;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@TestPropertySource(properties = {
        "community.promotion.min-approved=2",
        "community.promotion.min-approval-rate=0.8",
        "community.promotion.min-days-active=0"})
@DisplayName("INC-041 stewards review inside their corridor")
class StewardReviewIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private ContributorRepository contributors;
    @Autowired private ChangesetRepository changesets;
    @Autowired private StopRepository stops;
    @Autowired private RouteGroupRepository routeGroups;
    @Autowired private RouteRepository routes;
    @Autowired private RouteStopRepository routeStops;
    @Autowired private ObjectMapper json;
    @Autowired private EntityManager em;

    private MockMvc mvc;
    private final UUID mot = UUID.randomUUID();
    private final UUID proposer = UUID.randomUUID();
    private final UUID steward = UUID.randomUUID();
    private final UUID bystander = UUID.randomUUID();

    private RouteGroup corridorA;
    private RouteGroup corridorB;
    private Stop stopInA;
    private Stop stopInB;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        corridorA = routeGroup("Corridor A");
        corridorB = routeGroup("Corridor B");
        stopInA = servedStop("Stop in A", corridorA);
        stopInB = servedStop("Stop in B", corridorB);

        contributor(proposer, ContributorStatus.ACTIVE, Set.of(corridorA.getId()));
        contributor(steward, ContributorStatus.ACTIVE, Set.of());
        contributor(bystander, ContributorStatus.ACTIVE, Set.of());
        em.flush();
    }

    // ───────────────────────────── helpers ─────────────────────────────

    private static RequestPostProcessor as(UUID id, String role) {
        return user(id.toString()).roles(role);
    }

    private RouteGroup routeGroup(String name) {
        RouteGroup g = new RouteGroup();
        g.setName(name);
        return routeGroups.saveAndFlush(g);
    }

    private Stop servedStop(String name, RouteGroup group) {
        Stop s = new Stop();
        s.setName(name);
        Stop.Location loc = new Stop.Location();
        loc.setLatitude(6.9);
        loc.setLongitude(79.9);
        loc.setCity("Test");
        loc.setCountry("Sri Lanka");
        s.setLocation(loc);
        s.setProvenance(Provenance.of(SourceTier.SRC_4, "BusMate", null, Instant.parse("2020-01-01T00:00:00Z")));
        s = stops.saveAndFlush(s);

        Route route = new Route();
        route.setName("Route for " + name);
        route.setRouteGroup(group);
        route = routes.saveAndFlush(route);
        RouteStop rs = new RouteStop();
        rs.setRoute(route);
        rs.setStop(s);
        rs.setStopOrder(1);
        routeStops.saveAndFlush(rs);
        return s;
    }

    private Contributor contributor(UUID id, ContributorStatus status, Set<UUID> corridors) {
        Contributor c = new Contributor();
        c.setUserId(id);
        c.setStatus(status);
        c.setMotivation("m");
        c.setAffiliation(Affiliation.NONE);
        c.setAgreementVersion("draft-1");
        c.setAgreementAcceptedAt(Instant.now());
        c.setAppliedAt(Instant.now().minusSeconds(86_400L * 60));
        c.setDecidedAt(Instant.now().minusSeconds(86_400L * 60));
        c.getCorridorRouteGroupIds().addAll(corridors);
        return contributors.save(c);
    }

    private void appointSteward(UUID who, RouteGroup... groups) {
        Contributor c = contributors.findById(who).orElseThrow();
        c.setLevel(ContributorLevel.STEWARD);
        c.getStewardScopeRouteGroupIds().clear();
        for (RouteGroup g : groups) {
            c.getStewardScopeRouteGroupIds().add(g.getId());
        }
        c.setStewardAppointedBy(mot);
        c.setStewardAppointedAt(Instant.now());
        contributors.saveAndFlush(c);
    }

    private String proposeUpdate(UUID by, Stop target, String newName) throws Exception {
        String body = "{\"targetStopId\":\"" + target.getId() + "\",\"name\":\"" + newName + "\",\"location\":"
                + "{\"latitude\":6.9001,\"longitude\":79.9001,\"city\":\"Test\",\"country\":\"Sri Lanka\"},"
                + "\"observedOn\":\"2026-09-01\",\"observationMethod\":\"RODE_THE_ROUTE\"}";
        String res = mvc.perform(post("/api/community/stop-proposals").with(as(by, "PASSENGER"))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return com.jayway.jsonpath.JsonPath.read(res, "$.changeset.id");
    }

    private String proposeCreate(UUID by, String name) throws Exception {
        String body = "{\"name\":\"" + name + "\",\"location\":{\"latitude\":6.95,\"longitude\":79.95,"
                + "\"city\":\"Test\",\"country\":\"Sri Lanka\"},"
                + "\"observedOn\":\"2026-09-01\",\"observationMethod\":\"RODE_THE_ROUTE\"}";
        String res = mvc.perform(post("/api/community/stop-proposals").with(as(by, "PASSENGER"))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return com.jayway.jsonpath.JsonPath.read(res, "$.changeset.id");
    }

    private ResultActions approve(UUID by, String role, String id) throws Exception {
        return mvc.perform(post("/api/community/changesets/" + id + "/approve").with(as(by, role)));
    }

    private String appointBody(RouteGroup... groups) throws Exception {
        return json.writeValueAsString(java.util.Map.of("routeGroupIds",
                java.util.Arrays.stream(groups).map(RouteGroup::getId).toList()));
    }

    // ───────────────────────────── appointment ─────────────────────────────

    @Test
    @DisplayName("INC-041 staff appoint a steward, change their corridors, and revoke")
    void inc041_staffAppointRescopeRevoke() throws Exception {
        mvc.perform(put("/api/community/contributors/" + steward + "/steward").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content(appointBody(corridorA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.level").value("STEWARD"))
                .andExpect(jsonPath("$.stewardScopeRouteGroupIds[0]").value(corridorA.getId().toString()));

        mvc.perform(put("/api/community/contributors/" + steward + "/steward").with(as(mot, "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content(appointBody(corridorB)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stewardScopeRouteGroupIds.length()").value(1))
                .andExpect(jsonPath("$.stewardScopeRouteGroupIds[0]").value(corridorB.getId().toString()));

        mvc.perform(delete("/api/community/contributors/" + steward + "/steward").with(as(mot, "MOT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.level").value("CONTRIBUTOR"))
                .andExpect(jsonPath("$.stewardScopeRouteGroupIds.length()").value(0));

        mvc.perform(delete("/api/community/contributors/" + steward + "/steward").with(as(mot, "MOT")))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("INC-041 only staff appoint; only an active contributor with a real corridor can be appointed")
    void inc041_appointmentRefusals() throws Exception {
        // a steward or any passenger cannot appoint
        appointSteward(steward, corridorA);
        mvc.perform(put("/api/community/contributors/" + bystander + "/steward").with(as(steward, "PASSENGER"))
                        .contentType(MediaType.APPLICATION_JSON).content(appointBody(corridorA)))
                .andExpect(status().isForbidden());

        // not active
        UUID applicant = UUID.randomUUID();
        contributor(applicant, ContributorStatus.APPLIED, Set.of());
        mvc.perform(put("/api/community/contributors/" + applicant + "/steward").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content(appointBody(corridorA)))
                .andExpect(status().isConflict());

        // no corridor / unknown corridor
        mvc.perform(put("/api/community/contributors/" + bystander + "/steward").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"routeGroupIds\":[]}"))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/community/contributors/" + bystander + "/steward").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"routeGroupIds\":[\"" + UUID.randomUUID() + "\"]}"))
                .andExpect(status().isBadRequest());

        // staff cannot appoint themselves
        contributor(mot, ContributorStatus.ACTIVE, Set.of());
        mvc.perform(put("/api/community/contributors/" + mot + "/steward").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content(appointBody(corridorA)))
                .andExpect(status().isForbidden());
    }

    // ───────────────────────────── scope ─────────────────────────────

    @Test
    @DisplayName("INC-041 a steward sees only proposals inside their corridors, and not who made them")
    void inc041_queueIsScopedAndBlind() throws Exception {
        appointSteward(steward, corridorA);
        String inScopeUpdate = proposeUpdate(proposer, stopInA, "Stop in A renamed");
        proposeUpdate(bystander, stopInB, "Stop in B renamed");           // other corridor
        String inScopeCreate = proposeCreate(proposer, "Brand New Stop"); // proposer declared corridor A
        proposeCreate(bystander, "Bystander New Stop");                    // declared no corridor: staff-only

        mvc.perform(get("/api/community/changesets").param("status", "PENDING").with(as(steward, "PASSENGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[0].changeset.id").value(inScopeUpdate))
                .andExpect(jsonPath("$.content[1].changeset.id").value(inScopeCreate))
                .andExpect(jsonPath("$.content[0].changeset.proposerUserId").doesNotExist())
                .andExpect(jsonPath("$.content[0].proposerTrackRecord.reverted").value(0));

        // staff still see all four, with identity
        mvc.perform(get("/api/community/changesets").param("status", "PENDING").with(as(mot, "MOT")))
                .andExpect(jsonPath("$.totalElements").value(4))
                .andExpect(jsonPath("$.content[0].changeset.proposerUserId").value(proposer.toString()));
    }

    @Test
    @DisplayName("INC-041 a steward cannot unmask a proposer by filtering the queue on them")
    void inc041_cannotFilterByProposer() throws Exception {
        appointSteward(steward, corridorA);
        proposeUpdate(proposer, stopInA, "Stop in A renamed");

        mvc.perform(get("/api/community/changesets").param("proposerUserId", UUID.randomUUID().toString())
                        .with(as(steward, "PASSENGER")))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("INC-041 a steward cannot open or decide a proposal outside their corridors")
    void inc041_outOfScopeRefused() throws Exception {
        appointSteward(steward, corridorA);
        String outside = proposeUpdate(bystander, stopInB, "Stop in B renamed");

        mvc.perform(get("/api/community/changesets/" + outside + "/review").with(as(steward, "PASSENGER")))
                .andExpect(status().isForbidden());
        approve(steward, "PASSENGER", outside).andExpect(status().isForbidden());
        mvc.perform(post("/api/community/changesets/" + outside + "/reject").with(as(steward, "PASSENGER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"CANNOT_VERIFY\"}"))
                .andExpect(status().isForbidden());
        assertThat(changesets.findById(UUID.fromString(outside)).orElseThrow().getStatus())
                .isEqualTo(ChangesetStatus.PENDING);
    }

    // ───────────────────────────── deciding ─────────────────────────────

    @Test
    @DisplayName("INC-041 a steward approves inside their corridor, credited and blind, and the decision is theirs")
    void inc041_stewardApproves() throws Exception {
        appointSteward(steward, corridorA);
        String id = proposeUpdate(proposer, stopInA, "Stop in A renamed");

        approve(steward, "PASSENGER", id)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.proposerUserId").doesNotExist());

        em.flush();
        em.clear();
        assertThat(stops.findById(stopInA.getId()).orElseThrow().getName()).isEqualTo("Stop in A renamed");
        assertThat(changesets.findById(UUID.fromString(id)).orElseThrow().getDecidedBy()).isEqualTo(steward);
    }

    @Test
    @DisplayName("INC-041 a steward rejects with a reason the contributor sees")
    void inc041_stewardRejects() throws Exception {
        appointSteward(steward, corridorA);
        String id = proposeUpdate(proposer, stopInA, "Stop in A renamed");

        mvc.perform(post("/api/community/changesets/" + id + "/reject").with(as(steward, "PASSENGER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"CANNOT_VERIFY\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));
        mvc.perform(get("/api/community/changesets/mine").with(as(proposer, "PASSENGER")))
                .andExpect(jsonPath("$.content[0].status").value("REJECTED"));
    }

    @Test
    @DisplayName("INC-041 a steward cannot decide their own proposal, even inside their own corridor")
    void inc041_stewardCannotDecideOwn() throws Exception {
        appointSteward(steward, corridorA);
        String own = proposeUpdate(steward, stopInA, "Steward's own edit");

        approve(steward, "PASSENGER", own).andExpect(status().isForbidden());
        // and it never appears in their own queue
        mvc.perform(get("/api/community/changesets").with(as(steward, "PASSENGER")))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @DisplayName("INC-041 a steward cannot revert an approval; staff can")
    void inc041_revertIsStaffOnly() throws Exception {
        appointSteward(steward, corridorA);
        String id = proposeUpdate(proposer, stopInA, "Stop in A renamed");
        approve(steward, "PASSENGER", id).andExpect(status().isOk());

        mvc.perform(post("/api/community/changesets/" + id + "/revert").with(as(steward, "PASSENGER")))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/community/changesets/" + id + "/revert").with(as(mot, "MOT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REVERTED"));
    }

    @Test
    @DisplayName("INC-041 a steward's approval still cannot overwrite an official record")
    void inc041_stewardCannotOverwriteOfficial() throws Exception {
        appointSteward(steward, corridorA);
        String id = proposeUpdate(proposer, stopInA, "Stop in A renamed");
        Stop official = stops.findById(stopInA.getId()).orElseThrow();
        official.setProvenance(Provenance.of(SourceTier.SRC_1, "MOT", null, Instant.now()));
        stops.saveAndFlush(official);

        approve(steward, "PASSENGER", id).andExpect(status().isConflict());
    }

    // ───────────────────────────── who is refused ─────────────────────────────

    @Test
    @DisplayName("INC-041 a contributor who is not a steward, and any other passenger, cannot review")
    void inc041_nonStewardsRefused() throws Exception {
        String id = proposeUpdate(proposer, stopInA, "Stop in A renamed");

        for (UUID who : new UUID[] {bystander, UUID.randomUUID()}) {
            mvc.perform(get("/api/community/changesets").with(as(who, "PASSENGER"))).andExpect(status().isForbidden());
            approve(who, "PASSENGER", id).andExpect(status().isForbidden());
        }
        // and roles that are neither staff nor passenger never get past the door
        approve(UUID.randomUUID(), "OPERATOR", id).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("INC-041 suspending a steward removes their authority and their level")
    void inc041_suspensionEndsStewardship() throws Exception {
        appointSteward(steward, corridorA);
        String id = proposeUpdate(proposer, stopInA, "Stop in A renamed");

        mvc.perform(post("/api/community/contributors/" + steward + "/suspend").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"conduct\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.level").value("CONTRIBUTOR"))
                .andExpect(jsonPath("$.stewardScopeRouteGroupIds.length()").value(0));

        approve(steward, "PASSENGER", id).andExpect(status().isForbidden());

        // reinstating returns a plain contributor, not a steward
        mvc.perform(post("/api/community/contributors/" + steward + "/reinstate").with(as(mot, "MOT")))
                .andExpect(jsonPath("$.level").value("CONTRIBUTOR"));
        approve(steward, "PASSENGER", id).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("INC-041 a steward whose agreement is out of date is refused, like any contributor")
    void inc041_staleAgreementRefused() throws Exception {
        appointSteward(steward, corridorA);
        String id = proposeUpdate(proposer, stopInA, "Stop in A renamed");
        Contributor s = contributors.findById(steward).orElseThrow();
        s.setAgreementVersion("older-version");
        contributors.saveAndFlush(s);

        approve(steward, "PASSENGER", id).andExpect(status().isForbidden());
    }

    // ───────────────────────────── promotion ─────────────────────────────

    private void decidedChangeset(UUID by, ChangesetStatus st) {
        Changeset c = new Changeset();
        c.setEntityType(ChangesetEntityType.STOP);
        c.setAction(ChangesetAction.CREATE);
        c.setProposedValues(json.createObjectNode().put("name", "x"));
        c.setObservedOn(LocalDate.parse("2026-09-01"));
        c.setObservationMethod(ObservationMethod.RODE_THE_ROUTE);
        c.setStatus(st);
        if (st == ChangesetStatus.REJECTED) {
            c.setDecisionReason("Can't verify this"); // the schema requires a reason on every rejection
        }
        c.setProposerUserId(by);
        c.setCreatedAt(Instant.now());
        changesets.save(c);
    }

    @Test
    @DisplayName("INC-041 promotion candidates are those whose record clears the bar; nobody is promoted by it")
    void inc041_promotionCandidates() throws Exception {
        UUID strong = UUID.randomUUID();
        UUID reverted = UUID.randomUUID();
        UUID sloppy = UUID.randomUUID();
        UUID thin = UUID.randomUUID();
        for (UUID u : new UUID[] {strong, reverted, sloppy, thin}) {
            contributor(u, ContributorStatus.ACTIVE, Set.of());
        }
        for (int i = 0; i < 3; i++) decidedChangeset(strong, ChangesetStatus.APPROVED);
        for (int i = 0; i < 3; i++) decidedChangeset(reverted, ChangesetStatus.APPROVED);
        decidedChangeset(reverted, ChangesetStatus.REVERTED);
        decidedChangeset(sloppy, ChangesetStatus.APPROVED);
        decidedChangeset(sloppy, ChangesetStatus.APPROVED);
        for (int i = 0; i < 3; i++) decidedChangeset(sloppy, ChangesetStatus.REJECTED);
        decidedChangeset(thin, ChangesetStatus.APPROVED);
        // a steward is already promoted, so is not a candidate however strong
        for (int i = 0; i < 3; i++) decidedChangeset(steward, ChangesetStatus.APPROVED);
        appointSteward(steward, corridorA);
        em.flush();

        mvc.perform(get("/api/community/contributors/promotion-candidates").with(as(mot, "MOT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].contributor.userId").value(strong.toString()))
                .andExpect(jsonPath("$[0].approved").value(3))
                .andExpect(jsonPath("$[0].approvalRate").value(1.0));

        assertThat(contributors.findById(strong).orElseThrow().getLevel()).isEqualTo(ContributorLevel.CONTRIBUTOR);
    }

    @Test
    @DisplayName("INC-041 the promotion list is for staff only")
    void inc041_promotionListStaffOnly() throws Exception {
        mvc.perform(get("/api/community/contributors/promotion-candidates").with(as(steward, "PASSENGER")))
                .andExpect(status().isForbidden());
    }
}
