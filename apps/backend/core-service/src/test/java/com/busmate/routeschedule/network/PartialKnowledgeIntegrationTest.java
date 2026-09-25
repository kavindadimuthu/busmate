package com.busmate.routeschedule.network;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import com.busmate.routeschedule.network.entity.RouteGroup;
import com.busmate.routeschedule.network.entity.Stop;
import com.busmate.routeschedule.network.repository.RouteGroupRepository;
import com.busmate.routeschedule.network.repository.StopRepository;
import com.jayway.jsonpath.JsonPath;

/** A route or schedule can be recorded with only what is known, and says how complete it is (ADR-023). */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("INC-044 partial route and schedule knowledge")
class PartialKnowledgeIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private StopRepository stops;
    @Autowired private RouteGroupRepository groups;

    private MockMvc mvc;
    private final UUID mot = UUID.randomUUID();
    private Stop embilipitiya;
    private Stop colombo;
    private RouteGroup group;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        embilipitiya = stops.saveAndFlush(stop("Embilipitiya"));
        colombo = stops.saveAndFlush(stop("Colombo Pettah"));
        RouteGroup g = new RouteGroup();
        g.setName("Embilipitiya - Colombo (old road)");
        group = groups.saveAndFlush(g);
    }

    private static RequestPostProcessor asMot(UUID id) {
        return user(id.toString()).roles("MOT");
    }

    private static Stop stop(String name) {
        Stop s = new Stop();
        s.setName(name);
        Stop.Location loc = new Stop.Location();
        loc.setLatitude(6.5);
        loc.setLongitude(80.5);
        loc.setCity(name);
        loc.setCountry("Sri Lanka");
        s.setLocation(loc);
        return s;
    }

    private String createRoute(String json) throws Exception {
        String body = mvc.perform(post("/api/routes").with(asMot(mot)).contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.id");
    }

    private String fullRoute(String name, String extra) {
        return "{\"name\":\"" + name + "\",\"routeGroupId\":\"" + group.getId() + "\",\"startStopId\":\""
                + embilipitiya.getId() + "\",\"endStopId\":\"" + colombo.getId() + "\",\"direction\":\"OUTBOUND\","
                + "\"distanceKm\":165.0" + extra + "}";
    }

    // ───────────────────────────── routes ─────────────────────────────

    @Test
    @DisplayName("INC-044 a route can be created with only a name")
    void inc044_routeWithOnlyAName() throws Exception {
        String id = createRoute("{\"name\":\"Embilipitiya 03 Colombo (old road)\",\"routeNumber\":\"03\"}");

        mvc.perform(get("/api/routes/" + id).with(asMot(mot)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.routeNumber").value("03"))
                .andExpect(jsonPath("$.routeGroupId").doesNotExist())
                .andExpect(jsonPath("$.startStopId").doesNotExist())
                .andExpect(jsonPath("$.endStopId").doesNotExist())
                .andExpect(jsonPath("$.direction").doesNotExist())
                .andExpect(jsonPath("$.stopListCompleteness").value("UNKNOWN"))
                .andExpect(jsonPath("$.routeStops.length()").value(0));
    }

    @Test
    @DisplayName("INC-044 routes with no group share one namespace, so a duplicate name is refused")
    void inc044_groupLessNamesAreUnique() throws Exception {
        createRoute("{\"name\":\"Route 03\"}");
        mvc.perform(post("/api/routes").with(asMot(mot)).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Route 03\"}"))
                .andExpect(status().isConflict());
        createRoute("{\"name\":\"Route 122\"}");
    }

    @Test
    @DisplayName("INC-044 a route known only by its endpoints gets those two as its stops, unlisted stops are not invented")
    void inc044_endpointsBecomeTheStops() throws Exception {
        String id = createRoute(fullRoute("Route 03", ""));

        mvc.perform(get("/api/routes/" + id).with(asMot(mot)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.routeStops.length()").value(2))
                .andExpect(jsonPath("$.routeStops[0].stopId").value(embilipitiya.getId().toString()))
                .andExpect(jsonPath("$.routeStops[0].stopOrder").value(1))
                .andExpect(jsonPath("$.routeStops[1].stopId").value(colombo.getId().toString()))
                .andExpect(jsonPath("$.routeStops[1].stopOrder").value(2))
                // having two stops is not a claim that they are all the stops
                .andExpect(jsonPath("$.stopListCompleteness").value("UNKNOWN"));
    }

    @Test
    @DisplayName("INC-044 a listed stop sequence is left exactly as given, not topped up with endpoints")
    void inc044_listedStopsAreNotTouched() throws Exception {
        Stop middle = stops.saveAndFlush(stop("Pelmadulla"));
        String id = createRoute(fullRoute("Route 03", ",\"routeStops\":[{\"stopId\":\"" + middle.getId() + "\",\"stopOrder\":1}]"));

        mvc.perform(get("/api/routes/" + id).with(asMot(mot)))
                .andExpect(jsonPath("$.routeStops.length()").value(1))
                .andExpect(jsonPath("$.routeStops[0].stopId").value(middle.getId().toString()));
    }

    @Test
    @DisplayName("INC-044 a person can say a route's stop list is partial or complete; it is returned and kept on edit")
    void inc044_completenessIsStatedAndKept() throws Exception {
        String id = createRoute(fullRoute("Route 03", ",\"stopListCompleteness\":\"PARTIAL\""));
        mvc.perform(get("/api/routes/" + id).with(asMot(mot))).andExpect(jsonPath("$.stopListCompleteness").value("PARTIAL"));

        // an edit that does not mention it keeps it
        mvc.perform(put("/api/routes/" + id).with(asMot(mot)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Route 03\",\"description\":\"old road\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stopListCompleteness").value("PARTIAL"));

        mvc.perform(put("/api/routes/" + id).with(asMot(mot)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Route 03\",\"stopListCompleteness\":\"COMPLETE\"}"))
                .andExpect(jsonPath("$.stopListCompleteness").value("COMPLETE"));
    }

    @Test
    @DisplayName("INC-044 editing a route without restating its group, endpoints or direction leaves them alone")
    void inc044_editKeepsWhatItDoesNotMention() throws Exception {
        String id = createRoute(fullRoute("Route 03", ""));

        mvc.perform(put("/api/routes/" + id).with(asMot(mot)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Route 03\",\"description\":\"via Pelmadulla\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("via Pelmadulla"))
                .andExpect(jsonPath("$.routeGroupId").value(group.getId().toString()))
                .andExpect(jsonPath("$.startStopId").value(embilipitiya.getId().toString()))
                .andExpect(jsonPath("$.endStopId").value(colombo.getId().toString()))
                .andExpect(jsonPath("$.direction").value("OUTBOUND"));
    }

    @Test
    @DisplayName("INC-044 a partial route appears in staff lists and does not break passenger search")
    void inc044_partialRouteDoesNotBreakReads() throws Exception {
        createRoute("{\"name\":\"Bare route\"}");
        createRoute(fullRoute("Route 03", ""));

        mvc.perform(get("/api/routes").with(asMot(mot))).andExpect(status().isOk());
        mvc.perform(get("/api/routes/all").with(asMot(mot))).andExpect(status().isOk());
        mvc.perform(get("/api/passenger/find-my-bus?fromStopId=" + embilipitiya.getId() + "&toStopId=" + colombo.getId()))
                .andExpect(status().isOk());
    }

    // ───────────────────────────── schedules ─────────────────────────────

    private String createSchedule(String routeId, String extra) throws Exception {
        String body = mvc.perform(post("/api/schedules").with(asMot(mot)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"05:00 ERC Super Express\",\"routeId\":\"" + routeId
                                + "\",\"scheduleType\":\"REGULAR\",\"status\":\"ACTIVE\"" + extra + "}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.id");
    }

    @Test
    @DisplayName("INC-044 a schedule without a start date takes today's, and is UNKNOWN in timing until someone says")
    void inc044_scheduleWithoutStartDate() throws Exception {
        String routeId = createRoute(fullRoute("Route 03", ""));
        String id = createSchedule(routeId, "");

        mvc.perform(get("/api/schedules/" + id).with(asMot(mot)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.effectiveStartDate").value(LocalDate.now().toString()))
                .andExpect(jsonPath("$.timingCompleteness").value("UNKNOWN"));
    }

    @Test
    @DisplayName("INC-044 a stated start date and timing marker are kept, and an edit that omits them keeps them")
    void inc044_scheduleStatedValuesKept() throws Exception {
        String routeId = createRoute(fullRoute("Route 03", ""));
        String id = createSchedule(routeId, ",\"effectiveStartDate\":\"2025-10-13\",\"timingCompleteness\":\"ORIGIN_ONLY\"");

        mvc.perform(get("/api/schedules/" + id).with(asMot(mot)))
                .andExpect(jsonPath("$.effectiveStartDate").value("2025-10-13"))
                .andExpect(jsonPath("$.timingCompleteness").value("ORIGIN_ONLY"));

        mvc.perform(put("/api/schedules/" + id).with(asMot(mot)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"05:00 ERC Super Express\",\"routeId\":\"" + routeId
                                + "\",\"scheduleType\":\"REGULAR\",\"status\":\"ACTIVE\",\"description\":\"daily\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("daily"))
                .andExpect(jsonPath("$.effectiveStartDate").value("2025-10-13"))
                .andExpect(jsonPath("$.timingCompleteness").value("ORIGIN_ONLY"));
    }

    @Test
    @DisplayName("INC-044 the markers are stored as the schema allows, and nothing else")
    void inc044_markersAreConstrained() {
        assertThat(com.busmate.routeschedule.network.enums.StopListCompletenessEnum.values())
                .extracting(Enum::name).containsExactlyInAnyOrder("COMPLETE", "PARTIAL", "UNKNOWN");
        assertThat(com.busmate.routeschedule.scheduling.enums.TimingCompletenessEnum.values())
                .extracting(Enum::name).containsExactlyInAnyOrder("ALL_STOPS", "ENDPOINTS_ONLY", "ORIGIN_ONLY", "UNKNOWN");
    }
}
