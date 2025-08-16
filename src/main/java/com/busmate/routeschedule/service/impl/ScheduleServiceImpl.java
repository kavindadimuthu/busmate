package com.busmate.routeschedule.service.impl;

import com.busmate.routeschedule.dto.request.ScheduleRequest;
import com.busmate.routeschedule.dto.response.ScheduleResponse;
import com.busmate.routeschedule.entity.Route;
import com.busmate.routeschedule.entity.RouteStop;
import com.busmate.routeschedule.entity.Schedule;
import com.busmate.routeschedule.entity.ScheduleStop;
import com.busmate.routeschedule.enums.ScheduleTypeEnum;
import com.busmate.routeschedule.enums.StatusEnum;
import com.busmate.routeschedule.exception.ConflictException;
import com.busmate.routeschedule.exception.ResourceNotFoundException;
import com.busmate.routeschedule.repository.RouteRepository;
import com.busmate.routeschedule.repository.RouteStopRepository;
import com.busmate.routeschedule.repository.ScheduleRepository;
import com.busmate.routeschedule.repository.ScheduleStopRepository;
import com.busmate.routeschedule.service.ScheduleService;
import com.busmate.routeschedule.util.MapperUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduleServiceImpl implements ScheduleService {
    private final ScheduleRepository scheduleRepository;
    private final RouteRepository routeRepository;
    private final RouteStopRepository routeStopRepository;
    private final ScheduleStopRepository scheduleStopRepository;
    private final MapperUtils mapperUtils;

    @Override
    @Transactional
    public ScheduleResponse createSchedule(ScheduleRequest request, String userId) {
        log.info("Creating schedule for route: {}", request.getRouteId());
        validateScheduleRequest(request);
        Route route = validateAndGetRoute(request.getRouteId());
        if (scheduleRepository.existsByNameAndRoute_Id(request.getName(), request.getRouteId())) {
            throw new ConflictException("Schedule with name " + request.getName() + " already exists for route " + request.getRouteId());
        }

        Schedule schedule = mapToSchedule(request, userId, route);
        // Ensure the entity is treated as new
        schedule.setId(null);
        
        Schedule savedSchedule = scheduleRepository.save(schedule);
        log.info("Schedule created successfully with id: {}", savedSchedule.getId());
        return mapToResponse(savedSchedule);
    }

    @Override
    @Transactional
    public List<ScheduleResponse> createBulkSchedules(List<ScheduleRequest> requests, String userId) {
        return requests.stream().map(request -> {
            validateScheduleRequest(request);
            Route route = validateAndGetRoute(request.getRouteId());
            if (scheduleRepository.existsByNameAndRoute_Id(request.getName(), request.getRouteId())) {
                throw new ConflictException("Schedule with name " + request.getName() + " already exists for route " + request.getRouteId());
            }
            Schedule schedule = mapToSchedule(request, userId, route);
            // Ensure the entity is treated as new
            schedule.setId(null);
            return mapToResponse(scheduleRepository.save(schedule));
        }).collect(Collectors.toList());
    }

    @Override
    public ScheduleResponse getScheduleById(UUID id) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + id));
        return mapToResponse(schedule);
    }

    @Override
    public List<ScheduleResponse> getAllSchedules() {
        return scheduleRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ScheduleResponse updateSchedule(UUID id, ScheduleRequest request, String userId) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + id));

        validateScheduleRequest(request);
        Route route = validateAndGetRoute(request.getRouteId());
        if (!schedule.getName().equals(request.getName()) &&
                scheduleRepository.existsByNameAndRoute_Id(request.getName(), request.getRouteId())) {
            throw new ConflictException("Schedule with name " + request.getName() + " already exists for route " + request.getRouteId());
        }

        // Update fields manually instead of using mapper to avoid ID issues
        schedule.setName(request.getName());
        schedule.setRoute(route);
        schedule.setEffectiveStartDate(request.getEffectiveStartDate());
        schedule.setEffectiveEndDate(request.getEffectiveEndDate());
        schedule.setUpdatedBy(userId);
        
        try {
            schedule.setScheduleType(ScheduleTypeEnum.valueOf(request.getScheduleType()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid schedule type: " + request.getScheduleType());
        }
        try {
            schedule.setStatus(StatusEnum.valueOf(request.getStatus()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid status: " + request.getStatus());
        }

        if (request.getScheduleStops() != null) {
            schedule.getScheduleStops().clear();
            List<ScheduleStop> scheduleStops = request.getScheduleStops().stream().map(ss -> {
                // Changed: Now finding RouteStop instead of Stop directly
                RouteStop routeStop = routeStopRepository.findByRouteIdAndStopIdAndStopOrder(
                        request.getRouteId(), ss.getStopId(), ss.getStopOrder())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "RouteStop not found for route: " + request.getRouteId() + 
                                ", stop: " + ss.getStopId() + ", order: " + ss.getStopOrder()));
                
                ScheduleStop scheduleStop = new ScheduleStop();
                scheduleStop.setId(null); // Ensure new entity
                scheduleStop.setSchedule(schedule);
                scheduleStop.setRouteStop(routeStop); // Changed: setRouteStop instead of setStop
                scheduleStop.setStopOrder(ss.getStopOrder());
                scheduleStop.setArrivalTime(ss.getArrivalTime());
                scheduleStop.setDepartureTime(ss.getDepartureTime());
                return scheduleStop;
            }).collect(Collectors.toList());
            schedule.setScheduleStops(scheduleStops);
        }

        Schedule updatedSchedule = scheduleRepository.save(schedule);
        return mapToResponse(updatedSchedule);
    }

    @Override
    @Transactional
    public void deleteSchedule(UUID id) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + id));

        scheduleRepository.deleteById(id);
    }

    private void validateScheduleRequest(ScheduleRequest request) {
        if (request.getEffectiveEndDate() != null &&
                request.getEffectiveEndDate().isBefore(request.getEffectiveStartDate())) {
            throw new ConflictException("Effective end date cannot be before start date");
        }
        try {
            ScheduleTypeEnum.valueOf(request.getScheduleType());
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid schedule type: " + request.getScheduleType());
        }
        try {
            StatusEnum.valueOf(request.getStatus());
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid status: " + request.getStatus());
        }
        if (request.getScheduleStops() != null) {
            for (ScheduleRequest.ScheduleStopRequest ss : request.getScheduleStops()) {
                if (ss.getStopOrder() < 0) {
                    throw new ConflictException("Stop order must be non-negative");
                }
            }
        }
    }

    private Route validateAndGetRoute(UUID routeId) {
        return routeRepository.findById(routeId)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + routeId));
    }

    private Schedule mapToSchedule(ScheduleRequest request, String userId, Route route) {
        Schedule schedule = new Schedule();
        schedule.setId(null); // Explicitly set to null for new entity
        schedule.setName(request.getName());
        schedule.setRoute(route);
        schedule.setEffectiveStartDate(request.getEffectiveStartDate());
        schedule.setEffectiveEndDate(request.getEffectiveEndDate());
        schedule.setCreatedBy(userId);
        schedule.setUpdatedBy(userId);
        
        try {
            schedule.setScheduleType(ScheduleTypeEnum.valueOf(request.getScheduleType()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid schedule type: " + request.getScheduleType());
        }
        try {
            schedule.setStatus(StatusEnum.valueOf(request.getStatus()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Invalid status: " + request.getStatus());
        }

        if (request.getScheduleStops() != null) {
            List<ScheduleStop> scheduleStops = request.getScheduleStops().stream().map(ss -> {
                // Changed: Now finding RouteStop instead of Stop directly
                RouteStop routeStop = routeStopRepository.findByRouteIdAndStopIdAndStopOrder(
                        request.getRouteId(), ss.getStopId(), ss.getStopOrder())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "RouteStop not found for route: " + request.getRouteId() + 
                                ", stop: " + ss.getStopId() + ", order: " + ss.getStopOrder()));
                
                ScheduleStop scheduleStop = new ScheduleStop();
                scheduleStop.setId(null); // Explicitly set to null for new entity
                scheduleStop.setSchedule(schedule);
                scheduleStop.setRouteStop(routeStop); // Changed: setRouteStop instead of setStop
                scheduleStop.setStopOrder(ss.getStopOrder());
                scheduleStop.setArrivalTime(ss.getArrivalTime());
                scheduleStop.setDepartureTime(ss.getDepartureTime());
                return scheduleStop;
            }).collect(Collectors.toList());
            schedule.setScheduleStops(scheduleStops);
        }

        return schedule;
    }

    private ScheduleResponse mapToResponse(Schedule schedule) {
        ScheduleResponse response = mapperUtils.map(schedule, ScheduleResponse.class);
        response.setRouteId(schedule.getRoute().getId());
        response.setRouteName(schedule.getRoute().getName());
        response.setRouteGroupId(schedule.getRoute().getRouteGroup().getId());
        response.setRouteGroupName(schedule.getRoute().getRouteGroup().getName());

        if (schedule.getScheduleStops() != null) {
            List<ScheduleResponse.ScheduleStopResponse> stopResponses = schedule.getScheduleStops().stream().map(ss -> {
                ScheduleResponse.ScheduleStopResponse ssResponse = new ScheduleResponse.ScheduleStopResponse();
                // Changed: Now accessing stop through routeStop relationship
                ssResponse.setStopId(ss.getRouteStop().getStop().getId());
                ssResponse.setStopName(ss.getRouteStop().getStop().getName());
                ssResponse.setLocation(mapperUtils.map(ss.getRouteStop().getStop().getLocation(), com.busmate.routeschedule.dto.common.LocationDto.class));
                ssResponse.setStopOrder(ss.getStopOrder());
                ssResponse.setArrivalTime(ss.getArrivalTime());
                ssResponse.setDepartureTime(ss.getDepartureTime());
                return ssResponse;
            }).collect(Collectors.toList());
            response.setScheduleStops(stopResponses);
        }

        return response;
    }
}