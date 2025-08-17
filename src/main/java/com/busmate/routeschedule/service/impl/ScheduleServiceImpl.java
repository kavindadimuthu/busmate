package com.busmate.routeschedule.service.impl;

import com.busmate.routeschedule.dto.request.ScheduleCalendarRequest;
import com.busmate.routeschedule.dto.request.ScheduleExceptionRequest;
import com.busmate.routeschedule.dto.request.ScheduleImportRequest;
import com.busmate.routeschedule.dto.request.ScheduleRequest;
import com.busmate.routeschedule.dto.response.ScheduleResponse;
import com.busmate.routeschedule.entity.*;
import com.busmate.routeschedule.enums.ExceptionTypeEnum;
import com.busmate.routeschedule.enums.ScheduleTypeEnum;
import com.busmate.routeschedule.enums.ScheduleStatusEnum; // Changed import
import com.busmate.routeschedule.exception.ConflictException;
import com.busmate.routeschedule.exception.ResourceNotFoundException;
import com.busmate.routeschedule.repository.*;
import com.busmate.routeschedule.service.ScheduleService;
import com.busmate.routeschedule.util.MapperUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduleServiceImpl implements ScheduleService {
    private final ScheduleRepository scheduleRepository;
    private final RouteRepository routeRepository;
    private final RouteStopRepository routeStopRepository;
    private final ScheduleStopRepository scheduleStopRepository;
    private final ScheduleCalendarRepository scheduleCalendarRepository;
    private final ScheduleExceptionRepository scheduleExceptionRepository;
    private final MapperUtils mapperUtils;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public ScheduleResponse createSchedule(ScheduleRequest request, String userId) {
        log.info("Creating basic schedule for route: {}", request.getRouteId());
        validateScheduleRequest(request);
        Route route = validateAndGetRoute(request.getRouteId());
        validateUniqueScheduleName(request.getName(), request.getRouteId(), null);

        Schedule schedule = mapToSchedule(request, userId, route);
        Schedule savedSchedule = scheduleRepository.save(schedule);
        log.info("Schedule created successfully with id: {}", savedSchedule.getId());
        return mapToResponse(savedSchedule);
    }

    @Override
    @Transactional
    public ScheduleResponse createScheduleFull(ScheduleRequest request, String userId) {
        log.info("Creating full schedule for route: {}", request.getRouteId());
        validateScheduleRequest(request);
        Route route = validateAndGetRoute(request.getRouteId());
        validateUniqueScheduleName(request.getName(), request.getRouteId(), null);

        Schedule schedule = mapToSchedule(request, userId, route);
        
        // Add schedule stops
        if (request.getScheduleStops() != null) {
            List<ScheduleStop> scheduleStops = createScheduleStops(schedule, request.getScheduleStops());
            schedule.setScheduleStops(scheduleStops);
        }

        // Add schedule calendar
        if (request.getCalendar() != null) {
            ScheduleCalendar calendar = createScheduleCalendar(schedule, request.getCalendar());
            schedule.setScheduleCalendars(Arrays.asList(calendar));
        }

        // Add schedule exceptions
        if (request.getExceptions() != null) {
            List<ScheduleException> exceptions = createScheduleExceptions(schedule, request.getExceptions());
            schedule.setScheduleExceptions(exceptions);
        }

        Schedule savedSchedule = scheduleRepository.save(schedule);
        log.info("Full schedule created successfully with id: {}", savedSchedule.getId());
        return mapToResponse(savedSchedule);
    }

    @Override
    @Transactional
    public List<ScheduleResponse> createBulkSchedules(List<ScheduleRequest> requests, String userId) {
        return requests.stream()
                .map(request -> createScheduleFull(request, userId))
                .collect(Collectors.toList());
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
    public Page<ScheduleResponse> getAllSchedules(Pageable pageable) {
        Page<Schedule> schedules = scheduleRepository.findAll(pageable);
        return schedules.map(this::mapToResponse);
    }

    @Override // Fixed method signature
    public Page<ScheduleResponse> getSchedulesByRoute(UUID routeId, ScheduleStatusEnum status, Pageable pageable) {
        Page<Schedule> schedules;
        if (status != null) {
            schedules = scheduleRepository.findByRoute_IdAndStatus(routeId, status, pageable);
        } else {
            schedules = scheduleRepository.findByRoute_Id(routeId).stream()
                    .collect(Collectors.collectingAndThen(
                            Collectors.toList(),
                            list -> new org.springframework.data.domain.PageImpl<>(list, pageable, list.size())
                    ));
        }
        return schedules.map(this::mapToResponse);
    }

    @Override // Fixed method signature
    public Page<ScheduleResponse> getSchedulesWithFilters(
            UUID routeId, UUID routeGroupId, ScheduleTypeEnum scheduleType,
            ScheduleStatusEnum status, String searchText, Pageable pageable) {
        Page<Schedule> schedules = scheduleRepository.findAllWithFilters(
                routeId, routeGroupId, scheduleType, status, searchText, pageable);
        return schedules.map(this::mapToResponse);
    }

    @Override
    @Transactional
    public ScheduleResponse updateSchedule(UUID id, ScheduleRequest request, String userId) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + id));

        validateScheduleRequest(request);
        Route route = validateAndGetRoute(request.getRouteId());
        validateUniqueScheduleName(request.getName(), request.getRouteId(), id);

        updateScheduleFields(schedule, request, userId, route);
        Schedule updatedSchedule = scheduleRepository.save(schedule);
        return mapToResponse(updatedSchedule);
    }

    @Override
    @Transactional
    public ScheduleResponse updateScheduleFull(UUID id, ScheduleRequest request, String userId) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + id));

        validateScheduleRequest(request);
        Route route = validateAndGetRoute(request.getRouteId());
        validateUniqueScheduleName(request.getName(), request.getRouteId(), id);

        updateScheduleFields(schedule, request, userId, route);
        
        // Update schedule stops
        if (request.getScheduleStops() != null) {
            updateScheduleStops(schedule, request.getScheduleStops());
        }

        // Update schedule calendar
        if (request.getCalendar() != null) {
            updateScheduleCalendar(schedule, request.getCalendar());
        }

        // Update schedule exceptions
        if (request.getExceptions() != null) {
            updateScheduleExceptions(schedule, request.getExceptions());
        }

        Schedule updatedSchedule = scheduleRepository.save(schedule);
        return mapToResponse(updatedSchedule);
    }

    @Override
    @Transactional
    public void deleteSchedule(UUID id) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + id));
        scheduleRepository.delete(schedule);
    }

    @Override // Fixed method signature
    @Transactional
    public ScheduleResponse updateScheduleStatus(UUID id, ScheduleStatusEnum status, String userId) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + id));
        
        schedule.setStatus(status); // Now uses ScheduleStatusEnum
        schedule.setUpdatedBy(userId);
        
        Schedule updatedSchedule = scheduleRepository.save(schedule);
        return mapToResponse(updatedSchedule);
    }

    @Override
    @Transactional
    public ScheduleResponse activateSchedule(UUID id, String userId) {
        return updateScheduleStatus(id, ScheduleStatusEnum.ACTIVE, userId); // Fixed enum
    }

    @Override
    @Transactional
    public ScheduleResponse deactivateSchedule(UUID id, String userId) {
        return updateScheduleStatus(id, ScheduleStatusEnum.INACTIVE, userId); // Fixed enum
    }

    @Override
    @Transactional
    public ScheduleResponse updateScheduleCalendar(UUID id, ScheduleCalendarRequest request, String userId) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + id));

        updateScheduleCalendar(schedule, request);
        schedule.setUpdatedBy(userId);
        
        Schedule updatedSchedule = scheduleRepository.save(schedule);
        return mapToResponse(updatedSchedule);
    }

    @Override
    @Transactional
    public ScheduleResponse addScheduleException(UUID id, ScheduleExceptionRequest request, String userId) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + id));

        ScheduleException exception = new ScheduleException();
        exception.setSchedule(schedule);
        exception.setExceptionDate(request.getExceptionDate());
        exception.setExceptionType(ExceptionTypeEnum.valueOf(request.getExceptionType()));

        if (schedule.getScheduleExceptions() == null) {
            schedule.setScheduleExceptions(new ArrayList<>());
        }
        schedule.getScheduleExceptions().add(exception);
        schedule.setUpdatedBy(userId);

        Schedule updatedSchedule = scheduleRepository.save(schedule);
        return mapToResponse(updatedSchedule);
    }

    @Override
    @Transactional
    public ScheduleResponse removeScheduleException(UUID id, UUID exceptionId, String userId) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + id));

        schedule.getScheduleExceptions().removeIf(exception -> exception.getId().equals(exceptionId));
        schedule.setUpdatedBy(userId);

        Schedule updatedSchedule = scheduleRepository.save(schedule);
        return mapToResponse(updatedSchedule);
    }

    @Override
    public List<ScheduleResponse.ScheduleExceptionResponse> getScheduleExceptions(UUID id) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + id));

        if (schedule.getScheduleExceptions() == null) {
            return new ArrayList<>();
        }

        return schedule.getScheduleExceptions().stream()
                .map(exception -> {
                    ScheduleResponse.ScheduleExceptionResponse response = new ScheduleResponse.ScheduleExceptionResponse();
                    response.setId(exception.getId());
                    response.setExceptionDate(exception.getExceptionDate());
                    response.setExceptionType(exception.getExceptionType().name());
                    return response;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ScheduleResponse cloneSchedule(UUID id, ScheduleRequest request, String userId) {
        Schedule originalSchedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + id));

        validateScheduleRequest(request);
        Route route = validateAndGetRoute(request.getRouteId());
        validateUniqueScheduleName(request.getName(), request.getRouteId(), null);

        // Create new schedule based on original
        Schedule clonedSchedule = new Schedule();
        clonedSchedule.setName(request.getName());
        clonedSchedule.setDescription(request.getDescription());
        clonedSchedule.setRoute(route);
        clonedSchedule.setScheduleType(ScheduleTypeEnum.valueOf(request.getScheduleType()));
        clonedSchedule.setEffectiveStartDate(request.getEffectiveStartDate());
        clonedSchedule.setEffectiveEndDate(request.getEffectiveEndDate());
        clonedSchedule.setStatus(ScheduleStatusEnum.valueOf(request.getStatus())); // Fixed enum
        clonedSchedule.setCreatedBy(userId);
        clonedSchedule.setUpdatedBy(userId);

        // Clone schedule stops
        if (originalSchedule.getScheduleStops() != null) {
            List<ScheduleStop> clonedStops = originalSchedule.getScheduleStops().stream()
                    .map(originalStop -> {
                        ScheduleStop clonedStop = new ScheduleStop();
                        clonedStop.setSchedule(clonedSchedule);
                        clonedStop.setRouteStop(originalStop.getRouteStop());
                        clonedStop.setStopOrder(originalStop.getStopOrder());
                        clonedStop.setArrivalTime(originalStop.getArrivalTime());
                        clonedStop.setDepartureTime(originalStop.getDepartureTime());
                        return clonedStop;
                    })
                    .collect(Collectors.toList());
            clonedSchedule.setScheduleStops(clonedStops);
        }

        // Clone calendar if provided in request, otherwise use original
        if (request.getCalendar() != null) {
            ScheduleCalendar calendar = createScheduleCalendar(clonedSchedule, request.getCalendar());
            clonedSchedule.setScheduleCalendars(Arrays.asList(calendar));
        } else if (originalSchedule.getScheduleCalendars() != null && !originalSchedule.getScheduleCalendars().isEmpty()) {
            ScheduleCalendar originalCalendar = originalSchedule.getScheduleCalendars().get(0);
            ScheduleCalendar clonedCalendar = new ScheduleCalendar();
            clonedCalendar.setSchedule(clonedSchedule);
            clonedCalendar.setMonday(originalCalendar.getMonday());
            clonedCalendar.setTuesday(originalCalendar.getTuesday());
            clonedCalendar.setWednesday(originalCalendar.getWednesday());
            clonedCalendar.setThursday(originalCalendar.getThursday());
            clonedCalendar.setFriday(originalCalendar.getFriday());
            clonedCalendar.setSaturday(originalCalendar.getSaturday());
            clonedCalendar.setSunday(originalCalendar.getSunday());
            clonedSchedule.setScheduleCalendars(Arrays.asList(clonedCalendar));
        }

        Schedule savedClonedSchedule = scheduleRepository.save(clonedSchedule);
        return mapToResponse(savedClonedSchedule);
    }

    @Override
    @Transactional
    public List<ScheduleResponse> importSchedules(MultipartFile file, String userId) {
        try {
            List<ScheduleImportRequest> importRequests = parseScheduleImportFile(file);
            List<ScheduleResponse> responses = new ArrayList<>();
            
            for (ScheduleImportRequest importRequest : importRequests) {
                try {
                    ScheduleRequest scheduleRequest = convertImportToScheduleRequest(importRequest);
                    ScheduleResponse response = createScheduleFull(scheduleRequest, userId);
                    responses.add(response);
                } catch (Exception e) {
                    log.error("Error importing schedule: {}", importRequest.getName(), e);
                    // Continue with next schedule
                }
            }
            
            return responses;
        } catch (Exception e) {
            log.error("Error importing schedules from file", e);
            throw new RuntimeException("Failed to import schedules: " + e.getMessage());
        }
    }

    @Override
    public List<Map<String, Object>> validateScheduleImport(MultipartFile file) {
        try {
            List<ScheduleImportRequest> importRequests = parseScheduleImportFile(file);
            List<Map<String, Object>> validationResults = new ArrayList<>();
            
            for (int i = 0; i < importRequests.size(); i++) {
                Map<String, Object> result = new HashMap<>();
                result.put("row", i + 1);
                result.put("valid", true);
                result.put("errors", new ArrayList<String>());
                
                ScheduleImportRequest importRequest = importRequests.get(i);
                List<String> errors = (List<String>) result.get("errors");
                
                // Validate required fields
                if (importRequest.getName() == null || importRequest.getName().trim().isEmpty()) {
                    errors.add("Schedule name is required");
                    result.put("valid", false);
                }
                
                if (importRequest.getRouteId() == null) {
                    errors.add("Route ID is required");
                    result.put("valid", false);
                }
                
                // Validate route exists
                if (importRequest.getRouteId() != null && !routeRepository.existsById(importRequest.getRouteId())) {
                    errors.add("Route not found with ID: " + importRequest.getRouteId());
                    result.put("valid", false);
                }
                
                validationResults.add(result);
            }
            
            return validationResults;
        } catch (Exception e) {
            log.error("Error validating import file", e);
            throw new RuntimeException("Failed to validate import file: " + e.getMessage());
        }
    }

    @Override
    public List<ScheduleTypeEnum> getDistinctScheduleTypes() {
        return scheduleRepository.findDistinctScheduleTypes();
    }

    @Override // Fixed method signature and return type
    public List<ScheduleStatusEnum> getDistinctStatuses() {
        return scheduleRepository.findDistinctStatuses();
    }

    @Override
    public Map<String, Object> getScheduleStatistics() {
        Map<String, Object> statistics = new HashMap<>();
        
        statistics.put("totalSchedules", scheduleRepository.count());
        statistics.put("activeSchedules", scheduleRepository.countActiveSchedules());
        statistics.put("inactiveSchedules", scheduleRepository.countInactiveSchedules());
        statistics.put("regularSchedules", scheduleRepository.countRegularSchedules());
        statistics.put("specialSchedules", scheduleRepository.countSpecialSchedules());
        
        return statistics;
    }

    // Private helper methods
    private void validateScheduleRequest(ScheduleRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Schedule name is required");
        }
        if (request.getRouteId() == null) {
            throw new IllegalArgumentException("Route ID is required");
        }
        if (request.getScheduleType() == null || request.getScheduleType().trim().isEmpty()) {
            throw new IllegalArgumentException("Schedule type is required");
        }
        if (request.getEffectiveStartDate() == null) {
            throw new IllegalArgumentException("Effective start date is required");
        }
    }

    private Route validateAndGetRoute(UUID routeId) {
        return routeRepository.findById(routeId)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + routeId));
    }

    private void validateUniqueScheduleName(String name, UUID routeId, UUID excludeId) {
        boolean exists = scheduleRepository.existsByNameAndRoute_Id(name, routeId);
        if (exists) {
            // If updating, check if it's the same schedule
            if (excludeId != null) {
                Schedule existingSchedule = scheduleRepository.findByNameAndRoute_Id(name, routeId);
                if (existingSchedule != null && !existingSchedule.getId().equals(excludeId)) {
                    throw new ConflictException("Schedule name already exists for this route");
                }
            } else {
                throw new ConflictException("Schedule name already exists for this route");
            }
        }
    }

    private Schedule mapToSchedule(ScheduleRequest request, String userId, Route route) {
        Schedule schedule = new Schedule();
        schedule.setName(request.getName());
        schedule.setDescription(request.getDescription());
        schedule.setRoute(route);
        schedule.setScheduleType(ScheduleTypeEnum.valueOf(request.getScheduleType()));
        schedule.setEffectiveStartDate(request.getEffectiveStartDate());
        schedule.setEffectiveEndDate(request.getEffectiveEndDate());
        schedule.setStatus(ScheduleStatusEnum.valueOf(request.getStatus())); // Fixed enum
        schedule.setCreatedBy(userId);
        schedule.setUpdatedBy(userId);
        return schedule;
    }

    private void updateScheduleFields(Schedule schedule, ScheduleRequest request, String userId, Route route) {
        schedule.setName(request.getName());
        schedule.setDescription(request.getDescription());
        schedule.setRoute(route);
        schedule.setScheduleType(ScheduleTypeEnum.valueOf(request.getScheduleType()));
        schedule.setEffectiveStartDate(request.getEffectiveStartDate());
        schedule.setEffectiveEndDate(request.getEffectiveEndDate());
        schedule.setStatus(ScheduleStatusEnum.valueOf(request.getStatus())); // Fixed enum
        schedule.setUpdatedBy(userId);
    }

    private List<ScheduleStop> createScheduleStops(Schedule schedule, List<ScheduleRequest.ScheduleStopRequest> stopRequests) {
        return stopRequests.stream()
                .map(stopRequest -> {
                    ScheduleStop scheduleStop = new ScheduleStop();
                    scheduleStop.setSchedule(schedule);
                    
                    // Find RouteStop by stopId and route
                    RouteStop routeStop = routeStopRepository.findByRouteIdAndStopIdAndStopOrder(
                            schedule.getRoute().getId(), 
                            stopRequest.getStopId(), 
                            stopRequest.getStopOrder())
                            .orElseThrow(() -> new ResourceNotFoundException(
                                    "RouteStop not found for route: " + schedule.getRoute().getId() + 
                                    ", stop: " + stopRequest.getStopId() + 
                                    ", order: " + stopRequest.getStopOrder()));
                    
                    scheduleStop.setRouteStop(routeStop);
                    scheduleStop.setStopOrder(stopRequest.getStopOrder());
                    scheduleStop.setArrivalTime(stopRequest.getArrivalTime());
                    scheduleStop.setDepartureTime(stopRequest.getDepartureTime());
                    return scheduleStop;
                })
                .collect(Collectors.toList());
    }

    private ScheduleCalendar createScheduleCalendar(Schedule schedule, ScheduleCalendarRequest calendarRequest) {
        ScheduleCalendar calendar = new ScheduleCalendar();
        calendar.setSchedule(schedule);
        calendar.setMonday(calendarRequest.getMonday());
        calendar.setTuesday(calendarRequest.getTuesday());
        calendar.setWednesday(calendarRequest.getWednesday());
        calendar.setThursday(calendarRequest.getThursday());
        calendar.setFriday(calendarRequest.getFriday());
        calendar.setSaturday(calendarRequest.getSaturday());
        calendar.setSunday(calendarRequest.getSunday());
        return calendar;
    }

    private List<ScheduleException> createScheduleExceptions(Schedule schedule, List<ScheduleExceptionRequest> exceptionRequests) {
        return exceptionRequests.stream()
                .map(exceptionRequest -> {
                    ScheduleException exception = new ScheduleException();
                    exception.setSchedule(schedule);
                    exception.setExceptionDate(exceptionRequest.getExceptionDate());
                    exception.setExceptionType(ExceptionTypeEnum.valueOf(exceptionRequest.getExceptionType()));
                    return exception;
                })
                .collect(Collectors.toList());
    }

    private void updateScheduleStops(Schedule schedule, List<ScheduleRequest.ScheduleStopRequest> stopRequests) {
        // Clear existing stops
        if (schedule.getScheduleStops() != null) {
            schedule.getScheduleStops().clear();
        } else {
            schedule.setScheduleStops(new ArrayList<>());
        }
        
        // Add new stops
        List<ScheduleStop> newStops = createScheduleStops(schedule, stopRequests);
        schedule.getScheduleStops().addAll(newStops);
    }

    private void updateScheduleCalendar(Schedule schedule, ScheduleCalendarRequest calendarRequest) {
        if (schedule.getScheduleCalendars() != null && !schedule.getScheduleCalendars().isEmpty()) {
            ScheduleCalendar calendar = schedule.getScheduleCalendars().get(0);
            calendar.setMonday(calendarRequest.getMonday());
            calendar.setTuesday(calendarRequest.getTuesday());
            calendar.setWednesday(calendarRequest.getWednesday());
            calendar.setThursday(calendarRequest.getThursday());
            calendar.setFriday(calendarRequest.getFriday());
            calendar.setSaturday(calendarRequest.getSaturday());
            calendar.setSunday(calendarRequest.getSunday());
        } else {
            ScheduleCalendar calendar = createScheduleCalendar(schedule, calendarRequest);
            schedule.setScheduleCalendars(Arrays.asList(calendar));
        }
    }

    private void updateScheduleExceptions(Schedule schedule, List<ScheduleExceptionRequest> exceptionRequests) {
        // Clear existing exceptions
        if (schedule.getScheduleExceptions() != null) {
            schedule.getScheduleExceptions().clear();
        } else {
            schedule.setScheduleExceptions(new ArrayList<>());
        }
        
        // Add new exceptions
        List<ScheduleException> newExceptions = createScheduleExceptions(schedule, exceptionRequests);
        schedule.getScheduleExceptions().addAll(newExceptions);
    }

    private List<ScheduleImportRequest> parseScheduleImportFile(MultipartFile file) throws Exception {
        List<ScheduleImportRequest> requests = new ArrayList<>();
        
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            boolean isHeader = true;
            
            while ((line = reader.readLine()) != null) {
                if (isHeader) {
                    isHeader = false;
                    continue;
                }
                
                String[] values = line.split(",");
                if (values.length >= 8) {
                    ScheduleImportRequest request = new ScheduleImportRequest();
                    request.setName(values[0].trim());
                    request.setRouteId(UUID.fromString(values[1].trim()));
                    request.setScheduleType(values[2].trim());
                    request.setEffectiveStartDate(java.time.LocalDate.parse(values[3].trim()));
                    request.setEffectiveEndDate(values[4].trim().isEmpty() ? null : java.time.LocalDate.parse(values[4].trim()));
                    request.setStatus(values[5].trim());
                    request.setDescription(values[6].trim());
                    
                    // Parse calendar days (assumes format: Mon,Tue,Wed,Thu,Fri,Sat,Sun as true/false)
                    if (values.length >= 15) {
                        request.setMonday(Boolean.parseBoolean(values[7].trim()));
                        request.setTuesday(Boolean.parseBoolean(values[8].trim()));
                        request.setWednesday(Boolean.parseBoolean(values[9].trim()));
                        request.setThursday(Boolean.parseBoolean(values[10].trim()));
                        request.setFriday(Boolean.parseBoolean(values[11].trim()));
                        request.setSaturday(Boolean.parseBoolean(values[12].trim()));
                        request.setSunday(Boolean.parseBoolean(values[13].trim()));
                    }
                    
                    requests.add(request);
                }
            }
        }
        
        return requests;
    }

    private ScheduleRequest convertImportToScheduleRequest(ScheduleImportRequest importRequest) {
        ScheduleRequest request = new ScheduleRequest();
        request.setName(importRequest.getName());
        request.setRouteId(importRequest.getRouteId());
        request.setScheduleType(importRequest.getScheduleType());
        request.setEffectiveStartDate(importRequest.getEffectiveStartDate());
        request.setEffectiveEndDate(importRequest.getEffectiveEndDate());
        request.setStatus(importRequest.getStatus());
        request.setDescription(importRequest.getDescription());
        
        // Convert calendar
        if (importRequest.getMonday() != null) {
            ScheduleCalendarRequest calendar = new ScheduleCalendarRequest();
            calendar.setMonday(importRequest.getMonday());
            calendar.setTuesday(importRequest.getTuesday());
            calendar.setWednesday(importRequest.getWednesday());
            calendar.setThursday(importRequest.getThursday());
            calendar.setFriday(importRequest.getFriday());
            calendar.setSaturday(importRequest.getSaturday());
            calendar.setSunday(importRequest.getSunday());
            request.setCalendar(calendar);
        }
        
        return request;
    }

    private ScheduleResponse mapToResponse(Schedule schedule) {
        ScheduleResponse response = new ScheduleResponse();
        response.setId(schedule.getId());
        response.setName(schedule.getName());
        response.setDescription(schedule.getDescription());
        response.setRouteId(schedule.getRoute().getId());
        response.setRouteName(schedule.getRoute().getName());
        response.setRouteGroupId(schedule.getRoute().getRouteGroup() != null ? schedule.getRoute().getRouteGroup().getId() : null);
        response.setRouteGroupName(schedule.getRoute().getRouteGroup() != null ? schedule.getRoute().getRouteGroup().getName() : null);
        response.setScheduleType(schedule.getScheduleType().name());
        response.setEffectiveStartDate(schedule.getEffectiveStartDate());
        response.setEffectiveEndDate(schedule.getEffectiveEndDate());
        response.setStatus(schedule.getStatus().name());
        response.setCreatedAt(schedule.getCreatedAt());
        response.setUpdatedAt(schedule.getUpdatedAt());
        response.setCreatedBy(schedule.getCreatedBy());
        response.setUpdatedBy(schedule.getUpdatedBy());
        
        // Map schedule stops
        if (schedule.getScheduleStops() != null) {
            response.setScheduleStops(schedule.getScheduleStops().stream()
                    .map(this::mapScheduleStopToResponse)
                    .collect(Collectors.toList()));
        }
        
        // Map schedule calendars
        if (schedule.getScheduleCalendars() != null) {
            response.setScheduleCalendars(schedule.getScheduleCalendars().stream()
                    .map(this::mapScheduleCalendarToResponse)
                    .collect(Collectors.toList()));
        }
        
        // Map schedule exceptions
        if (schedule.getScheduleExceptions() != null) {
            response.setScheduleExceptions(schedule.getScheduleExceptions().stream()
                    .map(this::mapScheduleExceptionToResponse)
                    .collect(Collectors.toList()));
        }
        
        return response;
    }

    private ScheduleResponse.ScheduleStopResponse mapScheduleStopToResponse(ScheduleStop scheduleStop) {
        ScheduleResponse.ScheduleStopResponse response = new ScheduleResponse.ScheduleStopResponse();
        response.setId(scheduleStop.getId());
        response.setStopId(scheduleStop.getRouteStop().getStop().getId());
        response.setStopName(scheduleStop.getRouteStop().getStop().getName());
        response.setStopOrder(scheduleStop.getStopOrder());
        response.setArrivalTime(scheduleStop.getArrivalTime());
        response.setDepartureTime(scheduleStop.getDepartureTime());
        
        // Map location if available
        if (scheduleStop.getRouteStop().getStop().getLocation() != null) {
            response.setLocation(mapperUtils.toLocationDto(scheduleStop.getRouteStop().getStop().getLocation()));
        }
        
        return response;
    }

    private ScheduleResponse.ScheduleCalendarResponse mapScheduleCalendarToResponse(ScheduleCalendar calendar) {
        ScheduleResponse.ScheduleCalendarResponse response = new ScheduleResponse.ScheduleCalendarResponse();
        response.setId(calendar.getId());
        response.setMonday(calendar.getMonday());
        response.setTuesday(calendar.getTuesday());
        response.setWednesday(calendar.getWednesday());
        response.setThursday(calendar.getThursday());
        response.setFriday(calendar.getFriday());
        response.setSaturday(calendar.getSaturday());
        response.setSunday(calendar.getSunday());
        return response;
    }

    private ScheduleResponse.ScheduleExceptionResponse mapScheduleExceptionToResponse(ScheduleException exception) {
        ScheduleResponse.ScheduleExceptionResponse response = new ScheduleResponse.ScheduleExceptionResponse();
        response.setId(exception.getId());
        response.setExceptionDate(exception.getExceptionDate());
        response.setExceptionType(exception.getExceptionType().name());
        return response;
    }
}