package com.busmate.routeschedule.network;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.busmate.routeschedule.AbstractPostgresIntegrationTest;
import com.busmate.routeschedule.network.entity.Route;
import com.busmate.routeschedule.network.entity.RouteStop;
import com.busmate.routeschedule.network.entity.Stop;
import com.busmate.routeschedule.network.repository.RouteStopRepository;
import com.busmate.routeschedule.network.repository.StopRepository;
import com.busmate.routeschedule.scheduling.entity.Schedule;
import com.busmate.routeschedule.scheduling.entity.ScheduleStop;
import com.busmate.routeschedule.scheduling.repository.ScheduleStopRepository;
import com.busmate.routeschedule.support.OperationsFixtures;

/** A route learns its stops one at a time, without disturbing what schedules already hang on it (INC-051). */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("INC-051 placing a stop into a route")
class RouteStopPlacementIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private OperationsFixtures fx;
    @Autowired private StopRepository stops;
    @Autowired private RouteStopRepository routeStops;
    @Autowired private ScheduleStopRepository scheduleStops;
    @Autowired private jakarta.persistence.EntityManager em;

    private MockMvc mvc;
    private final UUID mot = UUID.randomUUID();
    private Route route;
    private RouteStop first;
    private RouteStop last;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        route = fx.route(fx.routeGroup());
        route.setStartStop(newStop("Embilipitiya"));
        route.setEndStop(newStop("Colombo Pettah"));
        first = routeStops.save(routeStop(route, route.getStartStop(), 1));
        last = routeStops.save(routeStop(route, route.getEndStop(), 2));
        em.flush();
        em.clear();
    }

    private static RequestPostProcessor as(String role) {
        return user(UUID.randomUUID().toString()).roles(role);
    }

    private RouteStop routeStop(Route r, Stop s, int order) {
        RouteStop rs = new RouteStop();
        rs.setRoute(r);
        rs.setStop(s);
        rs.setStopOrder(order);
        return rs;
    }

    private Stop newStop(String name) {
        Stop s = new Stop();
        s.setName(name);
        Stop.Location loc = new Stop.Location();
        loc.setLatitude(6.5);
        loc.setLongitude(80.5);
        loc.setCity(name);
        loc.setCountry("Sri Lanka");
        s.setLocation(loc);
        return stops.saveAndFlush(s);
    }

    private String body(Stop stop, RouteStop after, String extra) {
        return "{\"stopId\":\"" + stop.getId() + "\"" + (after == null ? "" : ",\"afterRouteStopId\":\"" + after.getId() + "\"") + extra + "}";
    }

    @Test
    @DisplayName("INC-051 a stop is placed after another; later stops move down and none is recreated")
    void inc051_placedInOrder() throws Exception {
        Stop pelmadulla = newStop("Pelmadulla");

        mvc.perform(post("/api/routes/" + route.getId() + "/stops").with(as("MOT")).contentType(MediaType.APPLICATION_JSON)
                        .content(body(pelmadulla, first, ",\"distanceFromStartKmUnverified\":41.5")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.routeStops.length()").value(3))
                .andExpect(jsonPath("$.routeStops[1].stopId").value(pelmadulla.getId().toString()))
                .andExpect(jsonPath("$.routeStops[1].stopOrder").value(2))
                .andExpect(jsonPath("$.routeStops[2].stopId").value(route.getEndStop().getId().toString()))
                .andExpect(jsonPath("$.routeStops[2].stopOrder").value(3));

        // The rows that were there are the same rows: a schedule time attached to one is still attached.
        assertThat(routeStops.findById(first.getId())).isPresent();
        assertThat(routeStops.findById(last.getId())).get().extracting(RouteStop::getStopOrder).isEqualTo(3);
        RouteStop placed = routeStops.findByRouteIdAndStopId(route.getId(), pelmadulla.getId()).orElseThrow();
        assertThat(placed.getDistanceFromStartKmUnverified()).isEqualTo(41.5);
        assertThat(placed.getDistanceFromStartKm()).isNull(); // nobody verified it
    }

    @Test
    @DisplayName("INC-051 it works on a route a schedule already has times on")
    void inc051_scheduleTimesSurvive() throws Exception {
        Schedule schedule = fx.schedule(route);
        ScheduleStop ss = new ScheduleStop();
        ss.setSchedule(schedule);
        ss.setRouteStop(routeStops.findById(first.getId()).orElseThrow());
        ss.setStopOrder(1);
        ss.setDepartureTime(LocalTime.of(5, 0));
        scheduleStops.saveAndFlush(ss);
        em.clear();

        mvc.perform(post("/api/routes/" + route.getId() + "/stops").with(as("MOT")).contentType(MediaType.APPLICATION_JSON)
                        .content(body(newStop("Pelmadulla"), first, "")))
                .andExpect(status().isCreated());

        em.clear();
        List<ScheduleStop> kept = scheduleStops.findAll().stream().filter(s -> s.getSchedule().getId().equals(schedule.getId())).toList();
        assertThat(kept).hasSize(1);
        assertThat(kept.get(0).getRouteStop().getId()).isEqualTo(first.getId());
    }

    @Test
    @DisplayName("INC-051 it is refused for a stop already on the route, one after the end, or with no place named")
    void inc051_refusals() throws Exception {
        Stop other = newStop("Ratnapura");
        String path = "/api/routes/" + route.getId() + "/stops";

        mvc.perform(post(path).with(as("MOT")).contentType(MediaType.APPLICATION_JSON).content(body(route.getStartStop(), first, "")))
                .andExpect(status().isConflict());
        mvc.perform(post(path).with(as("MOT")).contentType(MediaType.APPLICATION_JSON).content(body(other, last, "")))
                .andExpect(status().isBadRequest());
        mvc.perform(post(path).with(as("MOT")).contentType(MediaType.APPLICATION_JSON).content(body(other, null, "")))
                .andExpect(status().isBadRequest());
        assertThat(routeStops.findByRouteIdOrderByStopOrder(route.getId())).hasSize(2);
    }

    @Test
    @DisplayName("INC-051 a placed stop can be removed and the rest close up; the ends and timed stops cannot")
    void inc051_remove() throws Exception {
        Stop pelmadulla = newStop("Pelmadulla");
        mvc.perform(post("/api/routes/" + route.getId() + "/stops").with(as("MOT")).contentType(MediaType.APPLICATION_JSON)
                .content(body(pelmadulla, first, ""))).andExpect(status().isCreated());
        RouteStop placed = routeStops.findByRouteIdAndStopId(route.getId(), pelmadulla.getId()).orElseThrow();

        mvc.perform(delete("/api/routes/" + route.getId() + "/stops/" + first.getId()).with(as("MOT"))).andExpect(status().isConflict());

        mvc.perform(delete("/api/routes/" + route.getId() + "/stops/" + placed.getId()).with(as("MOT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.routeStops.length()").value(2))
                .andExpect(jsonPath("$.routeStops[1].stopOrder").value(2));
    }

    @Test
    @DisplayName("INC-051 a stop that has a schedule time cannot be removed")
    void inc051_timedStopStays() throws Exception {
        Stop pelmadulla = newStop("Pelmadulla");
        mvc.perform(post("/api/routes/" + route.getId() + "/stops").with(as("MOT")).contentType(MediaType.APPLICATION_JSON)
                .content(body(pelmadulla, first, ""))).andExpect(status().isCreated());
        RouteStop placed = routeStops.findByRouteIdAndStopId(route.getId(), pelmadulla.getId()).orElseThrow();
        ScheduleStop ss = new ScheduleStop();
        ss.setSchedule(fx.schedule(route));
        ss.setRouteStop(placed);
        ss.setStopOrder(1);
        ss.setDepartureTime(LocalTime.of(6, 0));
        scheduleStops.saveAndFlush(ss);
        em.flush();
        em.clear();

        mvc.perform(delete("/api/routes/" + route.getId() + "/stops/" + placed.getId()).with(as("MOT"))).andExpect(status().isConflict());
    }

    @Test
    @DisplayName("INC-051 only staff may change a route's stops")
    void inc051_staffOnly() throws Exception {
        for (String role : new String[] {"PASSENGER", "OPERATOR", "CONDUCTOR"}) {
            mvc.perform(post("/api/routes/" + route.getId() + "/stops").with(as(role)).contentType(MediaType.APPLICATION_JSON)
                    .content(body(newStop("S" + role), first, ""))).andExpect(status().isForbidden());
        }
    }
}
