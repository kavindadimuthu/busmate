package com.busmate.routeschedule.operations.service.impl;

import com.busmate.routeschedule.fleet.entity.Bus;
import com.busmate.routeschedule.fleet.enums.ServiceClassEnum;
import com.busmate.routeschedule.network.entity.RouteStop;
import com.busmate.routeschedule.network.repository.RouteStopRepository;
import com.busmate.routeschedule.operations.dto.internal.InternalBookingContextResponse;
import com.busmate.routeschedule.operations.entity.Trip;
import com.busmate.routeschedule.operations.repository.TripRepository;
import com.busmate.routeschedule.operations.service.InternalBookingContextService;
import com.busmate.routeschedule.scheduling.entity.Schedule;
import com.busmate.routeschedule.scheduling.entity.ScheduleStop;
import com.busmate.routeschedule.scheduling.repository.ScheduleStopRepository;
import com.busmate.routeschedule.shared.exception.BadRequestException;
import com.busmate.routeschedule.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InternalBookingContextServiceImpl implements InternalBookingContextService {

    private final TripRepository tripRepository;
    private final RouteStopRepository routeStopRepository;
    private final ScheduleStopRepository scheduleStopRepository;

    @Override
    @Transactional(readOnly = true)
    public InternalBookingContextResponse getBookingContext(UUID tripId, UUID fromStopId, UUID toStopId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found: " + tripId));

        Schedule schedule = trip.getSchedule();
        if (schedule == null || schedule.getRoute() == null) {
            throw new BadRequestException("Trip " + tripId + " has no route to price a journey against");
        }
        UUID routeId = schedule.getRoute().getId();

        RouteStop boarding = requireStopOnRoute(routeId, fromStopId, "Boarding");
        RouteStop alighting = requireStopOnRoute(routeId, toStopId, "Alighting");

        // The caller sends two stops; only the route knows whether that is a journey or a
        // backwards request. Rejecting it here keeps a nonsensical pair from reaching a fare
        // table, which would answer with a negative section count rather than an error.
        if (boarding.getStopOrder() != null && alighting.getStopOrder() != null
                && boarding.getStopOrder() >= alighting.getStopOrder()) {
            throw new BadRequestException("Alighting stop must come after the boarding stop on this route");
        }

        Bus bus = trip.getBus();

        return new InternalBookingContextResponse(
                trip.getId(),
                trip.getStatus() != null ? trip.getStatus().name() : null,
                trip.getTripDate(),
                departureFromBoardingStop(schedule, boarding, trip),
                bus != null ? bus.getId() : null,
                bus != null ? bus.getCapacity() : null,
                bus != null ? serviceClassOf(bus) : null,
                routeId,
                resolvedDistanceKm(boarding),
                resolvedDistanceKm(alighting),
                boarding.getStopOrder(),
                alighting.getStopOrder(),
                bus != null && bus.getOperator() != null ? bus.getOperator().getId() : null);
    }

    private RouteStop requireStopOnRoute(UUID routeId, UUID stopId, String role) {
        if (stopId == null) {
            throw new BadRequestException(role + " stop is required");
        }
        return routeStopRepository.findByRouteIdAndStopId(routeId, stopId)
                .orElseThrow(() -> new BadRequestException(
                        role + " stop " + stopId + " is not on this trip's route"));
    }

    /**
     * A passenger boarding mid-route leaves later than the bus leaves the depot, and the booking
     * cutoff is judged against their stop, not the route's origin. Falls back through the same
     * verified/unverified/calculated tiers the passenger query uses, and finally to the trip's own
     * departure — earlier than the truth, so a cutoff decision errs towards closing early rather
     * than selling a seat on a bus that has gone.
     */
    private LocalTime departureFromBoardingStop(Schedule schedule, RouteStop boarding, Trip trip) {
        return scheduleStopRepository.findByScheduleIdOrderByStopOrder(schedule.getId()).stream()
                .filter(ss -> ss.getRouteStop() != null && boarding.getId().equals(ss.getRouteStop().getId()))
                .findFirst()
                .map(this::resolvedDepartureTime)
                .filter(time -> time != null)
                .orElseGet(trip::getScheduledDepartureTime);
    }

    private LocalTime resolvedDepartureTime(ScheduleStop stop) {
        if (stop.getDepartureTime() != null) {
            return stop.getDepartureTime();
        }
        if (stop.getDepartureTimeUnverified() != null) {
            return stop.getDepartureTimeUnverified();
        }
        return stop.getDepartureTimeCalculated();
    }

    private Double resolvedDistanceKm(RouteStop stop) {
        if (stop.getDistanceFromStartKm() != null) {
            return stop.getDistanceFromStartKm();
        }
        if (stop.getDistanceFromStartKmUnverified() != null) {
            return stop.getDistanceFromStartKmUnverified();
        }
        return stop.getDistanceFromStartKmCalculated();
    }

    private String serviceClassOf(Bus bus) {
        return bus.getServiceClass() != null ? bus.getServiceClass().name() : ServiceClassEnum.NORMAL.name();
    }
}
