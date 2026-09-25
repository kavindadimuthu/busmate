package com.busmate.routeschedule.community;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
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
import com.busmate.routeschedule.community.entity.Changeset;
import com.busmate.routeschedule.community.entity.ChangesetAction;
import com.busmate.routeschedule.community.entity.ChangesetEntityType;
import com.busmate.routeschedule.community.entity.Contributor;
import com.busmate.routeschedule.community.entity.ContributorStatus;
import com.busmate.routeschedule.community.entity.ObservationMethod;
import com.busmate.routeschedule.community.repository.ChangesetRepository;
import com.busmate.routeschedule.community.repository.ContributorRepository;
import com.busmate.routeschedule.network.entity.Stop;
import com.busmate.routeschedule.network.repository.StopRepository;
import com.busmate.routeschedule.shared.provenance.Provenance;
import com.busmate.routeschedule.shared.provenance.SourceTier;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.EntityManager;

/** A correction changes what it says and nothing else — the translations of a stop survive it. */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("INC-043 a correction keeps what it doesn't mention")
class CorrectionKeepsUntouchedFieldsIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private ContributorRepository contributors;
    @Autowired private ChangesetRepository changesets;
    @Autowired private StopRepository stops;
    @Autowired private ObjectMapper json;
    @Autowired private EntityManager em;

    private MockMvc mvc;
    private final UUID contributor = UUID.randomUUID();
    private final UUID mot = UUID.randomUUID();
    private Stop stop;

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

        Stop s = new Stop();
        s.setName("Kadawatha");
        s.setNameSinhala("කඩවත");
        s.setNameTamil("கடவத");
        s.setDescription("Junction stop on the Colombo-Kandy road");
        s.setIsAccessible(true);
        Stop.Location loc = new Stop.Location();
        loc.setLatitude(7.0008);
        loc.setLongitude(79.9511);
        loc.setCity("Kadawatha");
        loc.setCitySinhala("කඩවත");
        loc.setAddress("Kandy Road");
        loc.setAddressTamil("கண்டி வீதி");
        loc.setCountry("Sri Lanka");
        s.setLocation(loc);
        s.setProvenance(Provenance.of(SourceTier.SRC_4, "BusMate", null, Instant.parse("2020-01-01T00:00:00Z")));
        stop = stops.saveAndFlush(s);
    }

    private static RequestPostProcessor as(UUID id, String role) {
        return user(id.toString()).roles(role);
    }

    /** What the passenger-web form sends when it only knows the name, position and city: everything else absent. */
    private String propose(String extraJson) throws Exception {
        String body = "{\"targetStopId\":\"" + stop.getId() + "\",\"name\":\"Kadawatha Junction\","
                + "\"location\":{\"latitude\":7.0008,\"longitude\":79.9511,\"city\":\"Kadawatha\"},"
                + "\"observedOn\":\"" + LocalDate.now() + "\",\"observationMethod\":\"RODE_THE_ROUTE\""
                + extraJson + "}";
        String res = mvc.perform(post("/api/community/stop-proposals").with(as(contributor, "PASSENGER"))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return com.jayway.jsonpath.JsonPath.read(res, "$.changeset.id");
    }

    private void approve(String id) throws Exception {
        mvc.perform(post("/api/community/changesets/" + id + "/approve").with(as(mot, "MOT"))).andExpect(status().isOk());
        em.flush();
        em.clear();
    }

    private Stop reload() {
        return stops.findById(stop.getId()).orElseThrow();
    }

    @Test
    @DisplayName("INC-043 approving a name-only correction leaves every translation and detail as it was")
    void inc043_nameOnlyCorrectionKeepsTheRest() throws Exception {
        approve(propose(""));

        Stop after = reload();
        assertThat(after.getName()).isEqualTo("Kadawatha Junction");
        assertThat(after.getNameSinhala()).isEqualTo("කඩවත");
        assertThat(after.getNameTamil()).isEqualTo("கடவத");
        assertThat(after.getDescription()).isEqualTo("Junction stop on the Colombo-Kandy road");
        assertThat(after.getIsAccessible()).isTrue();
        assertThat(after.getLocation().getCitySinhala()).isEqualTo("කඩවත");
        assertThat(after.getLocation().getAddress()).isEqualTo("Kandy Road");
        assertThat(after.getLocation().getAddressTamil()).isEqualTo("கண்டி வீதி");
        assertThat(after.getLocation().getCountry()).isEqualTo("Sri Lanka");
    }

    @Test
    @DisplayName("INC-043 the stored proposal, and so the reviewer's diff, already shows the kept values")
    void inc043_reviewerSeesWhatWouldReallyHappen() throws Exception {
        String id = propose("");

        mvc.perform(get("/api/community/changesets/" + id + "/review").with(as(mot, "MOT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.changeset.proposedValues.nameSinhala").value("කඩවත"))
                .andExpect(jsonPath("$.changeset.proposedValues.location.addressTamil").value("கண்டி வீதி"))
                .andExpect(jsonPath("$.changeset.proposedValues.name").value("Kadawatha Junction"));
    }

    @Test
    @DisplayName("INC-043 a value the correction does state still wins")
    void inc043_statedValuesStillApply() throws Exception {
        approve(propose(",\"nameSinhala\":\"කඩවත හංදිය\",\"description\":\"Renamed after the new signboard\""));

        Stop after = reload();
        assertThat(after.getNameSinhala()).isEqualTo("කඩවත හංදිය");
        assertThat(after.getDescription()).isEqualTo("Renamed after the new signboard");
        assertThat(after.getNameTamil()).isEqualTo("கடவத"); // untouched, so kept
    }

    @Test
    @DisplayName("INC-043 a blank field counts as not stated, not as an instruction to clear it")
    void inc043_blankIsNotAClearInstruction() throws Exception {
        approve(propose(",\"nameTamil\":\"   \",\"description\":\"\""));

        Stop after = reload();
        assertThat(after.getNameTamil()).isEqualTo("கடவத");
        assertThat(after.getDescription()).isEqualTo("Junction stop on the Colombo-Kandy road");
    }

    @Test
    @DisplayName("INC-043 a proposal stored before the fix, carrying nulls, still cannot erase anything")
    void inc043_legacyPendingProposalIsSafeToApprove() throws Exception {
        Changeset legacy = new Changeset();
        legacy.setEntityType(ChangesetEntityType.STOP);
        legacy.setAction(ChangesetAction.UPDATE);
        legacy.setTargetId(stop.getId());
        legacy.setTargetVersion(stop.getVersion());
        legacy.setTargetSnapshot(json.createObjectNode().put("name", "Kadawatha"));
        legacy.setProposedValues(json.readTree(
                "{\"name\":\"Kadawatha Junction\",\"nameSinhala\":null,\"nameTamil\":null,\"description\":null,"
                + "\"isAccessible\":null,\"location\":{\"latitude\":7.0008,\"longitude\":79.9511,\"city\":\"Kadawatha\","
                + "\"citySinhala\":null,\"address\":null,\"addressTamil\":null,\"country\":null}}"));
        legacy.setObservedOn(LocalDate.now());
        legacy.setObservationMethod(ObservationMethod.RODE_THE_ROUTE);
        legacy.setProposerUserId(contributor);
        legacy.setCreatedAt(Instant.now());
        legacy = changesets.saveAndFlush(legacy);

        approve(legacy.getId().toString());

        Stop after = reload();
        assertThat(after.getName()).isEqualTo("Kadawatha Junction");
        assertThat(after.getNameSinhala()).isEqualTo("කඩවත");
        assertThat(after.getNameTamil()).isEqualTo("கடவத");
        assertThat(after.getLocation().getCitySinhala()).isEqualTo("කඩවත");
        assertThat(after.getLocation().getCountry()).isEqualTo("Sri Lanka");
    }
}
