package com.busmate.routeschedule.service.impl;

import com.busmate.routeschedule.dto.common.LocationDto;
import com.busmate.routeschedule.dto.request.StopRequest;
import com.busmate.routeschedule.dto.response.RouteStopDetailResponse;
import com.busmate.routeschedule.dto.response.ScheduleStopDetailResponse;
import com.busmate.routeschedule.dto.response.StopResponse;
import com.busmate.routeschedule.entity.RouteStop;
import com.busmate.routeschedule.entity.ScheduleStop;
import com.busmate.routeschedule.entity.Stop;
import com.busmate.routeschedule.repository.RouteStopRepository;
import com.busmate.routeschedule.repository.ScheduleStopRepository;
import com.busmate.routeschedule.repository.StopRepository;
import com.busmate.routeschedule.service.StopService;
import com.busmate.routeschedule.exception.ResourceNotFoundException;
import com.busmate.routeschedule.exception.ConflictException;
import com.busmate.routeschedule.util.MapperUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StopServiceImpl implements StopService {
    private final StopRepository stopRepository;
    private final RouteStopRepository routeStopRepository;
    private final ScheduleStopRepository scheduleStopRepository;
    private final MapperUtils mapperUtils;

    @Override
    public StopResponse createStop(StopRequest request, String userId) {
        if (stopRepository.existsByNameAndLocation_City(request.getName(), request.getLocation().getCity())) {
            throw new ConflictException("Stop with name " + request.getName() + " already exists in city " + request.getLocation().getCity());
        }

        Stop stop = mapperUtils.map(request, Stop.class);
        stop.setCreatedBy(userId);
        stop.setUpdatedBy(userId);
        Stop savedStop = stopRepository.save(stop);
        return mapperUtils.map(savedStop, StopResponse.class);
    }

    @Override
    public StopResponse getStopById(UUID id) {
        Stop stop = stopRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stop not found with id: " + id));
        return mapperUtils.map(stop, StopResponse.class);
    }

    @Override
    public List<StopResponse> getAllStops() {
        return stopRepository.findAll().stream()
                .map(stop -> mapperUtils.map(stop, StopResponse.class))
                .collect(Collectors.toList());
    }

    @Override
    public Page<StopResponse> getAllStops(Pageable pageable) {
        Page<Stop> stops = stopRepository.findAll(pageable);
        return stops.map(stop -> mapperUtils.map(stop, StopResponse.class));
    }

    @Override
    public Page<StopResponse> getAllStopsWithSearch(String searchText, Pageable pageable) {
        Page<Stop> stops = stopRepository.findAllWithSearch(searchText, pageable);
        return stops.map(stop -> mapperUtils.map(stop, StopResponse.class));
    }

    @Override
    public StopResponse updateStop(UUID id, StopRequest request, String userId) {
        Stop stop = stopRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stop not found with id: " + id));

        if (!stop.getName().equals(request.getName()) &&
                stopRepository.existsByNameAndLocation_City(request.getName(), request.getLocation().getCity())) {
            throw new ConflictException("Stop with name " + request.getName() + " already exists in city " + request.getLocation().getCity());
        }

        mapperUtils.map(request, stop);
        stop.setUpdatedBy(userId);
        Stop updatedStop = stopRepository.save(stop);
        return mapperUtils.map(updatedStop, StopResponse.class);
    }

    @Override
    public void deleteStop(UUID id) {
        if (!stopRepository.existsById(id)) {
            throw new ResourceNotFoundException("Stop not found with id: " + id);
        }
        stopRepository.deleteById(id);
    }

    @Override
    public List<String> getDistinctStates() {
        return stopRepository.findDistinctStates();
    }

    @Override
    public List<Boolean> getDistinctAccessibilityStatuses() {
        return stopRepository.findDistinctAccessibilityStatuses();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RouteStopDetailResponse> getStopsByRoute(UUID routeId) {
        List<RouteStop> routeStops = routeStopRepository.findByRouteIdOrderByStopOrder(routeId);

        return routeStops.stream()
                .map(this::mapToRouteStopDetailResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScheduleStopDetailResponse> getStopsWithScheduleBySchedule(UUID scheduleId) {
        List<ScheduleStop> scheduleStops = scheduleStopRepository.findByScheduleIdOrderByStopOrder(scheduleId);

        return scheduleStops.stream()
                .map(this::mapToScheduleStopDetailResponse)
                .collect(Collectors.toList());
    }

    private RouteStopDetailResponse mapToRouteStopDetailResponse(RouteStop routeStop) {
        RouteStopDetailResponse response = new RouteStopDetailResponse();
        response.setRouteStopId(routeStop.getId());
        response.setStopId(routeStop.getStop().getId());
        response.setStopName(routeStop.getStop().getName());
        response.setStopDescription(routeStop.getStop().getDescription());
        response.setLocation(mapperUtils.map(routeStop.getStop().getLocation(), LocationDto.class));
        response.setIsAccessible(routeStop.getStop().getIsAccessible());
        response.setStopOrder(routeStop.getStopOrder());
        response.setDistanceFromStartKm(routeStop.getDistanceFromStartKm());
        return response;
    }

    private ScheduleStopDetailResponse mapToScheduleStopDetailResponse(ScheduleStop scheduleStop) {
        ScheduleStopDetailResponse response = new ScheduleStopDetailResponse();
        RouteStop routeStop = scheduleStop.getRouteStop();
        Stop stop = routeStop.getStop();

        response.setScheduleStopId(scheduleStop.getId());
        response.setRouteStopId(routeStop.getId());
        response.setStopId(stop.getId());
        response.setStopName(stop.getName());
        response.setStopDescription(stop.getDescription());
        response.setLocation(mapperUtils.map(stop.getLocation(), LocationDto.class));
        response.setIsAccessible(stop.getIsAccessible());
        response.setStopOrder(scheduleStop.getStopOrder());
        response.setDistanceFromStartKm(routeStop.getDistanceFromStartKm());
        response.setArrivalTime(scheduleStop.getArrivalTime());
        response.setDepartureTime(scheduleStop.getDepartureTime());

        return response;
    }
}