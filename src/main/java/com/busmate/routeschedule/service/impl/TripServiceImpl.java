package com.busmate.routeschedule.service.impl;

import com.busmate.routeschedule.dto.request.BulkPspAssignmentRequest;
import com.busmate.routeschedule.dto.request.TripRequest;
import com.busmate.routeschedule.dto.response.BulkPspAssignmentResponse;
import com.busmate.routeschedule.dto.response.TripFilterOptionsResponse;
import com.busmate.routeschedule.dto.response.TripResponse;
import com.busmate.routeschedule.dto.response.TripStatisticsResponse;
import com.busmate.routeschedule.entity.*;
import com.busmate.routeschedule.enums.TripStatusEnum;
import com.busmate.routeschedule.enums.StatusEnum;
import com.busmate.routeschedule.exception.BadRequestException;
import com.busmate.routeschedule.exception.ConflictException;
import com.busmate.routeschedule.exception.ResourceNotFoundException;
import com.busmate.routeschedule.repository.*;
import com.busmate.routeschedule.service.TripService;
import com.busmate.routeschedule.util.MapperUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TripServiceImpl implements TripService {
    private final TripRepository tripRepository;
    private final PassengerServicePermitRepository passengerServicePermitRepository;
    private final ScheduleRepository scheduleRepository;
    private final BusRepository busRepository;
    private final MapperUtils mapperUtils;

    @Override
    public TripResponse createTrip(TripRequest request, String userId) {
        validateTripRequest(request);
        
        // PSP is optional - can be null
        PassengerServicePermit passengerServicePermit = request.getPassengerServicePermitId() != null 
                ? validateAndGetPassengerServicePermit(request.getPassengerServicePermitId()) 
                : null;
        
        // Schedule is mandatory
        Schedule schedule = validateAndGetSchedule(request.getScheduleId());
        Bus bus = request.getBusId() != null ? validateAndGetBus(request.getBusId()) : null;
        
        // Check for duplicate trip (only check with schedule and date since PSP is optional)
        if (tripRepository.existsByTripDateAndScheduleId(request.getTripDate(), request.getScheduleId())) {
            throw new ConflictException("Trip already exists for schedule " + request.getScheduleId() + 
                    " on date " + request.getTripDate());
        }

        Trip trip = mapToTrip(request, userId, passengerServicePermit, schedule, bus);
        Trip savedTrip = tripRepository.save(trip);
        return mapToResponse(savedTrip);
    }

    @Override
    @Transactional(readOnly = true)
    public TripResponse getTripById(UUID id) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));
        return mapToResponse(trip);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getAllTrips() {
        return tripRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TripResponse> getAllTripsWithFilters(
            Pageable pageable, 
            String search, 
            TripStatusEnum status,
            UUID routeId,
            UUID operatorId,
            UUID scheduleId,
            UUID passengerServicePermitId,
            UUID busId,
            LocalDate fromDate,
            LocalDate toDate,
            Boolean hasPsp,
            Boolean hasBus,
            Boolean hasDriver,
            Boolean hasConductor) {
        
        log.info("Fetching trips with filters - page: {}, size: {}, search: {}, status: {}", 
                pageable.getPageNumber(), pageable.getPageSize(), search, status);
        
        Specification<Trip> spec = createTripSpecification(
                search, status, routeId, operatorId, scheduleId, 
                passengerServicePermitId, busId, fromDate, toDate,
                hasPsp, hasBus, hasDriver, hasConductor
        );
        
        Page<Trip> trips = tripRepository.findAll(spec, pageable);
        return trips.map(this::mapToResponse);
    }

    private Specification<Trip> createTripSpecification(
            String search, 
            TripStatusEnum status,
            UUID routeId,
            UUID operatorId,
            UUID scheduleId,
            UUID passengerServicePermitId,
            UUID busId,
            LocalDate fromDate,
            LocalDate toDate,
            Boolean hasPsp,
            Boolean hasBus,
            Boolean hasDriver,
            Boolean hasConductor) {
        
        return (root, query, criteriaBuilder) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            
            // Search filter (across multiple fields)
            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.toLowerCase().trim() + "%";
                jakarta.persistence.criteria.Predicate searchPredicate = criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("schedule").get("name")), searchPattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("schedule").get("route").get("name")), searchPattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("schedule").get("route").get("description")), searchPattern),
                        // Operator search through PSP
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("passengerServicePermit").get("operator").get("name")), searchPattern),
                        // Operator search through Bus
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("bus").get("operator").get("name")), searchPattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("passengerServicePermit").get("permitNumber")), searchPattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("bus").get("plateNumber")), searchPattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("notes")), searchPattern)
                );
                predicates.add(searchPredicate);
            }
            
            // Status filter
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            
            // Route filter
            if (routeId != null) {
                predicates.add(criteriaBuilder.equal(root.get("schedule").get("route").get("id"), routeId));
            }
            
            // Operator filter
            if (operatorId != null) {
                jakarta.persistence.criteria.Predicate operatorPredicate = criteriaBuilder.or(
                        criteriaBuilder.equal(root.get("passengerServicePermit").get("operator").get("id"), operatorId),
                        criteriaBuilder.equal(root.get("bus").get("operator").get("id"), operatorId)
                );
                predicates.add(operatorPredicate);
            }
            
            // Schedule filter
            if (scheduleId != null) {
                predicates.add(criteriaBuilder.equal(root.get("schedule").get("id"), scheduleId));
            }
            
            // PSP filter
            if (passengerServicePermitId != null) {
                predicates.add(criteriaBuilder.equal(root.get("passengerServicePermit").get("id"), passengerServicePermitId));
            }
            
            // Bus filter
            if (busId != null) {
                predicates.add(criteriaBuilder.equal(root.get("bus").get("id"), busId));
            }
            
            // Date range filters
            if (fromDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("tripDate"), fromDate));
            }
            if (toDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("tripDate"), toDate));
            }
            
            // Assignment filters
            if (hasPsp != null) {
                if (hasPsp) {
                    predicates.add(criteriaBuilder.isNotNull(root.get("passengerServicePermit")));
                } else {
                    predicates.add(criteriaBuilder.isNull(root.get("passengerServicePermit")));
                }
            }
            
            if (hasBus != null) {
                if (hasBus) {
                    predicates.add(criteriaBuilder.isNotNull(root.get("bus")));
                } else {
                    predicates.add(criteriaBuilder.isNull(root.get("bus")));
                }
            }
            
            if (hasDriver != null) {
                if (hasDriver) {
                    predicates.add(criteriaBuilder.isNotNull(root.get("driverId")));
                } else {
                    predicates.add(criteriaBuilder.isNull(root.get("driverId")));
                }
            }
            
            if (hasConductor != null) {
                if (hasConductor) {
                    predicates.add(criteriaBuilder.isNotNull(root.get("conductorId")));
                } else {
                    predicates.add(criteriaBuilder.isNull(root.get("conductorId")));
                }
            }
            
            return criteriaBuilder.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getTripsByPassengerServicePermit(UUID passengerServicePermitId) {
        return tripRepository.findByPassengerServicePermitId(passengerServicePermitId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getTripsBySchedule(UUID scheduleId) {
        return tripRepository.findByScheduleId(scheduleId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getTripsByRoute(UUID routeId) {
        log.info("Fetching trips for route with ID: {}", routeId);
        return tripRepository.findByScheduleRouteId(routeId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getTripsByDate(LocalDate tripDate) {
        return tripRepository.findByTripDate(tripDate).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getTripsByDateRange(LocalDate startDate, LocalDate endDate) {
        return tripRepository.findByTripDateBetween(startDate, endDate).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getTripsByStatus(TripStatusEnum status) {
        return tripRepository.findByStatus(status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getTripsByBus(UUID busId) {
        return tripRepository.findByBusId(busId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getTripsByDriver(UUID driverId) {
        return tripRepository.findByDriverId(driverId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getTripsByConductor(UUID conductorId) {
        return tripRepository.findByConductorId(conductorId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public TripResponse updateTrip(UUID id, TripRequest request, String userId) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));

        validateTripRequest(request);
        
        // PSP is optional - can be null
        PassengerServicePermit passengerServicePermit = request.getPassengerServicePermitId() != null 
                ? validateAndGetPassengerServicePermit(request.getPassengerServicePermitId()) 
                : null;
        
        Schedule schedule = validateAndGetSchedule(request.getScheduleId());
        Bus bus = request.getBusId() != null ? validateAndGetBus(request.getBusId()) : null;

        // Check for duplicate if schedule or date changed
        if (!trip.getSchedule().getId().equals(request.getScheduleId()) ||
            !trip.getTripDate().equals(request.getTripDate())) {
            if (tripRepository.existsByTripDateAndScheduleId(request.getTripDate(), request.getScheduleId())) {
                throw new ConflictException("Trip already exists for schedule " + request.getScheduleId() + 
                        " on date " + request.getTripDate());
            }
        }

        updateTripFromRequest(trip, request, passengerServicePermit, schedule, bus, userId);
        Trip updatedTrip = tripRepository.save(trip);
        return mapToResponse(updatedTrip);
    }

    @Override
    public TripResponse updateTripStatus(UUID id, TripStatusEnum status, String userId) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));

        trip.setStatus(status);
        trip.setUpdatedBy(userId);
        
        Trip updatedTrip = tripRepository.save(trip);
        return mapToResponse(updatedTrip);
    }

    @Override
    public TripResponse startTrip(UUID id, String userId) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));

        if (!trip.getStatus().equals(TripStatusEnum.pending)) {
            throw new ConflictException("Trip must be in pending status to start");
        }

        trip.setStatus(TripStatusEnum.active);
        trip.setActualDepartureTime(LocalTime.now());
        trip.setUpdatedBy(userId);
        
        Trip updatedTrip = tripRepository.save(trip);
        return mapToResponse(updatedTrip);
    }

    @Override
    public TripResponse completeTrip(UUID id, String userId) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));

        if (!trip.getStatus().equals(TripStatusEnum.active)) {
            throw new ConflictException("Trip must be active to complete");
        }

        trip.setStatus(TripStatusEnum.completed);
        trip.setActualArrivalTime(LocalTime.now());
        trip.setUpdatedBy(userId);
        
        Trip updatedTrip = tripRepository.save(trip);
        return mapToResponse(updatedTrip);
    }

    @Override
    public TripResponse cancelTrip(UUID id, String cancellationReason, String userId) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));

        trip.setStatus(TripStatusEnum.cancelled);
        trip.setNotes(cancellationReason);
        trip.setUpdatedBy(userId);
        
        Trip updatedTrip = tripRepository.save(trip);
        return mapToResponse(updatedTrip);
    }

    @Override
    public void deleteTrip(UUID id) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));
        tripRepository.deleteById(id);
    }

    @Override
    public List<TripResponse> generateTripsForSchedule(UUID scheduleId, LocalDate fromDate, LocalDate toDate, String userId) {
        log.info("Generating trips for schedule with ID: {} by user: {}", scheduleId, userId);

        // Validate schedule exists
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with ID: " + scheduleId));

        // If dates are not provided, use the schedule's entire validity period
        LocalDate effectiveFromDate = fromDate != null ? fromDate : schedule.getEffectiveStartDate();
        LocalDate effectiveToDate = toDate != null ? toDate : schedule.getEffectiveEndDate();
        
        log.info("Using date range: {} to {} (original: {} to {})", 
                effectiveFromDate, effectiveToDate, fromDate, toDate);

        // Validate date range
        if (effectiveFromDate.isAfter(effectiveToDate)) {
            throw new BadRequestException("From date cannot be after to date");
        }

        // Validate dates are within schedule validity period
        if (effectiveFromDate.isBefore(schedule.getEffectiveStartDate()) || effectiveToDate.isAfter(schedule.getEffectiveEndDate())) {
            throw new BadRequestException("Date range must be within schedule validity period (" + 
                    schedule.getEffectiveStartDate() + " to " + schedule.getEffectiveEndDate() + ")");
        }

        // Get schedule stops to determine departure and arrival times
        List<ScheduleStop> scheduleStops = schedule.getScheduleStops();
        if (scheduleStops == null || scheduleStops.isEmpty()) {
            throw new BadRequestException("Schedule has no stops defined. Cannot generate trips.");
        }

        // Sort schedule stops by stop order to get first and last stops
        scheduleStops.sort((s1, s2) -> s1.getStopOrder().compareTo(s2.getStopOrder()));
        
        ScheduleStop firstStop = scheduleStops.get(0);
        ScheduleStop lastStop = scheduleStops.get(scheduleStops.size() - 1);
        
        LocalTime scheduledDepartureTime = firstStop.getDepartureTime();
        LocalTime scheduledArrivalTime = lastStop.getArrivalTime();
        
        if (scheduledDepartureTime == null) {
            throw new BadRequestException("First stop must have a departure time defined");
        }
        if (scheduledArrivalTime == null) {
            throw new BadRequestException("Last stop must have an arrival time defined");
        }

        log.info("Trip schedule times - Departure: {}, Arrival: {}", scheduledDepartureTime, scheduledArrivalTime);

        List<Trip> trips = new ArrayList<>();
        LocalDate currentDate = effectiveFromDate;

        while (!currentDate.isAfter(effectiveToDate)) {
            // Check if trip already exists for this date and schedule
            boolean tripExists = tripRepository.existsByScheduleIdAndTripDate(scheduleId, currentDate);
            
            if (!tripExists) {
                Trip trip = new Trip();
                trip.setSchedule(schedule);
                trip.setPassengerServicePermit(null); // PSP is optional during trip generation
                trip.setTripDate(currentDate);
                trip.setScheduledDepartureTime(scheduledDepartureTime);
                trip.setScheduledArrivalTime(scheduledArrivalTime);
                trip.setStatus(TripStatusEnum.pending);
                trip.setCreatedBy(userId);
                trip.setUpdatedBy(userId);

                trips.add(trip);
            }

            currentDate = currentDate.plusDays(1);
        }

        if (trips.isEmpty()) {
            log.info("No trips to generate - all trips already exist for the date range");
            return Collections.emptyList();
        }

        List<Trip> savedTrips = tripRepository.saveAll(trips);
        log.info("Successfully generated {} trips for schedule {}", savedTrips.size(), scheduleId);

        return savedTrips.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public TripResponse assignPassengerServicePermitToTrip(UUID tripId, UUID passengerServicePermitId, String userId) {
        log.info("Assigning PSP {} to trip {} by user: {}", passengerServicePermitId, tripId, userId);

        // Get the trip
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with ID: " + tripId));

        // Validate PSP exists
        PassengerServicePermit psp = passengerServicePermitRepository.findById(passengerServicePermitId)
                .orElseThrow(() -> new ResourceNotFoundException("Passenger Service Permit not found with ID: " + passengerServicePermitId));

        // Check if trip already has a PSP assigned
        if (trip.getPassengerServicePermit() != null) {
            throw new BadRequestException("Trip already has a passenger service permit assigned");
        }

        // Validate PSP is active
        if (psp.getStatus() != StatusEnum.active) {
            throw new BadRequestException("Passenger Service Permit must be active to assign to trip");
        }

        // Check for duplicate assignment - same PSP, same route, same date
        boolean duplicateExists = tripRepository.existsByPassengerServicePermitIdAndScheduleRouteIdAndTripDate(
                passengerServicePermitId, trip.getSchedule().getRoute().getId(), trip.getTripDate());

        if (duplicateExists) {
            throw new ConflictException(
                    "A trip with the same passenger service permit and route already exists for date: " + trip.getTripDate());
        }

        // Assign PSP to trip
        trip.setPassengerServicePermit(psp);
        trip.setUpdatedBy(userId);

        Trip savedTrip = tripRepository.save(trip);
        log.info("Successfully assigned PSP {} to trip {}", passengerServicePermitId, tripId);

        return mapToResponse(savedTrip);
    }

    @Override
    public List<TripResponse> bulkAssignPassengerServicePermitToTrips(List<UUID> tripIds, UUID passengerServicePermitId, String userId) {
        log.info("Bulk assigning PSP {} to {} trips by user: {}", passengerServicePermitId, tripIds.size(), userId);

        // Validate PSP exists and is active
        PassengerServicePermit psp = passengerServicePermitRepository.findById(passengerServicePermitId)
                .orElseThrow(() -> new ResourceNotFoundException("Passenger Service Permit not found with ID: " + passengerServicePermitId));

        if (psp.getStatus() != StatusEnum.active) {
            throw new BadRequestException("Passenger Service Permit must be active to assign to trips");
        }

        // Get all trips
        List<Trip> trips = tripRepository.findAllById(tripIds);
        if (trips.size() != tripIds.size()) {
            throw new ResourceNotFoundException("One or more trips not found");
        }

        // Validate none of the trips already have PSP assigned
        List<Trip> tripsWithPSP = trips.stream()
                .filter(trip -> trip.getPassengerServicePermit() != null)
                .collect(Collectors.toList());

        if (!tripsWithPSP.isEmpty()) {
            throw new BadRequestException("Some trips already have passenger service permits assigned");
        }

        // Check for potential duplicates
        for (Trip trip : trips) {
            boolean duplicateExists = tripRepository.existsByPassengerServicePermitIdAndScheduleRouteIdAndTripDate(
                    passengerServicePermitId, trip.getSchedule().getRoute().getId(), trip.getTripDate());

            if (duplicateExists) {
                throw new ConflictException(
                        "A trip with the same passenger service permit and route already exists for date: " + trip.getTripDate());
            }
        }

        // Assign PSP to all trips
        trips.forEach(trip -> {
            trip.setPassengerServicePermit(psp);
            trip.setUpdatedBy(userId);
        });

        List<Trip> savedTrips = tripRepository.saveAll(trips);
        log.info("Successfully assigned PSP {} to {} trips", passengerServicePermitId, savedTrips.size());

        return savedTrips.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public TripResponse removePassengerServicePermitFromTrip(UUID tripId, String userId) {
        log.info("Removing PSP from trip {} by user: {}", tripId, userId);

        // Get the trip
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with ID: " + tripId));

        // Check if trip has a PSP assigned
        if (trip.getPassengerServicePermit() == null) {
            throw new BadRequestException("Trip does not have a passenger service permit assigned");
        }

        // Remove PSP from trip
        trip.setPassengerServicePermit(null);
        trip.setUpdatedBy(userId);

        Trip savedTrip = tripRepository.save(trip);
        log.info("Successfully removed PSP from trip {}", tripId);

        return mapToResponse(savedTrip);
    }

    private void validateTripRequest(TripRequest request) {
        if (request.getScheduledDepartureTime().isAfter(request.getScheduledArrivalTime())) {
            throw new ConflictException("Scheduled departure time cannot be after arrival time");
        }
        
        if (request.getActualDepartureTime() != null && request.getActualArrivalTime() != null) {
            if (request.getActualDepartureTime().isAfter(request.getActualArrivalTime())) {
                throw new ConflictException("Actual departure time cannot be after arrival time");
            }
        }
        
        try {
            TripStatusEnum.valueOf(request.getStatus());
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid status: " + request.getStatus());
        }
    }

    private PassengerServicePermit validateAndGetPassengerServicePermit(UUID passengerServicePermitId) {
        return passengerServicePermitRepository.findById(passengerServicePermitId)
                .orElseThrow(() -> new ResourceNotFoundException("Passenger Service Permit not found with id: " + passengerServicePermitId));
    }

    private Schedule validateAndGetSchedule(UUID scheduleId) {
        return scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + scheduleId));
    }

    private Bus validateAndGetBus(UUID busId) {
        return busRepository.findById(busId)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + busId));
    }

    private Trip mapToTrip(TripRequest request, String userId, PassengerServicePermit passengerServicePermit, Schedule schedule, Bus bus) {
        Trip trip = new Trip();
        trip.setPassengerServicePermit(passengerServicePermit);
        trip.setSchedule(schedule);
        trip.setTripDate(request.getTripDate());
        trip.setScheduledDepartureTime(request.getScheduledDepartureTime());
        trip.setActualDepartureTime(request.getActualDepartureTime());
        trip.setScheduledArrivalTime(request.getScheduledArrivalTime());
        trip.setActualArrivalTime(request.getActualArrivalTime());
        trip.setBus(bus);
        trip.setDriverId(request.getDriverId());
        trip.setConductorId(request.getConductorId());
        trip.setStatus(TripStatusEnum.valueOf(request.getStatus()));
        trip.setNotes(request.getNotes());
        trip.setCreatedBy(userId);
        trip.setUpdatedBy(userId);
        return trip;
    }

    private void updateTripFromRequest(Trip trip, TripRequest request, PassengerServicePermit passengerServicePermit, Schedule schedule, Bus bus, String userId) {
        trip.setPassengerServicePermit(passengerServicePermit);
        trip.setSchedule(schedule);
        trip.setTripDate(request.getTripDate());
        trip.setScheduledDepartureTime(request.getScheduledDepartureTime());
        trip.setActualDepartureTime(request.getActualDepartureTime());
        trip.setScheduledArrivalTime(request.getScheduledArrivalTime());
        trip.setActualArrivalTime(request.getActualArrivalTime());
        trip.setBus(bus);
        trip.setDriverId(request.getDriverId());
        trip.setConductorId(request.getConductorId());
        trip.setStatus(TripStatusEnum.valueOf(request.getStatus()));
        trip.setNotes(request.getNotes());
        trip.setUpdatedBy(userId);
    }

    private TripResponse mapToResponse(Trip trip) {
        TripResponse response = mapperUtils.map(trip, TripResponse.class);
        
        // Passenger Service Permit details (nullable)
        PassengerServicePermit permit = trip.getPassengerServicePermit();
        if (permit != null) {
            response.setPassengerServicePermitId(permit.getId());
            response.setPassengerServicePermitNumber(permit.getPermitNumber());
            response.setPermitId(permit.getId());
            response.setPermitNumber(permit.getPermitNumber());
            
            // Operator details
            Operator operator = permit.getOperator();
            if (operator != null) {
                response.setOperatorId(operator.getId());
                response.setOperatorName(operator.getName());
            }
        }
        
        // Schedule details
        Schedule schedule = trip.getSchedule();
        response.setScheduleId(schedule.getId());
        response.setScheduleName(schedule.getName());
        
        // Route details
        Route route = schedule.getRoute();
        response.setRouteId(route.getId());
        response.setRouteName(route.getName());
        
        // Route Group details
        if (route.getRouteGroup() != null) {
            response.setRouteGroupId(route.getRouteGroup().getId());
            response.setRouteGroupName(route.getRouteGroup().getName());
        }
        
        // Bus details
        if (trip.getBus() != null) {
            response.setBusId(trip.getBus().getId());
            response.setBusPlateNumber(trip.getBus().getPlateNumber());
            response.setBusModel(trip.getBus().getModel());
        }
        
        return response;
    }

    @Override
    public BulkPspAssignmentResponse bulkAssignPspsToTrips(BulkPspAssignmentRequest request, String userId) {
        log.info("Processing bulk PSP assignment for {} assignments by user: {}", 
                request.getAssignments().size(), userId);
        
        List<BulkPspAssignmentResponse.AssignmentResult> successfulResults = new ArrayList<>();
        List<BulkPspAssignmentResponse.AssignmentResult> failedResults = new ArrayList<>();
        
        // Process each assignment
        for (BulkPspAssignmentRequest.PspTripAssignment assignment : request.getAssignments()) {
            try {
                // Attempt to assign PSP to trip
                TripResponse tripResponse = assignPassengerServicePermitToTrip(
                        assignment.getTripId(), 
                        assignment.getPassengerServicePermitId(), 
                        userId
                );
                
                // Add to successful results
                successfulResults.add(BulkPspAssignmentResponse.AssignmentResult.builder()
                        .tripId(assignment.getTripId())
                        .passengerServicePermitId(assignment.getPassengerServicePermitId())
                        .success(true)
                        .tripResponse(tripResponse)
                        .build());
                        
            } catch (Exception e) {
                log.warn("Failed to assign PSP {} to trip {}: {}", 
                        assignment.getPassengerServicePermitId(), 
                        assignment.getTripId(), 
                        e.getMessage());
                
                // Add to failed results
                failedResults.add(BulkPspAssignmentResponse.AssignmentResult.builder()
                        .tripId(assignment.getTripId())
                        .passengerServicePermitId(assignment.getPassengerServicePermitId())
                        .success(false)
                        .errorMessage(e.getMessage())
                        .build());
            }
        }
        
        // Build final response
        BulkPspAssignmentResponse response = BulkPspAssignmentResponse.builder()
                .totalRequested(request.getAssignments().size())
                .successfulAssignments(successfulResults.size())
                .failedAssignments(failedResults.size())
                .processedAt(java.time.LocalDateTime.now())
                .successfulResults(successfulResults)
                .failedResults(failedResults)
                .build();
                
        log.info("Bulk PSP assignment completed: {} successful, {} failed out of {} total", 
                response.getSuccessfulAssignments(), 
                response.getFailedAssignments(), 
                response.getTotalRequested());
                
        return response;
    }
    
    @Override
    @Transactional(readOnly = true)
    public TripStatisticsResponse getStatistics() {
        log.info("Retrieving trip statistics");
        
        TripStatisticsResponse stats = new TripStatisticsResponse();
        
        try {
            // Basic counts
            stats.setTotalTrips(tripRepository.getTotalTripsCount());
            stats.setCompletedTrips(tripRepository.countByStatus(TripStatusEnum.completed));
            stats.setCancelledTrips(tripRepository.countByStatus(TripStatusEnum.cancelled));
            stats.setPendingTrips(tripRepository.countByStatus(TripStatusEnum.pending));
            stats.setActiveTrips(tripRepository.countByStatus(TripStatusEnum.active));
            stats.setDelayedTrips(tripRepository.countByStatus(TripStatusEnum.delayed));
            stats.setInTransitTrips(tripRepository.countByStatus(TripStatusEnum.in_transit));
            stats.setBoardingTrips(tripRepository.countByStatus(TripStatusEnum.boarding));
            stats.setDepartedTrips(tripRepository.countByStatus(TripStatusEnum.departed));
            
            // Status distribution
            Map<String, Long> tripsByStatus = new HashMap<>();
            List<Object[]> statusCounts = tripRepository.getTripCountsByStatus();
            for (Object[] row : statusCounts) {
                TripStatusEnum status = (TripStatusEnum) row[0];
                Long count = (Long) row[1];
                tripsByStatus.put(status.name(), count);
            }
            stats.setTripsByStatus(tripsByStatus);
            
            // Date-based statistics
            LocalDate today = LocalDate.now();
            LocalDate tomorrow = today.plusDays(1);
            LocalDate weekStart = today.minusDays(today.getDayOfWeek().getValue() - 1);
            LocalDate weekEnd = weekStart.plusDays(6);
            LocalDate monthStart = today.withDayOfMonth(1);
            LocalDate monthEnd = monthStart.plusMonths(1).minusDays(1);
            
            stats.setTodayTrips(tripRepository.countByTripDate(today));
            stats.setTomorrowTrips(tripRepository.countByTripDate(tomorrow));
            stats.setWeeklyTrips(tripRepository.countByDateRange(weekStart, weekEnd));
            stats.setMonthlyTrips(tripRepository.countByDateRange(monthStart, monthEnd));
            
            // Performance metrics
            stats.setCompletionRate(tripRepository.getCompletionRate());
            stats.setCancellationRate(tripRepository.getCancellationRate());
            
            // Calculate average trips per day (last 30 days)
            LocalDate thirtyDaysAgo = today.minusDays(30);
            Long tripsLast30Days = tripRepository.countByDateRange(thirtyDaysAgo, today);
            stats.setAverageTripsPerDay(tripsLast30Days / 30.0);
            
            // Operational insights
            Map<String, Long> tripsByRoute = new HashMap<>();
            List<Object[]> routeCounts = tripRepository.getTripCountsByRoute();
            for (Object[] row : routeCounts) {
                String routeName = (String) row[0];
                Long count = (Long) row[1];
                tripsByRoute.put(routeName, count);
            }
            stats.setTripsByRoute(tripsByRoute);
            
            Map<String, Long> tripsByOperator = new HashMap<>();
            List<Object[]> operatorCounts = tripRepository.getTripCountsByOperator();
            for (Object[] row : operatorCounts) {
                String operatorName = (String) row[0];
                Long count = (Long) row[1];
                tripsByOperator.put(operatorName, count);
            }
            stats.setTripsByOperator(tripsByOperator);
            
            Map<String, Long> tripsBySchedule = new HashMap<>();
            List<Object[]> scheduleCounts = tripRepository.getTripCountsBySchedule();
            for (Object[] row : scheduleCounts) {
                String scheduleName = (String) row[0];
                Long count = (Long) row[1];
                tripsBySchedule.put(scheduleName, count);
            }
            stats.setTripsBySchedule(tripsBySchedule);
            
            // Assignment statistics
            stats.setTripsWithAssignedPsp(tripRepository.countTripsWithPsp());
            stats.setTripsWithoutPsp(tripRepository.countTripsWithoutPsp());
            stats.setTripsWithAssignedBus(tripRepository.countTripsWithBus());
            stats.setTripsWithoutBus(tripRepository.countTripsWithoutBus());
            stats.setTripsWithDriver(tripRepository.countTripsWithDriver());
            stats.setTripsWithConductor(tripRepository.countTripsWithConductor());
            
            // PSP assignment distribution
            Map<String, Long> tripsWithPsp = new HashMap<>();
            tripsWithPsp.put("ASSIGNED", stats.getTripsWithAssignedPsp());
            tripsWithPsp.put("NOT_ASSIGNED", stats.getTripsWithoutPsp());
            stats.setTripsWithPsp(tripsWithPsp);
            
            // Bus assignment distribution
            Map<String, Long> tripsWithBus = new HashMap<>();
            tripsWithBus.put("ASSIGNED", stats.getTripsWithAssignedBus());
            tripsWithBus.put("NOT_ASSIGNED", stats.getTripsWithoutBus());
            stats.setTripsWithBus(tripsWithBus);
            
            // Time-based insights
            Map<String, Long> tripsByTimeOfDay = new HashMap<>();
            List<Object[]> timeOfDayCounts = tripRepository.getTripCountsByTimeOfDay();
            for (Object[] row : timeOfDayCounts) {
                String timeOfDay = (String) row[0];
                Long count = (Long) row[1];
                tripsByTimeOfDay.put(timeOfDay, count);
            }
            stats.setTripsByTimeOfDay(tripsByTimeOfDay);
            
            Map<String, Long> tripsByDayOfWeek = new HashMap<>();
            List<Object[]> dayOfWeekCounts = tripRepository.getTripCountsByDayOfWeek();
            for (Object[] row : dayOfWeekCounts) {
                String dayOfWeek = (String) row[0];
                Long count = (Long) row[1];
                tripsByDayOfWeek.put(dayOfWeek, count);
            }
            stats.setTripsByDayOfWeek(tripsByDayOfWeek);
            
            // Peak insights
            stats.setPeakTripRoute(tripRepository.getPeakTripRoute());
            stats.setPeakTripOperator(tripRepository.getPeakTripOperator());
            stats.setPeakTripDate(tripRepository.getPeakTripDate());
            stats.setLeastActiveRoute(tripRepository.getLeastActiveRoute());
            
            // Recent activity (last 24 hours)
            java.time.LocalDateTime yesterday = java.time.LocalDateTime.now().minusDays(1);
            stats.setRecentlyCreatedTrips(tripRepository.countRecentlyCreated(yesterday));
            stats.setRecentlyCompletedTrips(tripRepository.countByDateRangeAndStatus(today, today, "completed"));
            stats.setRecentlyCancelledTrips(tripRepository.countByDateRangeAndStatus(today, today, "cancelled"));
            
            // Calculate average trip duration
            Double avgDuration = tripRepository.getAverageTripDurationHours();
            stats.setAverageTripDuration(avgDuration != null ? avgDuration : 0.0);
            
            // Weekly and monthly data
            Map<String, Long> tripsThisWeek = new HashMap<>();
            for (int i = 0; i < 7; i++) {
                LocalDate date = weekStart.plusDays(i);
                Long count = tripRepository.countByTripDate(date);
                tripsThisWeek.put(date.getDayOfWeek().name(), count);
            }
            stats.setTripsThisWeek(tripsThisWeek);
            
            Map<String, Long> tripsThisMonth = new HashMap<>();
            for (int i = 1; i <= today.lengthOfMonth(); i++) {
                LocalDate date = today.withDayOfMonth(i);
                if (!date.isAfter(today)) {
                    Long count = tripRepository.countByTripDate(date);
                    tripsThisMonth.put(String.valueOf(i), count);
                }
            }
            stats.setTripsThisMonth(tripsThisMonth);
            
            // On-time performance calculation (mock for now - would need actual logic)
            long completedTrips = stats.getCompletedTrips() != null ? stats.getCompletedTrips() : 0;
            double onTimeRate = completedTrips > 0 ? 85.0 : 0.0; // Mock 85% on-time rate
            stats.setOnTimePerformanceRate(onTimeRate);
            
        } catch (Exception e) {
            log.error("Error calculating trip statistics", e);
            // Return basic stats in case of error
            stats.setTotalTrips(0L);
            stats.setCompletedTrips(0L);
            stats.setCancelledTrips(0L);
            stats.setPendingTrips(0L);
            stats.setActiveTrips(0L);
        }
        
        log.info("Trip statistics retrieved successfully");
        return stats;
    }
    
    @Override
    @Transactional(readOnly = true)
    public TripFilterOptionsResponse getFilterOptions() {
        log.info("Retrieving trip filter options");
        
        TripFilterOptionsResponse options = new TripFilterOptionsResponse();
        
        try {
            // Status options
            List<String> statuses = Arrays.stream(TripStatusEnum.values())
                    .map(Enum::name)
                    .collect(Collectors.toList());
            options.setStatuses(statuses);
            
            // Route options
            List<TripFilterOptionsResponse.RouteOption> routes = new ArrayList<>();
            List<Object[]> routeData = tripRepository.getDistinctRoutes();
            for (Object[] row : routeData) {
                TripFilterOptionsResponse.RouteOption route = new TripFilterOptionsResponse.RouteOption();
                route.setId(row[0].toString());
                route.setName((String) row[1]);
                route.setRouteNumber((String) row[1]); // Using name as route number for compatibility
                route.setDirection(row[3] != null ? row[3].toString() : null); // Convert enum to string
                route.setRouteGroupName((String) row[4]);
                routes.add(route);
            }
            options.setRoutes(routes);
            
            // Route Group options
            List<TripFilterOptionsResponse.RouteGroupOption> routeGroups = new ArrayList<>();
            List<Object[]> routeGroupData = tripRepository.getDistinctRouteGroups();
            for (Object[] row : routeGroupData) {
                TripFilterOptionsResponse.RouteGroupOption routeGroup = new TripFilterOptionsResponse.RouteGroupOption();
                routeGroup.setId(row[0].toString());
                routeGroup.setName((String) row[1]);
                routeGroup.setDescription((String) row[2]);
                routeGroup.setRouteCount((Long) row[3]);
                routeGroups.add(routeGroup);
            }
            options.setRouteGroups(routeGroups);
            
            // Operator options
            List<TripFilterOptionsResponse.OperatorOption> operators = new ArrayList<>();
            List<Object[]> operatorData = tripRepository.getDistinctOperators();
            for (Object[] row : operatorData) {
                TripFilterOptionsResponse.OperatorOption operator = new TripFilterOptionsResponse.OperatorOption();
                operator.setId(row[0].toString());
                operator.setName((String) row[1]);
                operator.setOperatorType((String) row[2]);
                operator.setRegion((String) row[3]);
                operators.add(operator);
            }
            options.setOperators(operators);
            
            // Schedule options
            List<TripFilterOptionsResponse.ScheduleOption> schedules = new ArrayList<>();
            List<Object[]> scheduleData = tripRepository.getDistinctSchedules();
            for (Object[] row : scheduleData) {
                TripFilterOptionsResponse.ScheduleOption schedule = new TripFilterOptionsResponse.ScheduleOption();
                schedule.setId(row[0].toString());
                schedule.setName((String) row[1]);
                schedule.setRouteName((String) row[2]);
                schedule.setOperatorName((String) row[3]);
                schedule.setScheduleType((String) row[4]);
                schedules.add(schedule);
            }
            options.setSchedules(schedules);
            
            // PSP options
            List<TripFilterOptionsResponse.PspOption> psps = new ArrayList<>();
            List<Object[]> pspData = tripRepository.getDistinctPassengerServicePermits();
            for (Object[] row : pspData) {
                TripFilterOptionsResponse.PspOption psp = new TripFilterOptionsResponse.PspOption();
                psp.setId(row[0].toString());
                psp.setPermitNumber((String) row[1]);
                psp.setOperatorName((String) row[2]);
                psp.setRouteName((String) row[3]);
                psps.add(psp);
            }
            options.setPassengerServicePermits(psps);
            
            // Bus options
            List<TripFilterOptionsResponse.BusOption> buses = new ArrayList<>();
            List<Object[]> busData = tripRepository.getDistinctBuses();
            for (Object[] row : busData) {
                TripFilterOptionsResponse.BusOption bus = new TripFilterOptionsResponse.BusOption();
                bus.setId(row[0].toString());
                bus.setPlateNumber((String) row[1]);
                bus.setModel((String) row[2]);
                bus.setOperatorName((String) row[3]);
                bus.setCapacity((Integer) row[4]);
                buses.add(bus);
            }
            options.setBuses(buses);
            
            // Date range presets
            options.setDateRangePresets(Arrays.asList(
                    "TODAY", "TOMORROW", "THIS_WEEK", "NEXT_WEEK", 
                    "THIS_MONTH", "NEXT_MONTH", "LAST_7_DAYS", 
                    "LAST_30_DAYS", "CUSTOM"
            ));
            
            // Time of day options
            options.setTimeOfDayOptions(Arrays.asList(
                    "MORNING", "AFTERNOON", "EVENING", "NIGHT", "ALL_DAY"
            ));
            
            // Assignment status options
            options.setAssignmentStatuses(Arrays.asList(
                    "PSP_ASSIGNED", "PSP_NOT_ASSIGNED", 
                    "BUS_ASSIGNED", "BUS_NOT_ASSIGNED",
                    "DRIVER_ASSIGNED", "DRIVER_NOT_ASSIGNED",
                    "CONDUCTOR_ASSIGNED", "CONDUCTOR_NOT_ASSIGNED",
                    "FULLY_ASSIGNED", "PARTIALLY_ASSIGNED", "NOT_ASSIGNED"
            ));
            
            // Sort options
            options.setSortOptions(Arrays.asList(
                    "tripDate", "scheduledDepartureTime", "scheduledArrivalTime",
                    "actualDepartureTime", "actualArrivalTime", "status",
                    "routeName", "operatorName", "scheduleName",
                    "permitNumber", "busPlateNumber", "createdAt", "updatedAt"
            ));
            
        } catch (Exception e) {
            log.error("Error retrieving trip filter options", e);
            // Return empty options in case of error
            options.setStatuses(Arrays.asList());
            options.setRoutes(Arrays.asList());
            options.setOperators(Arrays.asList());
        }
        
        log.info("Trip filter options retrieved successfully");
        return options;
    }
}