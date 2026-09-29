package com.busmate.routeschedule.scheduling;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
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
import com.busmate.routeschedule.fleet.entity.Bus;
import com.busmate.routeschedule.fleet.entity.Operator;
import com.busmate.routeschedule.fleet.enums.ServiceClassEnum;
import com.busmate.routeschedule.network.entity.Route;
import com.busmate.routeschedule.network.entity.RouteGroup;
import com.busmate.routeschedule.network.entity.RouteStop;
import com.busmate.routeschedule.network.entity.Stop;
import com.busmate.routeschedule.network.repository.RouteStopRepository;
import com.busmate.routeschedule.network.repository.StopRepository;
import com.busmate.routeschedule.operations.entity.Trip;
import com.busmate.routeschedule.operations.repository.TripRepository;
import com.busmate.routeschedule.scheduling.entity.Schedule;
import com.busmate.routeschedule.scheduling.entity.ScheduleStop;
import com.busmate.routeschedule.scheduling.repository.ScheduleStopRepository;
import com.busmate.routeschedule.support.OperationsFixtures;
import com.jayway.jsonpath.JsonPath;

/** Who normally works a departure (ADR-024): claims that may be unresolved, display-only. */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("INC-045 schedule workings")
class ScheduleWorkingIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private OperationsFixtures fx;
    @Autowired private StopRepository stops;
    @Autowired private RouteStopRepository routeStops;
    @Autowired private ScheduleStopRepository scheduleStops;
    @Autowired private TripRepository trips;
    @Autowired private jakarta.persistence.EntityManager em;

    private MockMvc mvc;
    private final UUID mot = UUID.randomUUID();
    private Schedule schedule;
    private RouteGroup group;
    private Route route;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        group = fx.routeGroup();
        route = fx.route(group);
        schedule = fx.schedule(route);
    }

    private static RequestPostProcessor as(UUID id, String role) {
        return user(id.toString()).roles(role);
    }

    private ResultActions createWorking(String json) throws Exception {
        return mvc.perform(post("/api/schedules/" + schedule.getId() + "/workings").with(as(mot, "MOT"))
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private String createdId(String json) throws Exception {
        String body = createWorking(json).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.id");
    }

    private static String working(String operatorName, String extra) {
        return "{\"operatorNameObserved\":\"" + operatorName + "\"" + extra + "}";
    }

    // ───────────────────────────── what can be recorded ─────────────────────────────

    @Test
    @DisplayName("INC-045 a plate and an operator name as seen are enough, with no registry entry behind either")
    void inc045_recordsWhatWasSeen() throws Exception {
        createWorking(working("Weerasinghe Midnight Express",
                ",\"effectiveStartDate\":\"2025-10-13\",\"serviceClass\":\"SEMI_LUXURY\",\"vehicles\":[{\"plateObserved\":\" nd-1712 \"}]"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.operatorName").value("Weerasinghe Midnight Express"))
                .andExpect(jsonPath("$.operatorResolved").value(false))
                .andExpect(jsonPath("$.operatorId").doesNotExist())
                .andExpect(jsonPath("$.serviceClass").value("SEMI_LUXURY"))
                .andExpect(jsonPath("$.effectiveStartDate").value("2025-10-13"))
                .andExpect(jsonPath("$.vehicles.length()").value(1))
                .andExpect(jsonPath("$.vehicles[0].plate").value("ND-1712"))
                .andExpect(jsonPath("$.vehicles[0].resolved").value(false))
                .andExpect(jsonPath("$.vehicles[0].busId").doesNotExist())
                .andExpect(jsonPath("$.trust.label").exists());
    }

    @Test
    @DisplayName("INC-045 a request must say something, and a vehicle must be named")
    void inc045_mustSaySomething() throws Exception {
        createWorking("{}").andExpect(status().isBadRequest());
        createWorking(working("X", ",\"vehicles\":[{}]")).andExpect(status().isBadRequest());
        createWorking(working("X", ",\"vehicles\":[{\"plateObserved\":\"  \"}]")).andExpect(status().isBadRequest());
        // a class alone is a real claim
        createWorking("{\"serviceClass\":\"LUXURY\"}").andExpect(status().isCreated());
    }

    @Test
    @DisplayName("INC-045 several vehicles mean one of these, with no order; the same vehicle twice is refused")
    void inc045_rotation() throws Exception {
        createWorking(working("SLTB Kataragama", ",\"vehicles\":[{\"plateObserved\":\"NB-8127\"},{\"plateObserved\":\"NB-8276\"}]"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.vehicles.length()").value(2));

        createWorking(working("Another", ",\"vehicles\":[{\"plateObserved\":\"NB-1\"},{\"plateObserved\":\"nb-1\"}]"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("INC-045 it cannot end before it starts")
    void inc045_endsAfterItStarts() throws Exception {
        createWorking(working("X", ",\"effectiveStartDate\":\"2025-10-13\",\"effectiveEndDate\":\"2025-10-01\""))
                .andExpect(status().isBadRequest());
        String id = createdId(working("X", ",\"effectiveStartDate\":\"2025-10-13\""));
        mvc.perform(put("/api/schedule-workings/" + id + "/end").with(as(mot, "MOT")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"effectiveEndDate\":\"2025-10-01\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/schedule-workings/" + id + "/end").with(as(mot, "MOT")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"effectiveEndDate\":\"2025-12-31\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.effectiveEndDate").value("2025-12-31"));
    }

    // ───────────────────────────── overlap ─────────────────────────────

    @Test
    @DisplayName("INC-045 two operators on one departure are two workings, however the dates fall")
    void inc045_twoOperatorsCoexist() throws Exception {
        createWorking(working("Rajapakse Gem Travels", ",\"vehicles\":[{\"plateObserved\":\"NA-9245\"}]")).andExpect(status().isCreated());
        createWorking(working("Dakshina Super Line", ",\"vehicles\":[{\"plateObserved\":\"NC-0965\"}]")).andExpect(status().isCreated());

        mvc.perform(get("/api/schedules/" + schedule.getId() + "/workings").with(as(mot, "MOT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("INC-045 one operator cannot have overlapping workings, by name without regard to case")
    void inc045_sameOperatorCannotOverlap() throws Exception {
        createdId(working("Nimmi Boys", ",\"effectiveStartDate\":\"2025-10-01\",\"effectiveEndDate\":\"2025-12-31\""));

        createWorking(working("NIMMI BOYS", ",\"effectiveStartDate\":\"2025-12-31\"")).andExpect(status().isConflict());
        createWorking(working("nimmi boys", ",\"effectiveStartDate\":\"2025-06-01\"")).andExpect(status().isConflict());
        // the day after it ended, and a different operator on the same dates, are both fine
        createWorking(working("Nimmi Boys", ",\"effectiveStartDate\":\"2026-01-01\"")).andExpect(status().isCreated());
        createWorking(working("Buddhimal Express", ",\"effectiveStartDate\":\"2025-10-01\"")).andExpect(status().isCreated());
    }

    @Test
    @DisplayName("INC-045 ending a working frees its dates for the operator's next one")
    void inc045_endingFreesTheDates() throws Exception {
        String id = createdId(working("Saman Super Service", ",\"effectiveStartDate\":\"2025-01-01\""));
        createWorking(working("Saman Super Service", ",\"effectiveStartDate\":\"2025-07-01\"")).andExpect(status().isConflict());

        mvc.perform(put("/api/schedule-workings/" + id + "/end").with(as(mot, "MOT")).contentType(MediaType.APPLICATION_JSON)
                .content("{\"effectiveEndDate\":\"2025-06-30\"}")).andExpect(status().isOk());
        createWorking(working("Saman Super Service", ",\"effectiveStartDate\":\"2025-07-01\"")).andExpect(status().isCreated());
    }

    // ───────────────────────────── resolving ─────────────────────────────

    @Test
    @DisplayName("INC-045 staff link a name and a plate to a real operator and bus; what was seen is kept")
    void inc045_resolveOperatorAndBus() throws Exception {
        Operator operator = fx.operator("Weerasinghe Travels (Pvt) Ltd", UUID.randomUUID());
        Bus bus = fx.bus(operator, ServiceClassEnum.SEMI_LUXURY);
        String body = createWorking(working("Weerasinghe Midnight Express", ",\"vehicles\":[{\"plateObserved\":\"ND-1712\"}]"))
                .andReturn().getResponse().getContentAsString();
        String id = JsonPath.read(body, "$.id");
        String vehicleId = JsonPath.read(body, "$.vehicles[0].id");

        mvc.perform(put("/api/schedule-workings/" + id + "/operator").with(as(mot, "MOT")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"operatorId\":\"" + operator.getId() + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operatorResolved").value(true))
                .andExpect(jsonPath("$.operatorName").value("Weerasinghe Travels (Pvt) Ltd"))
                .andExpect(jsonPath("$.operatorNameObserved").value("Weerasinghe Midnight Express"));

        mvc.perform(put("/api/schedule-working-vehicles/" + vehicleId + "/bus").with(as(mot, "MOT")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"busId\":\"" + bus.getId() + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vehicles[0].resolved").value(true))
                .andExpect(jsonPath("$.vehicles[0].busId").value(bus.getId().toString()))
                .andExpect(jsonPath("$.vehicles[0].plate").value(bus.getPlateNumber()))
                .andExpect(jsonPath("$.vehicles[0].plateObserved").value("ND-1712"));
    }

    @Test
    @DisplayName("INC-045 a bus registered to one operator cannot be another operator's vehicle")
    void inc045_busOfAnotherOperatorRefused() throws Exception {
        Operator a = fx.operator("Operator A", UUID.randomUUID());
        Operator b = fx.operator("Operator B", UUID.randomUUID());
        Bus busOfB = fx.bus(b, ServiceClassEnum.NORMAL);

        // at creation
        createWorking("{\"operatorId\":\"" + a.getId() + "\",\"vehicles\":[{\"busId\":\"" + busOfB.getId() + "\"}]}")
                .andExpect(status().isConflict());

        // and when resolving later
        String body = createWorking("{\"operatorId\":\"" + a.getId() + "\",\"vehicles\":[{\"plateObserved\":\"XX-1\"}]}")
                .andReturn().getResponse().getContentAsString();
        String vehicleId = JsonPath.read(body, "$.vehicles[0].id");
        mvc.perform(put("/api/schedule-working-vehicles/" + vehicleId + "/bus").with(as(mot, "MOT")).contentType(MediaType.APPLICATION_JSON)
                .content("{\"busId\":\"" + busOfB.getId() + "\"}")).andExpect(status().isConflict());
    }

    @Test
    @DisplayName("INC-045 two unresolved workings that turn out to be one operator cannot both keep the same dates")
    void inc045_resolutionCanRevealACollision() throws Exception {
        Operator operator = fx.operator("Weerasinghe Travels", UUID.randomUUID());
        String first = createdId(working("Weerasinghe Midnight Express", ",\"effectiveStartDate\":\"2025-01-01\""));
        String second = createdId(working("Weerasinghe Express", ",\"effectiveStartDate\":\"2025-01-01\""));

        mvc.perform(put("/api/schedule-workings/" + first + "/operator").with(as(mot, "MOT")).contentType(MediaType.APPLICATION_JSON)
                .content("{\"operatorId\":\"" + operator.getId() + "\"}")).andExpect(status().isOk());
        mvc.perform(put("/api/schedule-workings/" + second + "/operator").with(as(mot, "MOT")).contentType(MediaType.APPLICATION_JSON)
                .content("{\"operatorId\":\"" + operator.getId() + "\"}")).andExpect(status().isConflict());
    }

    // ───────────────────────────── correcting (INC-058) ─────────────────────────────

    @Test
    @DisplayName("INC-058 staff correct an observed field, keeping everything the request leaves out")
    void inc058_correctKeepsWhatWasNotSent() throws Exception {
        String id = createdId(working("Weerasinghe Midnight Express", ",\"serviceClass\":\"LUXURY\",\"vehicles\":[{\"plateObserved\":\"ND-1712\"}]"));

        mvc.perform(put("/api/schedule-workings/" + id).with(as(mot, "MOT")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"operatorNameObserved\":\"Weerasinghe Express\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operatorNameObserved").value("Weerasinghe Express"))
                .andExpect(jsonPath("$.serviceClass").value("LUXURY")) // untouched
                .andExpect(jsonPath("$.vehicles[0].plateObserved").value("ND-1712")); // untouched
    }

    @Test
    @DisplayName("INC-058 correcting the plates replaces the whole list")
    void inc058_correctPlatesReplacesTheList() throws Exception {
        String id = createdId(working("X", ",\"vehicles\":[{\"plateObserved\":\"AA-1\"},{\"plateObserved\":\"AA-2\"}]"));

        mvc.perform(put("/api/schedule-workings/" + id).with(as(mot, "MOT")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"platesObserved\":[\"BB-1\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vehicles.length()").value(1))
                .andExpect(jsonPath("$.vehicles[0].plateObserved").value("BB-1"));
    }

    @Test
    @DisplayName("INC-058 correcting an end date follows the same rule 'end' does: not before it starts")
    void inc058_correctEndDateValidated() throws Exception {
        String id = createdId(working("X", ",\"effectiveStartDate\":\"2026-01-01\""));
        mvc.perform(put("/api/schedule-workings/" + id).with(as(mot, "MOT")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"effectiveEndDate\":\"2025-12-31\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/schedule-workings/" + id).with(as(mot, "MOT")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"effectiveEndDate\":\"2026-06-01\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.effectiveEndDate").value("2026-06-01"));
    }

    @Test
    @DisplayName("INC-058 correcting into an overlap with another working by the same operator is refused")
    void inc058_correctOverlapRefused() throws Exception {
        String first = createdId(working("Shared Name", ",\"effectiveStartDate\":\"2025-01-01\",\"effectiveEndDate\":\"2025-06-30\""));
        String second = createdId(working("Other Name", ",\"effectiveStartDate\":\"2025-03-01\",\"effectiveEndDate\":\"2025-09-30\""));
        mvc.perform(put("/api/schedule-workings/" + second).with(as(mot, "MOT")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"operatorNameObserved\":\"Shared Name\"}"))
                .andExpect(status().isConflict());
    }

        // ───────────────────────────── access, removal, and trips ─────────────────────────────

    @Test
    @DisplayName("INC-045 only staff can record, read or remove workings")
    void inc045_staffOnly() throws Exception {
        String json = working("X", "");
        for (String role : new String[] {"OPERATOR", "PASSENGER", "CONDUCTOR"}) {
            mvc.perform(post("/api/schedules/" + schedule.getId() + "/workings").with(as(mot, role))
                    .contentType(MediaType.APPLICATION_JSON).content(json)).andExpect(status().isForbidden());
            mvc.perform(get("/api/schedules/" + schedule.getId() + "/workings").with(as(mot, role))).andExpect(status().isForbidden());
        }
        mvc.perform(post("/api/schedules/" + schedule.getId() + "/workings").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("INC-045 a working recorded by mistake can be removed, with its vehicles")
    void inc045_delete() throws Exception {
        String id = createdId(working("X", ",\"vehicles\":[{\"plateObserved\":\"AB-1\"}]"));
        mvc.perform(delete("/api/schedule-workings/" + id).with(as(mot, "MOT"))).andExpect(status().isNoContent());
        mvc.perform(get("/api/schedules/" + schedule.getId() + "/workings").with(as(mot, "MOT")))
                .andExpect(jsonPath("$.length()").value(0));
        mvc.perform(delete("/api/schedule-workings/" + id).with(as(mot, "MOT"))).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("INC-045 a working is display-only: generating trips never puts its bus on them")
    void inc045_neverWrittenOntoTrips() throws Exception {
        Operator operator = fx.operator("Nimmi Boys", UUID.randomUUID());
        Bus bus = fx.bus(operator, ServiceClassEnum.NORMAL);
        createWorking("{\"operatorId\":\"" + operator.getId() + "\",\"vehicles\":[{\"busId\":\"" + bus.getId() + "\"}]}")
                .andExpect(status().isCreated());

        // a schedule with a departure and an arrival, so trips can be generated for it
        Stop a = stops.save(stop("Embilipitiya"));
        Stop b = stops.save(stop("Colombo"));
        RouteStop first = routeStop(route, a, 1);
        RouteStop last = routeStop(route, b, 2);
        scheduleStop(schedule, first, 1, null, LocalTime.of(6, 0));
        scheduleStop(schedule, last, 2, LocalTime.of(10, 45), null);
        em.flush();
        em.clear(); // generation reads the schedule's stops from the database, not this test's cached copy

        LocalDate today = LocalDate.now();
        mvc.perform(post("/api/trips/generate").with(as(mot, "MOT")).param("scheduleId", schedule.getId().toString())
                        .param("fromDate", today.toString()).param("toDate", today.plusDays(2).toString()))
                .andExpect(status().isCreated());

        List<Trip> generated = trips.findAll().stream()
                .filter(t -> t.getSchedule().getId().equals(schedule.getId())).toList();
        assertThat(generated).hasSize(3);
        assertThat(generated).allSatisfy(t -> assertThat(t.getBus()).isNull());
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

    private RouteStop routeStop(Route r, Stop s, int order) {
        RouteStop rs = new RouteStop();
        rs.setRoute(r);
        rs.setStop(s);
        rs.setStopOrder(order);
        return routeStops.save(rs);
    }

    private void scheduleStop(Schedule sch, RouteStop rs, int order, LocalTime arrival, LocalTime departure) {
        ScheduleStop ss = new ScheduleStop();
        ss.setSchedule(sch);
        ss.setRouteStop(rs);
        ss.setStopOrder(order);
        ss.setArrivalTime(arrival);
        ss.setDepartureTime(departure);
        scheduleStops.save(ss);
    }
}
