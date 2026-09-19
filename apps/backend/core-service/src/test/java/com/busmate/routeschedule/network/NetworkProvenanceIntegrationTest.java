package com.busmate.routeschedule.network;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.busmate.routeschedule.AbstractPostgresIntegrationTest;
import com.busmate.routeschedule.network.entity.Route;
import com.busmate.routeschedule.network.entity.RouteGroup;
import com.busmate.routeschedule.network.entity.Stop;
import com.busmate.routeschedule.network.repository.RouteGroupRepository;
import com.busmate.routeschedule.network.repository.RouteRepository;
import com.busmate.routeschedule.network.repository.StopRepository;
import com.busmate.routeschedule.scheduling.entity.Schedule;
import com.busmate.routeschedule.scheduling.repository.ScheduleRepository;
import com.busmate.routeschedule.shared.provenance.Provenance;
import com.busmate.routeschedule.shared.provenance.SourceTier;
import com.busmate.routeschedule.support.OperationsFixtures;

import jakarta.persistence.EntityManager;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("INC-027 network record provenance")
class NetworkProvenanceIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private OperationsFixtures fx;
    @Autowired private StopRepository stops;
    @Autowired private RouteGroupRepository routeGroups;
    @Autowired private RouteRepository routes;
    @Autowired private ScheduleRepository schedules;
    @Autowired private EntityManager em;

    private MockMvc mvc;
    private final UUID admin = UUID.randomUUID();
    private final UUID mot = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    private static RequestPostProcessor as(UUID id, String role) {
        return user(id.toString()).roles(role);
    }

    private static String stopJson(String name, String extra) {
        return "{\"name\":\"" + name + "\",\"location\":{\"latitude\":6.9,\"longitude\":79.86,\"city\":\"City-" + name
                + "\",\"country\":\"Sri Lanka\"}" + extra + "}";
    }

    @Test
    @DisplayName("INC-027 a record written by no stamping path is still labelled, never left blank")
    void inc027_unstampedWritesAreLabelledBySafetyNet() {
        RouteGroup group = fx.routeGroup();
        Route route = fx.route(group);
        Schedule schedule = fx.schedule(route);
        for (Provenance p : List.of(group.getProvenance(), route.getProvenance(), schedule.getProvenance())) {
            assertThat(p.getSourceTier()).isEqualTo(SourceTier.SRC_4);
            assertThat(p.getAttributionLabel()).isEqualTo("BusMate");
            assertThat(p.getObservedAt()).isNotNull();
        }
    }

    @Test
    @DisplayName("INC-027 creating a stop records source, time and credit without the user typing them")
    void inc027_createStampsByDefault() throws Exception {
        mvc.perform(post("/api/stops").with(as(admin, "ADMIN")).contentType(MediaType.APPLICATION_JSON)
                        .content(stopJson("Alpha", "")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.provenance.sourceTier").value("SRC_4"))
                .andExpect(jsonPath("$.provenance.attributionLabel").value("BusMate"))
                .andExpect(jsonPath("$.provenance.observedAt").value(notNullValue()))
                .andExpect(jsonPath("$.provenance.attributedUserId").doesNotExist());
    }

    @Test
    @DisplayName("INC-027 only MOT can mark a record official; an admin who tries is refused")
    void inc027_officialIsMotOnly() throws Exception {
        String official = stopJson("Beta", ",\"sourceTier\":\"SRC_1\"");
        mvc.perform(post("/api/stops").with(as(admin, "ADMIN")).contentType(MediaType.APPLICATION_JSON).content(official))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/stops").with(as(mot, "MOT")).contentType(MediaType.APPLICATION_JSON).content(official))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.provenance.sourceTier").value("SRC_1"));
    }

    @Test
    @DisplayName("INC-027 staff cannot record passenger-report or derived sources")
    void inc027_staffCannotRecordReportsOrDerived() throws Exception {
        for (String tier : List.of("SRC_5", "SRC_6")) {
            mvc.perform(post("/api/stops").with(as(mot, "MOT")).contentType(MediaType.APPLICATION_JSON)
                            .content(stopJson("Gamma" + tier, ",\"sourceTier\":\"" + tier + "\"")))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    @DisplayName("INC-027 a request cannot choose who is credited, and a response never names them")
    void inc027_creditCannotBeSetByClient() throws Exception {
        mvc.perform(post("/api/stops").with(as(admin, "ADMIN")).contentType(MediaType.APPLICATION_JSON)
                        .content(stopJson("Delta", ",\"provenance\":{\"attributedUserId\":\"" + UUID.randomUUID() + "\"}")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.provenance.attributedUserId").doesNotExist());
        assertThat(stops.findAll().stream().filter(x -> x.getName().equals("Delta")).findFirst().orElseThrow()
                .getProvenance().getAttributedUserId()).isNull();
    }

    @Test
    @DisplayName("INC-027 editing keeps the source and moves the observed time; an official record edited by admin is no longer official")
    void inc027_editRules() throws Exception {
        Stop official = new Stop();
        official.setName("Epsilon");
        Stop.Location loc = new Stop.Location();
        loc.setLatitude(6.9);
        loc.setLongitude(79.86);
        loc.setCity("City-Epsilon");
        loc.setCountry("Sri Lanka");
        official.setLocation(loc);
        official.setProvenance(Provenance.of(SourceTier.SRC_1, "MOT", null, Instant.parse("2020-01-01T00:00:00Z")));
        official = stops.saveAndFlush(official);

        // MOT edits: stays official, observed now
        mvc.perform(put("/api/stops/" + official.getId()).with(as(mot, "MOT")).contentType(MediaType.APPLICATION_JSON)
                        .content(stopJson("Epsilon", "")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.provenance.sourceTier").value("SRC_1"));
        em.flush();
        em.clear();
        Provenance afterMot = stops.findById(official.getId()).orElseThrow().getProvenance();
        assertThat(Duration.between(afterMot.getObservedAt(), Instant.now())).isLessThan(Duration.ofMinutes(1));

        // Admin edits: the record can no longer be claimed official
        mvc.perform(put("/api/stops/" + official.getId()).with(as(admin, "ADMIN")).contentType(MediaType.APPLICATION_JSON)
                        .content(stopJson("Epsilon", ",\"description\":\"edited\"")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.provenance.sourceTier").value("SRC_4"))
                .andExpect(jsonPath("$.provenance.attributionLabel").value("BusMate"));
    }

    @Test
    @DisplayName("INC-027 an imported file's stops all carry the source chosen for that import")
    void inc027_stopImportCarriesChosenSource() throws Exception {
        String csv = "name,latitude,longitude,city\nImp One,6.91,79.87,ImpCity1\nImp Two,6.92,79.88,ImpCity2\n";
        MockMultipartFile file = new MockMultipartFile("file", "stops.csv", "text/csv", csv.getBytes());
        mvc.perform(multipart("/api/stops/import").file(file).param("sourceTier", "SRC_3").with(as(admin, "ADMIN")))
                .andExpect(status().isOk());
        List<Stop> imported = stops.findAll().stream().filter(s -> s.getName().startsWith("Imp ")).toList();
        assertThat(imported).hasSize(2);
        assertThat(imported).allSatisfy(s -> assertThat(s.getProvenance().getSourceTier()).isEqualTo(SourceTier.SRC_3));
    }

    @Test
    @DisplayName("INC-027 an import naming a source the caller may not use is refused as a whole file")
    void inc027_importRefusedForForbiddenSource() throws Exception {
        String csv = "name,latitude,longitude,city\nForbidden One,6.91,79.87,FCity\n";
        MockMultipartFile file = new MockMultipartFile("file", "stops.csv", "text/csv", csv.getBytes());
        mvc.perform(multipart("/api/stops/import").file(file).param("sourceTier", "SRC_1").with(as(admin, "ADMIN")))
                .andExpect(status().isForbidden());
        assertThat(stops.findAll().stream().anyMatch(s -> s.getName().equals("Forbidden One"))).isFalse();
    }

    @Test
    @DisplayName("INC-027 route groups, routes and schedules are stamped on create and edit too")
    void inc027_groupRouteScheduleStamped() throws Exception {
        String group = mvc.perform(post("/api/routes/groups").with(as(mot, "MOT")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Group-Zeta\",\"sourceTier\":\"SRC_2\",\"attributionLabel\":\"Zeta Lines\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.provenance.sourceTier").value("SRC_2"))
                .andExpect(jsonPath("$.provenance.attributionLabel").value("Zeta Lines"))
                .andReturn().getResponse().getContentAsString();
        String groupId = com.jayway.jsonpath.JsonPath.read(group, "$.id");

        Stop a = stops.save(stopEntity("RA"));
        Stop b = stops.save(stopEntity("RB"));
        String route = mvc.perform(post("/api/routes").with(as(admin, "ADMIN")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Route-Zeta\",\"routeGroupId\":\"" + groupId + "\",\"startStopId\":\"" + a.getId()
                                + "\",\"endStopId\":\"" + b.getId() + "\",\"direction\":\"OUTBOUND\",\"roadType\":\"NORMALWAY\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.provenance.sourceTier").value("SRC_4"))
                .andReturn().getResponse().getContentAsString();
        String routeId = com.jayway.jsonpath.JsonPath.read(route, "$.id");

        mvc.perform(post("/api/schedules").with(as(admin, "ADMIN")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Sched-Zeta\",\"routeId\":\"" + routeId
                                + "\",\"scheduleType\":\"REGULAR\",\"effectiveStartDate\":\"2026-01-01\",\"status\":\"ACTIVE\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.provenance.sourceTier").value("SRC_4"))
                .andExpect(jsonPath("$.provenance.attributionLabel").value("BusMate"));
    }

    private static Stop stopEntity(String name) {
        Stop s = new Stop();
        s.setName(name);
        Stop.Location loc = new Stop.Location();
        loc.setLatitude(6.9);
        loc.setLongitude(79.86);
        loc.setCity("City-" + name);
        loc.setCountry("Sri Lanka");
        s.setLocation(loc);
        return s;
    }
}
