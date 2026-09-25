package com.busmate.routeschedule.passengerinfo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

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
import com.busmate.routeschedule.fleet.entity.Bus;
import com.busmate.routeschedule.fleet.entity.Operator;
import com.busmate.routeschedule.fleet.enums.ServiceClassEnum;
import com.busmate.routeschedule.network.entity.Route;
import com.busmate.routeschedule.network.entity.RouteGroup;
import com.busmate.routeschedule.network.entity.RouteStop;
import com.busmate.routeschedule.network.entity.Stop;
import com.busmate.routeschedule.network.repository.RouteStopRepository;
import com.busmate.routeschedule.network.repository.StopRepository;
import com.busmate.routeschedule.scheduling.entity.Schedule;
import com.busmate.routeschedule.scheduling.entity.ScheduleCalendar;
import com.busmate.routeschedule.scheduling.entity.ScheduleStop;
import com.busmate.routeschedule.scheduling.entity.ScheduleWorking;
import com.busmate.routeschedule.scheduling.entity.ScheduleWorkingVehicle;
import com.busmate.routeschedule.scheduling.repository.ScheduleCalendarRepository;
import com.busmate.routeschedule.scheduling.repository.ScheduleStopRepository;
import com.busmate.routeschedule.scheduling.repository.ScheduleWorkingRepository;
import com.busmate.routeschedule.shared.provenance.Provenance;
import com.busmate.routeschedule.shared.provenance.SourceTier;
import com.busmate.routeschedule.support.OperationsFixtures;

import jakarta.persistence.EntityManager;

/** A passenger sees who usually works a departure, as a pattern and labelled, never as today's bus (ADR-024). */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("INC-046 passengers see who usually works a departure")
class UsualWorkingPassengerIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private OperationsFixtures fx;
    @Autowired private StopRepository stops;
    @Autowired private RouteStopRepository routeStops;
    @Autowired private ScheduleStopRepository scheduleStops;
    @Autowired private ScheduleCalendarRepository calendars;
    @Autowired private ScheduleWorkingRepository workings;
    @Autowired private EntityManager em;

    private MockMvc mvc;
    private Stop from;
    private Stop to;
    private Schedule schedule;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        from = stops.save(stop("Embilipitiya"));
        to = stops.save(stop("Colombo"));
        schedule = departure();
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

    /** A searchable 06:00 → 10:45 departure, every day. */
    private Schedule departure() {
        RouteGroup group = fx.routeGroup();
        Route route = fx.route(group);
        RouteStop rs1 = routeStop(route, from, 1, 0.0);
        RouteStop rs2 = routeStop(route, to, 2, 165.0);
        Schedule s = fx.schedule(route);
        ScheduleCalendar cal = new ScheduleCalendar();
        cal.setSchedule(s);
        cal.setMonday(true); cal.setTuesday(true); cal.setWednesday(true); cal.setThursday(true);
        cal.setFriday(true); cal.setSaturday(true); cal.setSunday(true);
        calendars.save(cal);
        stopTime(s, rs1, 1, null, LocalTime.of(6, 0));
        stopTime(s, rs2, 2, LocalTime.of(10, 45), null);
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

    private void stopTime(Schedule s, RouteStop rs, int order, LocalTime arrival, LocalTime departure) {
        ScheduleStop ss = new ScheduleStop();
        ss.setSchedule(s);
        ss.setRouteStop(rs);
        ss.setStopOrder(order);
        ss.setArrivalTime(arrival);
        ss.setDepartureTime(departure);
        scheduleStops.save(ss);
    }

    private ScheduleWorking working(String operatorName, LocalDate start, LocalDate end, String... plates) {
        ScheduleWorking w = new ScheduleWorking();
        w.setSchedule(em.getReference(Schedule.class, schedule.getId()));
        w.setEffectiveStartDate(start);
        w.setEffectiveEndDate(end);
        w.setOperatorNameObserved(operatorName);
        w.setProvenance(Provenance.of(SourceTier.SRC_5, "Community contributor", UUID.randomUUID(), Instant.now()));
        for (String plate : plates) {
            ScheduleWorkingVehicle v = new ScheduleWorkingVehicle();
            v.setWorking(w);
            v.setPlateObserved(plate);
            v.setProvenance(Provenance.of(SourceTier.SRC_5, "Community contributor", UUID.randomUUID(), Instant.now()));
            w.getVehicles().add(v);
        }
        ScheduleWorking saved = workings.save(w);
        em.flush();
        em.clear();
        return saved;
    }

    private String search(LocalDate date) {
        return "/api/passenger/find-my-bus?fromStopId=" + from.getId() + "&toStopId=" + to.getId() + "&date=" + date;
    }

    @Test
    @DisplayName("INC-046 a search shows who usually works a departure, unauthenticated, with where the claim came from")
    void inc046_searchShowsUsualOperatorAndPlate() throws Exception {
        working("Weerasinghe Midnight Express", LocalDate.now().minusDays(30), null, "ND-1712");

        mvc.perform(get(search(LocalDate.now())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].usualWorkings.length()").value(1))
                .andExpect(jsonPath("$.results[0].usualWorkings[0].operatorName").value("Weerasinghe Midnight Express"))
                .andExpect(jsonPath("$.results[0].usualWorkings[0].plates[0]").value("ND-1712"))
                .andExpect(jsonPath("$.results[0].usualWorkings[0].trust.label").value("REPORTED"));
    }

    @Test
    @DisplayName("INC-046 a departure nobody has recorded shows an empty list, not a missing one")
    void inc046_unrecordedIsEmpty() throws Exception {
        mvc.perform(get(search(LocalDate.now())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].usualWorkings.length()").value(0));
    }

    @Test
    @DisplayName("INC-046 only a working in effect on the searched date is shown")
    void inc046_onlyWhatIsInEffect() throws Exception {
        LocalDate today = LocalDate.now();
        working("Ended Last Month", today.minusDays(90), today.minusDays(30), "AA-1");
        working("Starts Next Month", today.plusDays(30), null, "BB-2");
        working("Current", today.minusDays(10), today.plusDays(10), "CC-3");

        mvc.perform(get(search(today)))
                .andExpect(jsonPath("$.results[0].usualWorkings.length()").value(1))
                .andExpect(jsonPath("$.results[0].usualWorkings[0].operatorName").value("Current"));
        // and on the last day the older one applied (the schedule itself starts that day) it is the one shown
        mvc.perform(get(search(today.minusDays(30))))
                .andExpect(jsonPath("$.results[0].usualWorkings[0].operatorName").value("Ended Last Month"));
    }

    @Test
    @DisplayName("INC-046 a rotation shows all its plates, and two operators show as two entries")
    void inc046_rotationAndCoOperators() throws Exception {
        working("SLTB Kataragama", LocalDate.now().minusDays(5), null, "NB-8127", "NB-8276");
        working("Dakshina Super Line", LocalDate.now().minusDays(5), null, "NC-0965");

        mvc.perform(get(search(LocalDate.now())))
                .andExpect(jsonPath("$.results[0].usualWorkings.length()").value(2))
                .andExpect(jsonPath("$.results[0].usualWorkings[?(@.operatorName=='SLTB Kataragama')].plates.length()").value(2));
    }

    @Test
    @DisplayName("INC-046 a linked operator and bus show their registered names")
    void inc046_resolvedShowsRegistered() throws Exception {
        Operator operator = fx.operator("Weerasinghe Travels (Pvt) Ltd", UUID.randomUUID());
        Bus bus = fx.bus(operator, ServiceClassEnum.SEMI_LUXURY);
        ScheduleWorking w = new ScheduleWorking();
        w.setSchedule(em.getReference(Schedule.class, schedule.getId()));
        w.setEffectiveStartDate(LocalDate.now().minusDays(1));
        w.setOperator(operator);
        w.setOperatorNameObserved("Weerasinghe Midnight Express");
        w.setServiceClass(ServiceClassEnum.SEMI_LUXURY);
        ScheduleWorkingVehicle v = new ScheduleWorkingVehicle();
        v.setWorking(w);
        v.setBus(bus);
        v.setPlateObserved("nd-1712");
        w.getVehicles().add(v);
        workings.save(w);
        em.flush();
        em.clear();

        mvc.perform(get(search(LocalDate.now())))
                .andExpect(jsonPath("$.results[0].usualWorkings[0].operatorName").value("Weerasinghe Travels (Pvt) Ltd"))
                .andExpect(jsonPath("$.results[0].usualWorkings[0].plates[0]").value(bus.getPlateNumber()))
                .andExpect(jsonPath("$.results[0].usualWorkings[0].serviceClass").value("SEMI_LUXURY"));
    }

    @Test
    @DisplayName("INC-046 the passenger view carries no ids and no identity of whoever contributed it")
    void inc046_noIdentityOrInternalIds() throws Exception {
        working("Weerasinghe Midnight Express", LocalDate.now().minusDays(30), null, "ND-1712");

        String body = mvc.perform(get(search(LocalDate.now()))).andReturn().getResponse().getContentAsString();
        String usual = body.substring(body.indexOf("\"usualWorkings\""));
        usual = usual.substring(0, usual.indexOf("]", usual.indexOf("\"plates\"")) + 1);
        assertThat(usual).doesNotContain("attributedUserId").doesNotContain("operatorId").doesNotContain("busId")
                .doesNotContain("proposer");
    }

    @Test
    @DisplayName("INC-046 the details page shows the same, for the date asked")
    void inc046_detailsShowsUsualWorking() throws Exception {
        working("Weerasinghe Midnight Express", LocalDate.now().minusDays(30), null, "ND-1712");

        mvc.perform(get("/api/passenger/find-my-bus-details?scheduleId=" + schedule.getId()
                        + "&fromStopId=" + from.getId() + "&toStopId=" + to.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usualWorkings.length()").value(1))
                .andExpect(jsonPath("$.usualWorkings[0].operatorName").value("Weerasinghe Midnight Express"))
                .andExpect(jsonPath("$.usualWorkings[0].plates[0]").value("ND-1712"));
    }
}
