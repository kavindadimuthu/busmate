package com.busmate.routeschedule.network;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
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
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.busmate.routeschedule.AbstractPostgresIntegrationTest;
import com.busmate.routeschedule.scheduling.entity.Schedule;
import com.busmate.routeschedule.support.OperationsFixtures;
import com.jayway.jsonpath.JsonPath;

/** Staff can record a third party's report as a report, dated to when it was made (ADR-025). */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("INC-047 reports dated to their source")
class ReportedProvenanceIntegrationTest extends AbstractPostgresIntegrationTest {

    private static final String POST_DATE = "2025-10-13";
    private static final String REPORT = ",\"sourceTier\":\"SRC_5\",\"observedOn\":\"" + POST_DATE + "\","
            + "\"attributionLabel\":\"Community timetable post (13 Oct 2025)\"";

    @Autowired private WebApplicationContext context;
    @Autowired private OperationsFixtures fx;

    private MockMvc mvc;
    private final UUID mot = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    private static RequestPostProcessor as(UUID id, String role) {
        return user(id.toString()).roles(role);
    }

    private ResultActions send(String path, String json, String role) throws Exception {
        return mvc.perform(post(path).with(as(mot, role)).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private static String stop(String name, String extra) {
        return "{\"name\":\"" + name + "\",\"location\":{\"city\":\"Embilipitiya\",\"country\":\"Sri Lanka\"}" + extra + "}";
    }

    private String create(String path, String json) throws Exception {
        String body = send(path, json, "MOT").andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.id");
    }

    // ───────────────────────────── recording a report ─────────────────────────────

    @Test
    @DisplayName("INC-047 staff can record a stop as a report dated to the post, credited to it")
    void inc047_stopAsReport() throws Exception {
        send("/api/stops", stop("Embilipitiya Central Bus Stand", REPORT), "MOT")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.provenance.sourceTier").value("SRC_5"))
                .andExpect(jsonPath("$.provenance.observedAt").value(POST_DATE + "T00:00:00Z"))
                .andExpect(jsonPath("$.provenance.attributionLabel").value("Community timetable post (13 Oct 2025)"));
    }

    @Test
    @DisplayName("INC-047 a route, a schedule and a working read as reported, with the date they date from")
    void inc047_routeScheduleWorkingAsReport() throws Exception {
        String routeId = create("/api/routes", "{\"name\":\"Embilipitiya 03 Colombo\"" + REPORT + "}");
        send("/api/routes", "{\"name\":\"Another\"" + REPORT + "}", "MOT")
                .andExpect(jsonPath("$.trust.label").value("REPORTED"))
                .andExpect(jsonPath("$.trust.observedAt").value(POST_DATE + "T00:00:00Z"));

        String scheduleId = create("/api/schedules", "{\"name\":\"05:00 ERC Super Express\",\"routeId\":\"" + routeId
                + "\",\"scheduleType\":\"REGULAR\",\"status\":\"ACTIVE\",\"effectiveStartDate\":\"" + POST_DATE + "\"" + REPORT + "}");

        send("/api/schedules/" + scheduleId + "/workings",
                "{\"operatorNameObserved\":\"ERC Super Express\",\"vehicles\":[{\"plateObserved\":\"NB-7886\"}]" + REPORT + "}", "MOT")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.trust.label").value("REPORTED"))
                .andExpect(jsonPath("$.trust.observedAt").value(POST_DATE + "T00:00:00Z"))
                .andExpect(jsonPath("$.vehicles[0].trust.label").value("REPORTED"))
                .andExpect(jsonPath("$.vehicles[0].trust.observedAt").value(POST_DATE + "T00:00:00Z"));
    }

    @Test
    @DisplayName("INC-047 ADMIN can record a report too")
    void inc047_adminToo() throws Exception {
        send("/api/stops", stop("Admin Report Stop", REPORT), "ADMIN").andExpect(status().isCreated())
                .andExpect(jsonPath("$.provenance.sourceTier").value("SRC_5"));
    }

    // ───────────────────────────── what must still be refused ─────────────────────────────

    @Test
    @DisplayName("INC-047 a date in the future is refused, and a derived source is still refused")
    void inc047_refusals() throws Exception {
        String tomorrow = LocalDate.now().plusDays(1).toString();
        send("/api/stops", stop("Future", ",\"sourceTier\":\"SRC_5\",\"observedOn\":\"" + tomorrow + "\""), "MOT")
                .andExpect(status().isBadRequest());
        send("/api/stops", stop("Derived", ",\"sourceTier\":\"SRC_6\""), "MOT").andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("INC-047 only MOT can still mark a record official")
    void inc047_officialStillMotOnly() throws Exception {
        send("/api/stops", stop("Official Attempt", ",\"sourceTier\":\"SRC_1\""), "ADMIN").andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("INC-047 a request that says neither changes nothing: observation by BusMate, observed now")
    void inc047_defaultsUnchanged() throws Exception {
        String body = send("/api/stops", stop("Plain", ""), "MOT").andExpect(status().isCreated())
                .andExpect(jsonPath("$.provenance.sourceTier").value("SRC_4"))
                .andReturn().getResponse().getContentAsString();
        Instant observed = Instant.parse(JsonPath.read(body, "$.provenance.observedAt"));
        assertThat(Duration.between(observed, Instant.now()).abs()).isLessThan(Duration.ofMinutes(1));
    }

    @Test
    @DisplayName("INC-047 a date alone dates a normal record without changing its source")
    void inc047_dateWithoutTier() throws Exception {
        send("/api/stops", stop("Dated", ",\"observedOn\":\"" + POST_DATE + "\""), "MOT")
                .andExpect(jsonPath("$.provenance.sourceTier").value("SRC_4"))
                .andExpect(jsonPath("$.provenance.observedAt").value(POST_DATE + "T00:00:00Z"));
    }

    // ───────────────────────────── editing ─────────────────────────────

    @Test
    @DisplayName("INC-047 correcting a typo in a report does not make it look freshly confirmed")
    void inc047_editingAReportKeepsItsAge() throws Exception {
        String id = create("/api/routes", "{\"name\":\"Route 03\"" + REPORT + "}");

        mvc.perform(put("/api/routes/" + id).with(as(mot, "MOT")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Route 03\",\"description\":\"old road, typo fixed\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.provenance.sourceTier").value("SRC_5"))
                .andExpect(jsonPath("$.provenance.observedAt").value(POST_DATE + "T00:00:00Z"));
    }

    @Test
    @DisplayName("INC-047 an edit that states a new date re-dates the report")
    void inc047_editCanRedate() throws Exception {
        String id = create("/api/routes", "{\"name\":\"Route 03\"" + REPORT + "}");

        mvc.perform(put("/api/routes/" + id).with(as(mot, "MOT")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Route 03\",\"observedOn\":\"2026-01-05\"}"))
                .andExpect(jsonPath("$.provenance.sourceTier").value("SRC_5"))
                .andExpect(jsonPath("$.provenance.observedAt").value("2026-01-05T00:00:00Z"));
    }

    @Test
    @DisplayName("INC-047 other tiers keep today's behaviour: an edit observes them now")
    void inc047_otherTiersStillObservedOnEdit() throws Exception {
        String id = create("/api/routes", "{\"name\":\"Route 122\",\"sourceTier\":\"SRC_4\",\"observedOn\":\"" + POST_DATE + "\"}");

        String body = mvc.perform(put("/api/routes/" + id).with(as(mot, "MOT")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Route 122\",\"description\":\"checked\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        Instant observed = Instant.parse(JsonPath.read(body, "$.provenance.observedAt"));
        assertThat(Duration.between(observed, Instant.now()).abs()).isLessThan(Duration.ofMinutes(1));
    }
}
