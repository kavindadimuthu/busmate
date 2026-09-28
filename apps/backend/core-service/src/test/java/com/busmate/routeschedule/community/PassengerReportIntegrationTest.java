package com.busmate.routeschedule.community;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

import com.busmate.routeschedule.scheduling.entity.Schedule;
import com.busmate.routeschedule.support.OperationsFixtures;
import com.busmate.routeschedule.AbstractPostgresIntegrationTest;
import com.jayway.jsonpath.JsonPath;

/** A passenger reports something wrong; staff triage it (INC-056). Not a changeset: nothing is applied. */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("INC-056 passengers report a problem")
class PassengerReportIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private OperationsFixtures fx;

    private MockMvc mvc;
    private final UUID mot = UUID.randomUUID();
    private final UUID passenger = UUID.randomUUID();
    private final UUID otherPassenger = UUID.randomUUID();
    private Schedule schedule;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        schedule = fx.schedule(fx.route(fx.routeGroup()));
    }

    private static RequestPostProcessor as(UUID id, String role) {
        return user(id.toString()).roles(role);
    }

    private String body(UUID targetId, String reason, String note) {
        return body("SCHEDULE", targetId, reason, note);
    }

    private String body(String entityType, UUID targetId, String reason, String note) {
        return "{\"entityType\":\"" + entityType + "\",\"targetId\":\"" + targetId + "\",\"reason\":\"" + reason + "\""
                + (note == null ? "" : ",\"note\":\"" + note + "\"") + "}";
    }

    @Test
    @DisplayName("INC-056 any signed-in user can report; nothing is a contributor-only gate")
    void inc056_anyoneSignedInCanReport() throws Exception {
        mvc.perform(post("/api/community/reports").with(as(passenger, "PASSENGER"))
                        .contentType(MediaType.APPLICATION_JSON).content(body(schedule.getId(), "WRONG_TIME", "It leaves at 6, not 5.")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.entityType").value("SCHEDULE"))
                .andExpect(jsonPath("$.note").value("It leaves at 6, not 5."));
    }

    @Test
    @DisplayName("INC-056 a reason that doesn't fit what was reported is refused; who runs it fits either kind")
    void inc056_mismatchedReasonRefused() throws Exception {
        UUID workingId = createWorking();
        mvc.perform(post("/api/community/reports").with(as(passenger, "PASSENGER"))
                        .contentType(MediaType.APPLICATION_JSON).content(body("SCHEDULE_WORKING", workingId, "WRONG_TIME", null)))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/community/reports").with(as(passenger, "PASSENGER"))
                        .contentType(MediaType.APPLICATION_JSON).content(body("SCHEDULE_WORKING", workingId, "WRONG_OPERATOR_OR_PLATE", null)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.entityType").value("SCHEDULE_WORKING"));
        mvc.perform(post("/api/community/reports").with(as(otherPassenger, "PASSENGER"))
                        .contentType(MediaType.APPLICATION_JSON).content(body(schedule.getId(), "WRONG_OPERATOR_OR_PLATE", null)))
                .andExpect(status().isCreated());
    }

    /** A working recorded by staff on {@link #schedule}, through the real endpoint. */
    private UUID createWorking() throws Exception {
        String res = mvc.perform(post("/api/schedules/" + schedule.getId() + "/workings").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"operatorNameObserved\":\"Test Travels\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return UUID.fromString(JsonPath.read(res, "$.id"));
    }

    @Test
    @DisplayName("INC-056 reporting something that does not exist is refused")
    void inc056_unknownTargetRefused() throws Exception {
        mvc.perform(post("/api/community/reports").with(as(passenger, "PASSENGER"))
                        .contentType(MediaType.APPLICATION_JSON).content(body(UUID.randomUUID(), "WRONG_TIME", null)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("INC-056 a second open report on the same thing by the same person is refused, but a different person's is not")
    void inc056_oneOpenReportPerPerson() throws Exception {
        mvc.perform(post("/api/community/reports").with(as(passenger, "PASSENGER"))
                .contentType(MediaType.APPLICATION_JSON).content(body(schedule.getId(), "WRONG_TIME", null)))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/community/reports").with(as(passenger, "PASSENGER"))
                .contentType(MediaType.APPLICATION_JSON).content(body(schedule.getId(), "WRONG_DAYS", null)))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/community/reports").with(as(otherPassenger, "PASSENGER"))
                .contentType(MediaType.APPLICATION_JSON).content(body(schedule.getId(), "WRONG_TIME", null)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("INC-056 only staff see the queue or resolve a report; the reporter's identity never appears in it")
    void inc056_staffOnlyQueueAndNoReporterIdentity() throws Exception {
        mvc.perform(post("/api/community/reports").with(as(passenger, "PASSENGER"))
                .contentType(MediaType.APPLICATION_JSON).content(body(schedule.getId(), "BUS_DID_NOT_COME", null)))
                .andExpect(status().isCreated());

        mvc.perform(get("/api/community/reports").with(as(passenger, "PASSENGER"))).andExpect(status().isForbidden());

        String res = mvc.perform(get("/api/community/reports?status=OPEN").with(as(mot, "MOT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andReturn().getResponse().getContentAsString();
        assertThat(res).doesNotContain(passenger.toString());
        String id = JsonPath.read(res, "$.content[0].id");

        mvc.perform(post("/api/community/reports/" + id + "/resolve").with(as(passenger, "PASSENGER"))
                .contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isForbidden());

        mvc.perform(post("/api/community/reports/" + id + "/resolve").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"note\":\"Checked, it's correct.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.resolutionNote").value("Checked, it's correct."));

        mvc.perform(post("/api/community/reports/" + id + "/resolve").with(as(mot, "MOT"))
                .contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isConflict());
        mvc.perform(get("/api/community/reports?status=OPEN").with(as(mot, "MOT")))
                .andExpect(jsonPath("$.content.length()").value(0));
    }
}
