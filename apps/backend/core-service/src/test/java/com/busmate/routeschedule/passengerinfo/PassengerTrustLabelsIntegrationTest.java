package com.busmate.routeschedule.passengerinfo;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

import java.time.Instant;
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
import com.busmate.routeschedule.network.entity.RouteGroup;
import com.busmate.routeschedule.network.entity.RouteStop;
import com.busmate.routeschedule.network.entity.Stop;
import com.busmate.routeschedule.network.repository.RouteStopRepository;
import com.busmate.routeschedule.network.repository.StopRepository;
import com.busmate.routeschedule.scheduling.entity.Schedule;
import com.busmate.routeschedule.scheduling.entity.ScheduleCalendar;
import com.busmate.routeschedule.scheduling.entity.ScheduleStop;
import com.busmate.routeschedule.scheduling.repository.ScheduleCalendarRepository;
import com.busmate.routeschedule.scheduling.repository.ScheduleStopRepository;
import com.busmate.routeschedule.shared.provenance.Provenance;
import com.busmate.routeschedule.shared.provenance.SourceTier;
import com.busmate.routeschedule.support.OperationsFixtures;

import jakarta.persistence.EntityManager;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("INC-028 passenger trust labels")
class PassengerTrustLabelsIntegrationTest extends AbstractPostgresIntegrationTest {

    private static final Instant OBSERVED = Instant.parse("2026-09-01T08:00:00Z");

    @Autowired private WebApplicationContext context;
    @Autowired private OperationsFixtures fx;
    @Autowired private StopRepository stops;
    @Autowired private RouteStopRepository routeStops;
    @Autowired private ScheduleStopRepository scheduleStops;
    @Autowired private ScheduleCalendarRepository calendars;
    @Autowired private EntityManager em;

    private MockMvc mvc;
    private Stop from;
    private Stop to;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        from = stops.save(stop("From"));
        to = stops.save(stop("To"));
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

    /** A route (official) from `from` to `to`, and a schedule of the given tier with the given stop times. */
    private Schedule scenario(SourceTier scheduleTier, LocalTime verifiedDeparture, LocalTime unverifiedArrival,
                              LocalTime calculatedArrival) {
        RouteGroup group = fx.routeGroup();
        Route route = fx.route(group);
        route.setProvenance(Provenance.of(SourceTier.SRC_1, "MOT", null, OBSERVED));
        RouteStop rs1 = routeStop(route, from, 1, 0.0);
        RouteStop rs2 = routeStop(route, to, 2, 10.0);
        Schedule schedule = fx.schedule(route);
        schedule.setProvenance(Provenance.of(scheduleTier, "Someone", null, OBSERVED));

        ScheduleCalendar cal = new ScheduleCalendar();
        cal.setSchedule(schedule);
        cal.setMonday(true); cal.setTuesday(true); cal.setWednesday(true); cal.setThursday(true);
        cal.setFriday(true); cal.setSaturday(true); cal.setSunday(true);
        calendars.save(cal);

        ScheduleStop ss1 = new ScheduleStop();
        ss1.setSchedule(schedule);
        ss1.setRouteStop(rs1);
        ss1.setStopOrder(1);
        ss1.setDepartureTime(verifiedDeparture);
        scheduleStops.save(ss1);
        ScheduleStop ss2 = new ScheduleStop();
        ss2.setSchedule(schedule);
        ss2.setRouteStop(rs2);
        ss2.setStopOrder(2);
        ss2.setArrivalTimeUnverified(unverifiedArrival);
        ss2.setArrivalTimeCalculated(calculatedArrival);
        scheduleStops.save(ss2);
        em.flush();
        em.clear();
        return schedule;
    }

    private RouteStop routeStop(Route route, Stop stop, int order, double km) {
        RouteStop rs = new RouteStop();
        rs.setRoute(route);
        rs.setStop(stop);
        rs.setStopOrder(order);
        rs.setDistanceFromStartKm(km);
        return routeStops.save(rs);
    }

    private String search() {
        return "/api/passenger/find-my-bus?fromStopId=" + from.getId() + "&toStopId=" + to.getId();
    }

    @Test
    @DisplayName("INC-028 search labels a departure by its schedule's source and an unverified arrival as reported, unauthenticated")
    void inc028_searchLabelsEachTimeByWhereItCameFrom() throws Exception {
        scenario(SourceTier.SRC_3, LocalTime.of(23, 0), LocalTime.of(23, 40), null);
        mvc.perform(get(search()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].departureAtOriginTrust.label").value("OPERATOR_TIMETABLE"))
                .andExpect(jsonPath("$.results[0].departureAtOriginTrust.observedAt").value("2026-09-01T08:00:00Z"))
                .andExpect(jsonPath("$.results[0].arrivalAtDestinationTrust.label").value("REPORTED"))
                .andExpect(jsonPath("$.results[0].routeTrust.label").value("OFFICIAL"));
    }

    @Test
    @DisplayName("INC-028 a calculated arrival is labelled estimated and an official schedule's departure official")
    void inc028_calculatedIsEstimatedOfficialIsOfficial() throws Exception {
        scenario(SourceTier.SRC_1, LocalTime.of(23, 0), null, LocalTime.of(23, 50));
        mvc.perform(get(search()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].departureAtOriginTrust.label").value("OFFICIAL"))
                .andExpect(jsonPath("$.results[0].arrivalAtDestinationTrust.label").value("ESTIMATED"));
    }

    @Test
    @DisplayName("INC-028 nothing a schedule search returns is labelled live")
    void inc028_searchNeverLabelsLive() throws Exception {
        scenario(SourceTier.SRC_4, LocalTime.of(23, 0), LocalTime.of(23, 40), null);
        mvc.perform(get(search()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[*].departureAtOriginTrust.label", not(hasItem("LIVE"))))
                .andExpect(jsonPath("$.results[*].arrivalAtDestinationTrust.label", not(hasItem("LIVE"))));
    }

    @Test
    @DisplayName("INC-028 details labels the route, the timetable, every stop time and the journey summary")
    void inc028_detailsLabelsRouteTimetableAndTimes() throws Exception {
        Schedule schedule = scenario(SourceTier.SRC_4, LocalTime.of(23, 0), LocalTime.of(23, 40), null);
        mvc.perform(get("/api/passenger/find-my-bus-details?scheduleId=" + schedule.getId()
                        + "&fromStopId=" + from.getId() + "&toStopId=" + to.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.route.trust.label").value("OFFICIAL"))
                .andExpect(jsonPath("$.schedule.trust.label").value("OBSERVED"))
                .andExpect(jsonPath("$.schedule.trust.observedAt").value("2026-09-01T08:00:00Z"))
                .andExpect(jsonPath("$.routeScheduleStops[0].departureTimeTrust.label").value("OBSERVED"))
                .andExpect(jsonPath("$.routeScheduleStops[1].arrivalTimeTrust.label").value("REPORTED"))
                .andExpect(jsonPath("$.journeySummary.departureTimeTrust.label").value("OBSERVED"))
                .andExpect(jsonPath("$.journeySummary.arrivalTimeTrust.label").value("REPORTED"));
    }

    @Test
    @DisplayName("INC-028 a public route read says when its data was last confirmed and never names the credited user")
    void inc028_publicRouteCarriesTrustNotIdentity() throws Exception {
        Schedule schedule = scenario(SourceTier.SRC_4, LocalTime.of(23, 0), null, null);
        mvc.perform(get("/api/routes/" + schedule.getRoute().getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trust.label").value("OFFICIAL"))
                .andExpect(jsonPath("$.trust.observedAt").value("2026-09-01T08:00:00Z"))
                .andExpect(jsonPath("$.provenance.attributedUserId").doesNotExist())
                .andExpect(jsonPath("$.provenance.attributionLabel").value("MOT"));
    }
}
