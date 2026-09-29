package com.busmate.routeschedule.postimport;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.List;
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
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.busmate.routeschedule.AbstractPostgresIntegrationTest;
import com.busmate.routeschedule.postimport.ai.PostReaderClient;
import com.busmate.routeschedule.postimport.dto.DraftResolutionRequest;
import com.busmate.routeschedule.postimport.dto.PostReading;
import com.busmate.routeschedule.postimport.dto.ReadDeparture;
import com.busmate.routeschedule.postimport.dto.ResolvedRow;
import com.busmate.routeschedule.postimport.dto.RowAction;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;

/**
 * INC-061: staff correct an AI's reading, match places to stops, and load the result as reports. Writes go
 * straight into real Postgres through the same staff APIs a human already uses by hand (ADR-025) — never a
 * real AI call, {@link PostReaderClient} is faked exactly as it is for INC-060's own tests.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("INC-061 staff correct, match stops and load an AI-read post")
class PostImportLoadIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private ObjectMapper objectMapper;
    @MockitoBean private PostReaderClient postReaderClient;

    private MockMvc mvc;
    private final UUID mot = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        when(postReaderClient.providerName()).thenReturn("gemini");
        when(postReaderClient.modelName()).thenReturn("gemini-2.5-flash");
    }

    private static RequestPostProcessor as(UUID id, String role) {
        return user(id.toString()).roles(role);
    }

    private UUID createDraft(String text, ReadDeparture... departures) throws Exception {
        when(postReaderClient.read(anyString())).thenReturn(new PostReading(null, List.of(departures), List.of()));
        String body = "{\"pastedText\":\"" + text.replace("\"", "\\\"").replace("\n", "\\n") + "\"}";
        String response = mvc.perform(post("/api/community/post-imports").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return UUID.fromString(JsonPath.read(response, "$.id").toString());
    }

    private String json(Object o) throws Exception {
        return objectMapper.writeValueAsString(o);
    }

    @Test
    @DisplayName("INC-061 a clean row loads a real stop, route, schedule and working")
    void inc061_cleanRowLoadsRealData() throws Exception {
        String header = "Embilipitiya INC061A to Colombo INC061A";
        String line = "01:15 Weerasinghe Midnight Express ND-1712";
        UUID draftId = createDraft(header + "\n\n" + line, new ReadDeparture("01:15", "Embilipitiya INC061A", "Colombo INC061A",
                "Weerasinghe Midnight Express", List.of("ND-1712"), null, null, null, List.of(line)));

        DraftResolutionRequest resolution = new DraftResolutionRequest("Community timetable post (13 Oct 2025)",
                LocalDate.of(2025, 10, 13),
                List.of(new ResolvedRow(0, RowAction.LOAD, "01:15", "Embilipitiya INC061A", "Colombo INC061A",
                        "Weerasinghe Midnight Express", List.of("ND-1712"), null, null, null, null, null, null)),
                List.of());

        mvc.perform(put("/api/community/post-imports/" + draftId + "/resolution").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content(json(resolution)))
                .andExpect(status().isOk());

        mvc.perform(post("/api/community/post-imports/" + draftId + "/approve").with(as(mot, "MOT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.loadStatus").value("LOADED"))
                .andExpect(jsonPath("$.loadResult.stopsCreated").value(2))
                .andExpect(jsonPath("$.loadResult.routesCreated").value(1))
                .andExpect(jsonPath("$.loadResult.schedulesCreated").value(1))
                .andExpect(jsonPath("$.loadResult.workingsCreated").value(1))
                .andExpect(jsonPath("$.loadResult.rows[0].status").value("CREATED"));
    }

    @Test
    @DisplayName("INC-061 loading the same resolution twice creates nothing new the second time")
    void inc061_reapprovingIsIdempotent() throws Exception {
        String header = "Embilipitiya INC061B to Colombo INC061B";
        String line = "02:00 Samitha Super Line NE-0629";
        UUID draftId = createDraft(header + "\n\n" + line, new ReadDeparture("02:00", "Embilipitiya INC061B", "Colombo INC061B",
                "Samitha Super Line", List.of("NE-0629"), null, null, null, List.of(line)));

        DraftResolutionRequest resolution = new DraftResolutionRequest("Community timetable post", LocalDate.of(2025, 10, 13),
                List.of(new ResolvedRow(0, RowAction.LOAD, "02:00", "Embilipitiya INC061B", "Colombo INC061B",
                        "Samitha Super Line", List.of("NE-0629"), null, null, null, null, null, null)),
                List.of());
        mvc.perform(put("/api/community/post-imports/" + draftId + "/resolution").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content(json(resolution)))
                .andExpect(status().isOk());
        mvc.perform(post("/api/community/post-imports/" + draftId + "/approve").with(as(mot, "MOT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.loadResult.stopsCreated").value(2));

        mvc.perform(post("/api/community/post-imports/" + draftId + "/approve").with(as(mot, "MOT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.loadResult.stopsCreated").value(0))
                .andExpect(jsonPath("$.loadResult.routesCreated").value(0))
                .andExpect(jsonPath("$.loadResult.schedulesCreated").value(0))
                .andExpect(jsonPath("$.loadResult.workingsCreated").value(0))
                .andExpect(jsonPath("$.loadResult.rows[0].status").value("ALREADY_THERE"));
    }

    @Test
    @DisplayName("INC-061 a flagged row needs an override reason before it can load")
    void inc061_flaggedRowNeedsOverrideReason() throws Exception {
        String line = "03:00 Colombo to Galle";
        UUID draftId = createDraft(line, new ReadDeparture("03:00", "Embilipitiya INC061C", "Colombo INC061C",
                "Invented Operator Not In Text", List.of(), null, null, null, List.of(line)));

        DraftResolutionRequest withoutReason = new DraftResolutionRequest("label", LocalDate.of(2025, 10, 13),
                List.of(new ResolvedRow(0, RowAction.LOAD, "03:00", "Embilipitiya INC061C", "Colombo INC061C",
                        "Invented Operator Not In Text", List.of(), null, null, null, null, null, null)),
                List.of());
        mvc.perform(put("/api/community/post-imports/" + draftId + "/resolution").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content(json(withoutReason)))
                .andExpect(status().isOk());

        mvc.perform(post("/api/community/post-imports/" + draftId + "/approve").with(as(mot, "MOT")))
                .andExpect(status().isBadRequest());

        DraftResolutionRequest withReason = new DraftResolutionRequest("label", LocalDate.of(2025, 10, 13),
                List.of(new ResolvedRow(0, RowAction.LOAD, "03:00", "Embilipitiya INC061C", "Colombo INC061C",
                        "Invented Operator Not In Text", List.of(), null, null, null, null, null,
                        "Checked manually against the post, it's correct")),
                List.of());
        mvc.perform(put("/api/community/post-imports/" + draftId + "/resolution").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content(json(withReason)))
                .andExpect(status().isOk());
        mvc.perform(post("/api/community/post-imports/" + draftId + "/approve").with(as(mot, "MOT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.loadStatus").value("LOADED"));
    }

    @Test
    @DisplayName("INC-061 an unaccounted line must be acknowledged before approving")
    void inc061_unaccountedLineMustBeAcknowledged() throws Exception {
        String read = "04:00 Colombo to Galle";
        String missed = "05:00 Colombo to Matara";
        UUID draftId = createDraft(read + "\n" + missed, new ReadDeparture("04:00", "Embilipitiya INC061D",
                "Colombo INC061D", null, List.of(), null, null, null, List.of(read)));

        DraftResolutionRequest withoutAck = new DraftResolutionRequest("label", LocalDate.of(2025, 10, 13),
                List.of(new ResolvedRow(0, RowAction.SKIP, "04:00", "Embilipitiya INC061D", "Colombo INC061D",
                        null, List.of(), null, null, null, null, null, null)),
                List.of());
        mvc.perform(put("/api/community/post-imports/" + draftId + "/resolution").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content(json(withoutAck)))
                .andExpect(status().isOk());
        mvc.perform(post("/api/community/post-imports/" + draftId + "/approve").with(as(mot, "MOT")))
                .andExpect(status().isBadRequest());

        DraftResolutionRequest withAck = new DraftResolutionRequest("label", LocalDate.of(2025, 10, 13),
                List.of(new ResolvedRow(0, RowAction.SKIP, "04:00", "Embilipitiya INC061D", "Colombo INC061D",
                        null, List.of(), null, null, null, null, null, null)),
                List.of(missed));
        mvc.perform(put("/api/community/post-imports/" + draftId + "/resolution").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content(json(withAck)))
                .andExpect(status().isOk());
        mvc.perform(post("/api/community/post-imports/" + draftId + "/approve").with(as(mot, "MOT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.loadResult.rows[0].status").value("SKIPPED"));
    }

    @Test
    @DisplayName("INC-061 approving with no saved resolution is refused")
    void inc061_approveWithoutResolutionRefused() throws Exception {
        UUID draftId = createDraft("06:00 Colombo to Galle",
                new ReadDeparture("06:00", "A", "B", null, List.of(), null, null, null, List.of("06:00 Colombo to Galle")));

        mvc.perform(post("/api/community/post-imports/" + draftId + "/approve").with(as(mot, "MOT")))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("INC-061 a place name matching an existing stop is offered as a candidate")
    void inc061_stopCandidateSearch() throws Exception {
        String header = "Uniquetown INC061E to Colombo INC061E";
        String line = "07:00 Some Operator PQ-1234";
        UUID draftId = createDraft(header + "\n\n" + line, new ReadDeparture("07:00", "Uniquetown INC061E", "Colombo INC061E",
                "Some Operator", List.of("PQ-1234"), null, null, null, List.of(line)));
        DraftResolutionRequest resolution = new DraftResolutionRequest("label", LocalDate.of(2025, 10, 13),
                List.of(new ResolvedRow(0, RowAction.LOAD, "07:00", "Uniquetown INC061E", "Colombo INC061E",
                        "Some Operator", List.of("PQ-1234"), null, null, null, null, null, null)),
                List.of());
        mvc.perform(put("/api/community/post-imports/" + draftId + "/resolution").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content(json(resolution)))
                .andExpect(status().isOk());
        mvc.perform(post("/api/community/post-imports/" + draftId + "/approve").with(as(mot, "MOT")))
                .andExpect(status().isOk());

        mvc.perform(get("/api/community/post-imports/stop-candidates").with(as(mot, "MOT"))
                        .param("name", "Uniquetown INC061E"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Uniquetown INC061E"));
    }
}
