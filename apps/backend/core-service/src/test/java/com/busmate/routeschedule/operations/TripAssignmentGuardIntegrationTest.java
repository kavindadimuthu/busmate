package com.busmate.routeschedule.operations;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.busmate.routeschedule.AbstractPostgresIntegrationTest;
import com.busmate.routeschedule.fleet.entity.Bus;
import com.busmate.routeschedule.fleet.entity.Operator;
import com.busmate.routeschedule.fleet.enums.BusAvailabilityEnum;
import com.busmate.routeschedule.fleet.enums.ServiceClassEnum;
import com.busmate.routeschedule.fleet.repository.BusRepository;
import com.busmate.routeschedule.licensing.entity.PassengerServicePermit;
import com.busmate.routeschedule.licensing.enums.PassengerServicePermitTypeEnum;
import com.busmate.routeschedule.network.entity.Route;
import com.busmate.routeschedule.network.entity.RouteGroup;
import com.busmate.routeschedule.operations.entity.Trip;
import com.busmate.routeschedule.operations.enums.TripStatusEnum;
import com.busmate.routeschedule.operations.repository.TripRepository;
import com.busmate.routeschedule.scheduling.entity.Schedule;
import com.busmate.routeschedule.shared.client.ConductorDirectory;
import com.busmate.routeschedule.shared.client.ConductorDirectory.Conductor;
import com.busmate.routeschedule.support.OperationsFixtures;

/**
 * INC-020: assigning a bus or conductor to a trip is guarded — ownership, availability, the
 * permit link, and no double-booking — and an operator can report their own pending trip as not
 * running.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("INC-020 trip assignment guards")
class TripAssignmentGuardIntegrationTest extends AbstractPostgresIntegrationTest {

    @MockitoBean private ConductorDirectory conductorDirectory;

    @Autowired private WebApplicationContext context;
    @Autowired private OperationsFixtures fx;
    @Autowired private BusRepository busRepository;
    @Autowired private TripRepository tripRepository;

    private MockMvc mvc;
    private final UUID userA = UUID.randomUUID();
    private final UUID userB = UUID.randomUUID();
    private Operator operatorA;
    private Operator operatorB;
    private RouteGroup group;
    private PassengerServicePermit permitA;
    private Schedule schedule;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        operatorA = fx.operator("A", userA);
        operatorB = fx.operator("B", userB);
        group = fx.routeGroup();
        Route route = fx.route(group);
        schedule = fx.schedule(route);
        permitA = fx.permit(operatorA, group, PassengerServicePermitTypeEnum.NORMAL, 5);
        when(conductorDirectory.find(any())).thenReturn(Optional.empty());
    }

    private Trip pendingTrip(LocalDate date, LocalTime departs, LocalTime arrives) {
        return fx.trip(schedule, permitA, date, departs, arrives);
    }

    private String opPath(Operator operator, UUID tripId) {
        return "/api/v1/bus-operator/" + operator.getId() + "/trips/" + tripId;
    }

    @Test
    @DisplayName("INC-020 an operator cannot hijack another operator's trip by assigning their own bus to it")
    void inc020_cannotHijackAnotherOperatorsTrip() throws Exception {
        Trip trip = pendingTrip(LocalDate.now().plusDays(1), LocalTime.of(8, 0), LocalTime.of(10, 0));
        Bus busB = fx.bus(operatorB, ServiceClassEnum.NORMAL);
        mvc.perform(patch(opPath(operatorB, trip.getId()) + "/assign-bus")
                        .param("busId", busB.getId().toString())
                        .with(as(userB, "OPERATOR")))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("INC-020 a bus not linked to the trip's permit, or marked unavailable, is refused")
    void inc020_busMustBeLinkedAndAvailable() throws Exception {
        Trip trip = pendingTrip(LocalDate.now().plusDays(1), LocalTime.of(8, 0), LocalTime.of(10, 0));
        Bus unlinked = fx.bus(operatorA, ServiceClassEnum.NORMAL);
        mvc.perform(patch(opPath(operatorA, trip.getId()) + "/assign-bus")
                        .param("busId", unlinked.getId().toString())
                        .with(as(userA, "OPERATOR")))
                .andExpect(status().isConflict());

        Bus linked = fx.bus(operatorA, ServiceClassEnum.NORMAL);
        fx.link(linked, permitA);
        linked.setAvailability(BusAvailabilityEnum.OFF_ROAD);
        linked.setAvailabilityFrom(LocalDate.now());
        busRepository.save(linked);
        mvc.perform(patch(opPath(operatorA, trip.getId()) + "/assign-bus")
                        .param("busId", linked.getId().toString())
                        .with(as(userA, "OPERATOR")))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("INC-020 a bus already on an overlapping trip cannot be double-booked")
    void inc020_noDoubleBookingForBus() throws Exception {
        LocalDate date = LocalDate.now().plusDays(1);
        Bus bus = fx.bus(operatorA, ServiceClassEnum.NORMAL);
        fx.link(bus, permitA);
        Trip first = pendingTrip(date, LocalTime.of(8, 0), LocalTime.of(10, 0));
        Trip overlapping = pendingTrip(date, LocalTime.of(9, 30), LocalTime.of(11, 0));
        Trip sameDayNoOverlap = pendingTrip(date, LocalTime.of(12, 0), LocalTime.of(14, 0));

        mvc.perform(patch(opPath(operatorA, first.getId()) + "/assign-bus")
                        .param("busId", bus.getId().toString()).with(as(userA, "OPERATOR")))
                .andExpect(status().isOk());
        mvc.perform(patch(opPath(operatorA, overlapping.getId()) + "/assign-bus")
                        .param("busId", bus.getId().toString()).with(as(userA, "OPERATOR")))
                .andExpect(status().isConflict());
        mvc.perform(patch(opPath(operatorA, sameDayNoOverlap.getId()) + "/assign-bus")
                        .param("busId", bus.getId().toString()).with(as(userA, "OPERATOR")))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("INC-020 a conductor must be active, belong to the trip's operator, and not be double-booked")
    void inc020_conductorRules() throws Exception {
        Trip trip = pendingTrip(LocalDate.now().plusDays(1), LocalTime.of(8, 0), LocalTime.of(10, 0));
        UUID unknown = UUID.randomUUID();
        mvc.perform(patch(opPath(operatorA, trip.getId()) + "/assign-conductor")
                        .param("conductorId", unknown.toString()).with(as(userA, "OPERATOR")))
                .andExpect(status().isBadRequest());

        UUID othersConductor = UUID.randomUUID();
        when(conductorDirectory.find(othersConductor)).thenReturn(
                Optional.of(new Conductor(othersConductor, "X", "active", operatorB.getId().toString())));
        mvc.perform(patch(opPath(operatorA, trip.getId()) + "/assign-conductor")
                        .param("conductorId", othersConductor.toString()).with(as(userA, "OPERATOR")))
                .andExpect(status().isConflict());

        UUID suspended = UUID.randomUUID();
        when(conductorDirectory.find(suspended)).thenReturn(
                Optional.of(new Conductor(suspended, "Y", "suspended", operatorA.getId().toString())));
        mvc.perform(patch(opPath(operatorA, trip.getId()) + "/assign-conductor")
                        .param("conductorId", suspended.toString()).with(as(userA, "OPERATOR")))
                .andExpect(status().isConflict());

        UUID ok = UUID.randomUUID();
        when(conductorDirectory.find(ok)).thenReturn(
                Optional.of(new Conductor(ok, "Z", "active", operatorA.getId().toString())));
        mvc.perform(patch(opPath(operatorA, trip.getId()) + "/assign-conductor")
                        .param("conductorId", ok.toString()).with(as(userA, "OPERATOR")))
                .andExpect(status().isOk());

        Trip overlapping = pendingTrip(trip.getTripDate(), LocalTime.of(9, 30), LocalTime.of(11, 0));
        mvc.perform(patch(opPath(operatorA, overlapping.getId()) + "/assign-conductor")
                        .param("conductorId", ok.toString()).with(as(userA, "OPERATOR")))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("INC-020 only a pending trip can have its bus reassigned")
    void inc020_onlyPendingTripsAreAssignable() throws Exception {
        Trip trip = pendingTrip(LocalDate.now().plusDays(1), LocalTime.of(8, 0), LocalTime.of(10, 0));
        trip.setStatus(TripStatusEnum.active);
        tripRepository.save(trip);
        Bus bus = fx.bus(operatorA, ServiceClassEnum.NORMAL);
        fx.link(bus, permitA);
        mvc.perform(patch(opPath(operatorA, trip.getId()) + "/assign-bus")
                        .param("busId", bus.getId().toString()).with(as(userA, "OPERATOR")))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("INC-020 an operator reports their own pending trip won't run; MOT reinstates it")
    void inc020_operatorCancelsAndMotReinstates() throws Exception {
        Trip trip = pendingTrip(LocalDate.now().plusDays(1), LocalTime.of(8, 0), LocalTime.of(10, 0));
        mvc.perform(patch(opPath(operatorB, trip.getId()) + "/cancel")
                        .param("reason", "x").with(as(userB, "OPERATOR")))
                .andExpect(status().isNotFound());

        mvc.perform(patch(opPath(operatorA, trip.getId()) + "/cancel")
                        .param("reason", "Bus broke down").with(as(userA, "OPERATOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("cancelled"));

        mvc.perform(patch(opPath(operatorA, trip.getId()) + "/cancel")
                        .param("reason", "again").with(as(userA, "OPERATOR")))
                .andExpect(status().isConflict());

        mvc.perform(patch("/api/trips/" + trip.getId() + "/reinstate").with(as(UUID.randomUUID(), "MOT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("pending"));
    }

    private static RequestPostProcessor as(UUID userId, String role) {
        return user(userId.toString()).roles(role);
    }
}
