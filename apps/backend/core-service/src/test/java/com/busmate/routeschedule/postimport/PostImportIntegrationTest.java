package com.busmate.routeschedule.postimport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import com.busmate.routeschedule.postimport.ai.PostReaderException;
import com.busmate.routeschedule.postimport.dto.PostReading;
import com.busmate.routeschedule.postimport.dto.ReadDeparture;
import com.busmate.routeschedule.postimport.dto.SkippedLine;

/**
 * INC-060: staff paste a post, an AI reads it, code checks the reading. Never calls a real AI provider —
 * {@link PostReaderClient} is replaced with a fake whose answer each test controls directly, so these tests
 * exercise the checks and the staff-only boundary, not Gemini.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("INC-060 an AI reads a pasted post for staff review")
class PostImportIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired private WebApplicationContext context;
    @MockitoBean private PostReaderClient postReaderClient;

    private MockMvc mvc;
    private final UUID mot = UUID.randomUUID();
    private final UUID passenger = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        when(postReaderClient.providerName()).thenReturn("gemini");
        when(postReaderClient.modelName()).thenReturn("gemini-2.5-flash");
    }

    private static RequestPostProcessor as(UUID id, String role) {
        return user(id.toString()).roles(role);
    }

    private String pasteBody(String text) {
        return "{\"pastedText\":\"" + text.replace("\"", "\\\"").replace("\n", "\\n") + "\"}";
    }

    @Test
    @DisplayName("INC-060 a grounded reading comes back with no flags")
    void inc060_groundedReadingHasNoFlags() throws Exception {
        String text = "6.30am Colombo to Galle - Super Line ABC-1234";
        when(postReaderClient.read(anyString())).thenReturn(new PostReading(null, 
                List.of(new ReadDeparture("6.30am", "Colombo", "Galle", "Super Line", List.of("ABC-1234"),
                        null, null, null, List.of(text))),
                List.of()));

        mvc.perform(post("/api/community/post-imports").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content(pasteBody(text)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("READ"))
                .andExpect(jsonPath("$.departures[0].grounded").value(true))
                .andExpect(jsonPath("$.departures[0].ungroundedFields").isEmpty())
                .andExpect(jsonPath("$.unaccountedLines").isEmpty());
    }

    @Test
    @DisplayName("INC-060 a claim not backed by its own quoted line is flagged, not silently trusted")
    void inc060_ungroundedClaimIsFlagged() throws Exception {
        String text = "6.30am Colombo to Galle";
        when(postReaderClient.read(anyString())).thenReturn(new PostReading(null, 
                List.of(new ReadDeparture("6.30am", "Colombo", "Galle", "Super Line", List.of(),
                        null, null, null, List.of(text))),
                List.of()));

        mvc.perform(post("/api/community/post-imports").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content(pasteBody(text)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.departures[0].grounded").value(false))
                .andExpect(jsonPath("$.departures[0].ungroundedFields[0]").value("operatorName"));
    }

    @Test
    @DisplayName("INC-060 a timed line neither read nor skipped is left unaccounted, not dropped")
    void inc060_unclaimedTimedLineIsUnaccounted() throws Exception {
        String read = "6.30am Colombo to Galle";
        String missed = "7.15am Colombo to Matara";
        String text = read + "\n" + missed;
        when(postReaderClient.read(anyString())).thenReturn(new PostReading(null, 
                List.of(new ReadDeparture("6.30am", "Colombo", "Galle", null, List.of(),
                        null, null, null, List.of(read))),
                List.of()));

        mvc.perform(post("/api/community/post-imports").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content(pasteBody(text)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unaccountedLines[0]").value(missed));
    }

    @Test
    @DisplayName("INC-060 a schema-invalid or unreachable-provider answer is rejected whole, not shown partial")
    void inc060_readerFailureIsStoredAsFailedNotPartial() throws Exception {
        when(postReaderClient.read(anyString())).thenThrow(new PostReaderException("boom"));

        mvc.perform(post("/api/community/post-imports").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content(pasteBody("6.30am Colombo to Galle")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FAILED"))
                .andExpect(jsonPath("$.departures").isEmpty());
    }

    @Test
    @DisplayName("INC-060 a skipped line (a disclaimer, a fare row) is not treated as missed")
    void inc060_skippedLineIsAccountedFor() throws Exception {
        String skippedLine = "8.00pm Fares subject to change";
        when(postReaderClient.read(anyString())).thenReturn(new PostReading(null, 
                List.of(),
                List.of(new SkippedLine(skippedLine, "not a departure — a disclaimer"))));

        mvc.perform(post("/api/community/post-imports").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content(pasteBody(skippedLine)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unaccountedLines").isEmpty())
                .andExpect(jsonPath("$.skipped[0].line").value(skippedLine));
    }

    @Test
    @DisplayName("INC-060 only staff may read a post, and may read one back")
    void inc060_staffOnly() throws Exception {
        when(postReaderClient.read(anyString())).thenReturn(new PostReading(null, List.of(), List.of()));

        mvc.perform(post("/api/community/post-imports").with(as(passenger, "PASSENGER"))
                        .contentType(MediaType.APPLICATION_JSON).content(pasteBody("6.30am Colombo to Galle")))
                .andExpect(status().isForbidden());

        String location = mvc.perform(post("/api/community/post-imports").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content(pasteBody("6.30am Colombo to Galle")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        UUID id = UUID.fromString(com.jayway.jsonpath.JsonPath.read(location, "$.id").toString());

        mvc.perform(get("/api/community/post-imports/" + id).with(as(passenger, "PASSENGER")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/community/post-imports/" + id).with(as(mot, "MOT")))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("INC-060 past imports are listed newest first")
    void inc060_listedNewestFirst() throws Exception {
        when(postReaderClient.read(anyString())).thenReturn(new PostReading(null, List.of(), List.of()));

        mvc.perform(post("/api/community/post-imports").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content(pasteBody("first post")))
                .andExpect(status().isOk());
        mvc.perform(post("/api/community/post-imports").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content(pasteBody("second post")))
                .andExpect(status().isOk());

        mvc.perform(get("/api/community/post-imports").with(as(mot, "MOT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].createdBy").value(mot.toString()));
    }

    @Test
    @DisplayName("INC-060 an empty paste is rejected before any AI call")
    void inc060_emptyPasteRejected() throws Exception {
        mvc.perform(post("/api/community/post-imports").with(as(mot, "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content(pasteBody("")))
                .andExpect(status().isBadRequest());
    }
}
