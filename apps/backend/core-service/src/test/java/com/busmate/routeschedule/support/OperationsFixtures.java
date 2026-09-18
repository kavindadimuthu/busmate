package com.busmate.routeschedule.support;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.busmate.routeschedule.fleet.entity.Bus;
import com.busmate.routeschedule.fleet.entity.Operator;
import com.busmate.routeschedule.fleet.enums.OperatorTypeEnum;
import com.busmate.routeschedule.fleet.enums.ServiceClassEnum;
import com.busmate.routeschedule.fleet.repository.BusRepository;
import com.busmate.routeschedule.fleet.repository.OperatorRepository;
import com.busmate.routeschedule.licensing.entity.BusPassengerServicePermitAssignment;
import com.busmate.routeschedule.licensing.entity.PassengerServicePermit;
import com.busmate.routeschedule.licensing.enums.PassengerServicePermitTypeEnum;
import com.busmate.routeschedule.licensing.enums.RequestStatusEnum;
import com.busmate.routeschedule.licensing.repository.BusPassengerServicePermitAssignmentRepository;
import com.busmate.routeschedule.licensing.repository.PassengerServicePermitRepository;
import com.busmate.routeschedule.network.entity.Route;
import com.busmate.routeschedule.network.entity.RouteGroup;
import com.busmate.routeschedule.network.repository.RouteGroupRepository;
import com.busmate.routeschedule.network.repository.RouteRepository;
import com.busmate.routeschedule.operations.entity.Trip;
import com.busmate.routeschedule.operations.enums.TripStatusEnum;
import com.busmate.routeschedule.operations.repository.TripRepository;
import com.busmate.routeschedule.scheduling.entity.Schedule;
import com.busmate.routeschedule.scheduling.enums.ScheduleStatusEnum;
import com.busmate.routeschedule.scheduling.enums.ScheduleTypeEnum;
import com.busmate.routeschedule.scheduling.repository.ScheduleRepository;
import com.busmate.routeschedule.shared.enums.StatusEnum;

/** Builds the smallest valid operator / permit / bus / trip graph an integration test needs. */
@Component
public class OperationsFixtures {

    @Autowired private OperatorRepository operatorRepository;
    @Autowired private BusRepository busRepository;
    @Autowired private RouteGroupRepository routeGroupRepository;
    @Autowired private RouteRepository routeRepository;
    @Autowired private ScheduleRepository scheduleRepository;
    @Autowired private PassengerServicePermitRepository permitRepository;
    @Autowired private BusPassengerServicePermitAssignmentRepository linkRepository;
    @Autowired private TripRepository tripRepository;

    public Operator operator(String name, UUID userId) {
        Operator operator = new Operator();
        operator.setId(UUID.randomUUID());
        operator.setName(name);
        operator.setOperatorType(OperatorTypeEnum.PRIVATE);
        operator.setStatus(StatusEnum.active);
        operator.setUserId(userId);
        return operatorRepository.save(operator);
    }

    public RouteGroup routeGroup() {
        RouteGroup group = new RouteGroup();
        group.setName("Group " + shortId());
        return routeGroupRepository.save(group);
    }

    public Route route(RouteGroup group) {
        Route route = new Route();
        route.setName("Route " + shortId());
        route.setRouteGroup(group);
        return routeRepository.save(route);
    }

    public Schedule schedule(Route route) {
        Schedule schedule = new Schedule();
        schedule.setRoute(route);
        schedule.setName("Schedule " + shortId());
        schedule.setScheduleType(ScheduleTypeEnum.REGULAR);
        schedule.setEffectiveStartDate(LocalDate.now().minusDays(30));
        schedule.setStatus(ScheduleStatusEnum.ACTIVE);
        return scheduleRepository.save(schedule);
    }

    public Bus bus(Operator operator, ServiceClassEnum serviceClass) {
        Bus bus = new Bus();
        bus.setOperator(operator);
        String plate = "T-" + shortId();
        bus.setPlateNumber(plate);
        bus.setNtcRegistrationNumber("NTC-" + plate);
        bus.setCapacity(49);
        bus.setServiceClass(serviceClass);
        bus.setStatus(StatusEnum.active);
        return busRepository.save(bus);
    }

    public PassengerServicePermit permit(Operator operator, RouteGroup group,
                                         PassengerServicePermitTypeEnum type, int maxBuses) {
        PassengerServicePermit permit = new PassengerServicePermit();
        permit.setOperator(operator);
        permit.setRouteGroup(group);
        permit.setPermitNumber("PSP-" + shortId());
        permit.setIssueDate(LocalDate.now().minusYears(1));
        permit.setExpiryDate(LocalDate.now().plusYears(1));
        permit.setMaximumBusAssigned(maxBuses);
        permit.setPermitType(type);
        permit.setStatus(StatusEnum.active);
        return permitRepository.save(permit);
    }

    public BusPassengerServicePermitAssignment link(Bus bus, PassengerServicePermit permit) {
        BusPassengerServicePermitAssignment link = new BusPassengerServicePermitAssignment();
        link.setBus(bus);
        link.setPassengerServicePermit(permit);
        link.setStartDate(LocalDate.now().minusDays(10));
        link.setRequestStatus(RequestStatusEnum.ACCEPTED);
        link.setStatus(StatusEnum.active);
        return linkRepository.save(link);
    }

    public Trip trip(Schedule schedule, PassengerServicePermit permit, LocalDate date, LocalTime departs, LocalTime arrives) {
        Trip trip = new Trip();
        trip.setSchedule(schedule);
        trip.setPassengerServicePermit(permit);
        trip.setTripDate(date);
        trip.setScheduledDepartureTime(departs);
        trip.setScheduledArrivalTime(arrives);
        trip.setStatus(TripStatusEnum.pending);
        return tripRepository.save(trip);
    }

    public static String shortId() {
        return UUID.randomUUID().toString().substring(0, 8);
    }
}
