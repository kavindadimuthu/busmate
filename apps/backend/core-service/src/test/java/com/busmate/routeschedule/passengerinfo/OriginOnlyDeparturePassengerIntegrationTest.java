package com.busmate.routeschedule.passengerinfo;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
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
import com.busmate.routeschedule.scheduling.enums.TimingCompletenessEnum;
import com.busmate.routeschedule.scheduling.repository.ScheduleRepository;
import com.busmate.routeschedule.scheduling.repository.ScheduleStopRepository;
import com.busmate.routeschedule.shared.provenance.Provenance;
import com.busmate.routeschedule.shared.provenance.SourceTier;
import com.busmate.routeschedule.support.OperationsFixtures;

import jakarta.persistence.EntityManager;

/**
 * A departure known only at its origin (ADR-023) can be searched and opened. Found by importing a real community
 * post: search worked, but "View Details" returned "Invalid stop sequence" for every such departure, because the
 * details endpoint looked for the destination among the schedule's own stops and an origin-only schedule has none.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("INC-048 an origin-only departure can be opened")
class OriginOnlyDeparturePassengerIntegrationTest extends AbstractPostgresIntegrationTest {

    private static final Instant POST = Instant.parse("2025-10-13T00:00:00Z");

    @Autowired private WebApplicationContext context;
    @Autowired private OperationsFixtures fx;
    @Autowired private StopRepository stops;
    @Autowired private RouteStopRepository routeStops;
    @Autowired private ScheduleRepository schedules;
    @Autowired private ScheduleStopRepository scheduleStops;
    @Autowired private EntityManager em;

    private MockMvc mvc;
    private Stop from;
    private Stop to;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        from = stops.save(stop("Embilipitiya"));
        to = stops.save(stop("Colombo"));
    }

    private static Stop stop(String name) {
        Stop s = new Stop();
        s.setName(name + "-" + OperationsFixtures.shortId());
        Stop.Location loc = new Stop.Location();
        loc.setLatitude(6.9);
        loc.setLongitude(79.86);
        loc.setCity("City");
        loc.setCountry("Sri Lanka");
        s.setLocation(loc);
        return s;
    }

    /** A departure with a time at the origin only, in the unverified column, as a community timetable gives it. */
    private Schedule originOnly(TimingCompletenessEnum timing) {
        Route route = fx.route(fx.routeGroup());
        RouteStop first = routeStop(route, from, 1, 0.0);
        routeStop(route, to, 2, 165.0);
        Schedule s = fx.schedule(route);
        s.setTimingCompleteness(timing);
        s.setProvenance(Provenance.of(SourceTier.SRC_5, "community timetable post", null, POST));
        schedules.save(s);
        ScheduleStop ss = new ScheduleStop();
        ss.setSchedule(s);
        ss.setRouteStop(first);
        ss.setStopOrder(1);
        ss.setDepartureTimeUnverified(LocalTime.of(6, 0));
        scheduleStops.save(ss);
        em.flush();
        em.clear();
        return s;
    }

    private RouteStop routeStop(Route route, Stop stop, int order, double km) {
        RouteStop rs = new RouteStop();
        rs.setRoute(route);
        rs.setStop(stop);
        rs.setStopOrder(order);
        rs.setDistanceFromStartKm(km);
        return routeStops.save(rs);
    }

    private String details(Schedule s) {
        return "/api/passenger/find-my-bus-details?scheduleId=" + s.getId() + "&fromStopId=" + from.getId()
                + "&toStopId=" + to.getId() + "&date=" + LocalDate.now();
    }

    @Test
    @DisplayName("INC-048 an origin-only departure is found by search, unauthenticated")
    void inc048_searchFindsIt() throws Exception {
        originOnly(TimingCompletenessEnum.ORIGIN_ONLY);
        mvc.perform(get("/api/passenger/find-my-bus?fromStopId=" + from.getId() + "&toStopId=" + to.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalResults").value(1));
    }

    @Test
    @DisplayName("INC-048 and its details open: the destination is the route's, with no time, and the origin is reported")
    void inc048_detailsOpen() throws Exception {
        Schedule s = originOnly(TimingCompletenessEnum.ORIGIN_ONLY);

        mvc.perform(get(details(s)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.routeScheduleStops.length()").value(2))
                .andExpect(jsonPath("$.routeScheduleStops[0].departureTimeTrust.label").value("REPORTED"))
                .andExpect(jsonPath("$.routeScheduleStops[1].resolvedDepartureTime").doesNotExist())
                .andExpect(jsonPath("$.routeScheduleStops[1].resolvedArrivalTime").doesNotExist())
                .andExpect(jsonPath("$.journeySummary").exists());
    }

    @Test
    @DisplayName("INC-048 a schedule that does not declare partial timing keeps its behaviour: it is not shown stopping where it does not")
    void inc048_undeclaredKeepsOldBehaviour() throws Exception {
        Schedule s = originOnly(TimingCompletenessEnum.UNKNOWN);

        mvc.perform(get(details(s)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid stop sequence: origin must come before destination on this route."));
    }
}
