package com.busmate.routeschedule.service.impl;

import com.busmate.routeschedule.dto.request.ScheduleCalendarRequest;
import com.busmate.routeschedule.dto.request.ScheduleExceptionRequest;
import com.busmate.routeschedule.dto.request.ScheduleRequest;
import com.busmate.routeschedule.dto.request.ScheduleCsvImportRequest;
import com.busmate.routeschedule.dto.response.ScheduleResponse;
import com.busmate.routeschedule.dto.response.importing.ScheduleCsvImportResponse;
import com.busmate.routeschedule.entity.*;
import com.busmate.routeschedule.enums.ExceptionTypeEnum;
import com.busmate.routeschedule.enums.ScheduleTypeEnum;
import com.busmate.routeschedule.enums.ScheduleStatusEnum;
import com.busmate.routeschedule.exception.ConflictException;
import com.busmate.routeschedule.exception.ResourceNotFoundException;
import com.busmate.routeschedule.repository.*;
import com.busmate.routeschedule.service.ScheduleService;
import com.busmate.routeschedule.service.TripService;
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
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
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
    private final TripService tripService;
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
        
        // Generate trips if requested
        if (request.isGenerateTrips()) {
            log.info("Generating trips for schedule: {}", savedSchedule.getId());
            try {
                tripService.generateTripsForSchedule(
                    savedSchedule.getId(),
                    savedSchedule.getEffectiveStartDate(),
                    savedSchedule.getEffectiveEndDate(),
                    userId
                );
                log.info("Successfully generated trips for schedule: {}", savedSchedule.getId());
            } catch (Exception e) {
                log.error("Failed to generate trips for schedule: {}, error: {}", savedSchedule.getId(), e.getMessage());
                // Don't fail the schedule creation if trip generation fails
            }
        }
        
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
            // Use ArrayList instead of Arrays.asList to ensure mutable collection
            schedule.setScheduleCalendars(new ArrayList<>(List.of(calendar)));
        }

        // Add schedule exceptions
        if (request.getExceptions() != null) {
            List<ScheduleException> exceptions = createScheduleExceptions(schedule, request.getExceptions());
            schedule.setScheduleExceptions(exceptions);
        }

        Schedule savedSchedule = scheduleRepository.save(schedule);
        
        // Generate trips if requested
        if (request.isGenerateTrips()) {
            log.info("Generating trips for full schedule: {}", savedSchedule.getId());
            try {
                tripService.generateTripsForSchedule(
                    savedSchedule.getId(),
                    savedSchedule.getEffectiveStartDate(),
                    savedSchedule.getEffectiveEndDate(),
                    userId
                );
                log.info("Successfully generated trips for full schedule: {}", savedSchedule.getId());
            } catch (Exception e) {
                log.error("Failed to generate trips for full schedule: {}, error: {}", savedSchedule.getId(), e.getMessage());
                // Don't fail the schedule creation if trip generation fails
            }
        }
        
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
            clonedSchedule.setScheduleCalendars(new ArrayList<>(List.of(calendar)));
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
            clonedSchedule.setScheduleCalendars(new ArrayList<>(List.of(clonedCalendar)));
        }

        Schedule savedClonedSchedule = scheduleRepository.save(clonedSchedule);
        return mapToResponse(savedClonedSchedule);
    }

    @Override
    @Transactional
    public ScheduleCsvImportResponse importSchedulesFromCsv(MultipartFile file, ScheduleCsvImportRequest options, String userId) {
        log.info("Starting CSV schedule import for user: {}", userId);
        
        ScheduleCsvImportResponse response = new ScheduleCsvImportResponse();
        response.setErrors(new ArrayList<>());
        response.setWarnings(new ArrayList<>());
        
        ScheduleCsvImportResponse.ImportSummary summary = new ScheduleCsvImportResponse.ImportSummary();
        summary.setCreatedSchedules(new ArrayList<>());
        summary.setProcessedAt(LocalDateTime.now());
        summary.setProcessedBy(userId);
        summary.setSchedulesCreated(0);
        summary.setSchedulesUpdated(0);
        summary.setSchedulesSkipped(0);
        summary.setStopsCreated(0);
        summary.setStopsUpdated(0);
        summary.setStopsSkipped(0);
        
        // Store options used
        ScheduleCsvImportResponse.ImportSummary.ImportOptionsUsed optionsUsed = new ScheduleCsvImportResponse.ImportSummary.ImportOptionsUsed();
        optionsUsed.setScheduleDuplicateStrategy(options.getScheduleDuplicateStrategy().name());
        optionsUsed.setScheduleStopDuplicateStrategy(options.getScheduleStopDuplicateStrategy().name());
        optionsUsed.setValidateRouteExists(options.getValidateRouteExists());
        optionsUsed.setValidateRouteStopExists(options.getValidateRouteStopExists());
        optionsUsed.setContinueOnError(options.getContinueOnError());
        optionsUsed.setAllowPartialStops(options.getAllowPartialStops());
        optionsUsed.setGenerateTrips(options.getGenerateTrips());
        optionsUsed.setDefaultStatus(options.getDefaultStatus());
        optionsUsed.setDefaultScheduleType(options.getDefaultScheduleType());
        summary.setOptionsUsed(optionsUsed);
        
        try {
            // Parse CSV file
            List<CsvScheduleRow> rows = parseCsvFile(file, options, response);
            response.setTotalRows(rows.size());
            
            if (rows.isEmpty()) {
                response.setMessage("No valid rows found in CSV file");
                response.setSummary(summary);
                return response;
            }
            
            // Group rows by schedule (composite key: name + route_id + effective_start_date)
            Map<String, List<CsvScheduleRow>> groupedSchedules = groupRowsBySchedule(rows);
            response.setTotalSchedulesIdentified(groupedSchedules.size());
            
            int successfulSchedules = 0;
            int failedSchedules = 0;
            int skippedSchedules = 0;
            int totalStopsCreated = 0;
            int totalStopsFailed = 0;
            
            // Process each schedule group
            for (Map.Entry<String, List<CsvScheduleRow>> entry : groupedSchedules.entrySet()) {
                List<CsvScheduleRow> scheduleRows = entry.getValue();
                CsvScheduleRow firstRow = scheduleRows.get(0);
                
                try {
                    ProcessScheduleResult result = processScheduleGroup(scheduleRows, options, userId, response);
                    
                    if (result.isSuccess()) {
                        successfulSchedules++;
                        totalStopsCreated += result.getStopsCreated();
                        
                        // Add to created schedules list
                        ScheduleCsvImportResponse.ImportSummary.CreatedSchedule created = new ScheduleCsvImportResponse.ImportSummary.CreatedSchedule();
                        created.setId(result.getScheduleId());
                        created.setName(firstRow.getScheduleName());
                        created.setRouteId(firstRow.getRouteId());
                        created.setRouteName(result.getRouteName());
                        created.setAction(result.getAction());
                        created.setStopsCount(result.getStopsCreated());
                        created.setStartRowNumber(firstRow.getRowNumber());
                        created.setEndRowNumber(scheduleRows.get(scheduleRows.size() - 1).getRowNumber());
                        summary.getCreatedSchedules().add(created);
                        
                        if ("CREATED".equals(result.getAction())) {
                            summary.setSchedulesCreated(summary.getSchedulesCreated() + 1);
                        } else if ("UPDATED".equals(result.getAction())) {
                            summary.setSchedulesUpdated(summary.getSchedulesUpdated() + 1);
                        }
                        summary.setStopsCreated(summary.getStopsCreated() + result.getStopsCreated());
                    } else if (result.isSkipped()) {
                        skippedSchedules++;
                        summary.setSchedulesSkipped(summary.getSchedulesSkipped() + 1);
                    } else {
                        failedSchedules++;
                        totalStopsFailed += result.getStopsFailed();
                    }
                    
                } catch (Exception e) {
                    log.error("Error processing schedule group: {}", entry.getKey(), e);
                    failedSchedules++;
                    
                    ScheduleCsvImportResponse.ImportError error = new ScheduleCsvImportResponse.ImportError();
                    error.setRowNumber(firstRow.getRowNumber());
                    error.setScheduleName(firstRow.getScheduleName());
                    error.setErrorMessage("Failed to process schedule: " + e.getMessage());
                    error.setSeverity(ScheduleCsvImportResponse.ImportError.ErrorSeverity.ERROR);
                    response.getErrors().add(error);
                    
                    if (!options.getContinueOnError()) {
                        break;
                    }
                }
            }
            
            response.setSuccessfulSchedules(successfulSchedules);
            response.setFailedSchedules(failedSchedules);
            response.setSkippedSchedules(skippedSchedules);
            response.setTotalStopsCreated(totalStopsCreated);
            response.setTotalStopsFailed(totalStopsFailed);
            response.setSummary(summary);
            
            // Generate summary message
            StringBuilder message = new StringBuilder();
            message.append(String.format("Successfully imported %d schedules with %d stops.", successfulSchedules, totalStopsCreated));
            if (failedSchedules > 0) {
                message.append(String.format(" %d schedules failed.", failedSchedules));
            }
            if (skippedSchedules > 0) {
                message.append(String.format(" %d schedules skipped.", skippedSchedules));
            }
            if (totalStopsFailed > 0) {
                message.append(String.format(" %d stops failed.", totalStopsFailed));
            }
            response.setMessage(message.toString());
            
        } catch (Exception e) {
            log.error("Error importing schedules from CSV", e);
            ScheduleCsvImportResponse.ImportError error = new ScheduleCsvImportResponse.ImportError();
            error.setErrorMessage("Failed to parse CSV file: " + e.getMessage());
            error.setSeverity(ScheduleCsvImportResponse.ImportError.ErrorSeverity.ERROR);
            response.getErrors().add(error);
            response.setMessage("Import failed: " + e.getMessage());
            response.setSummary(summary);
        }
        
        return response;
    }
    
    @Override
    public byte[] getScheduleImportTemplate() {
        StringBuilder csv = new StringBuilder();
        
        // Header row
        csv.append("schedule_name,route_id,schedule_type,effective_start_date,effective_end_date,status,description,route_stop_id,stop_order,arrival_time,departure_time\n");
        
        // Example rows - showing same schedule with multiple stops
        csv.append("\"Morning Express\",77777777-7777-7777-7777-777777777771,REGULAR,2025-09-25,2025-12-31,ACTIVE,\"Express morning service\",33333333-3333-3333-3333-333333333331,1,08:30:00,08:35:00\n");
        csv.append("\"Morning Express\",77777777-7777-7777-7777-777777777771,REGULAR,2025-09-25,2025-12-31,ACTIVE,\"Express morning service\",33333333-3333-3333-3333-333333333332,2,09:00:00,09:05:00\n");
        csv.append("\"Morning Express\",77777777-7777-7777-7777-777777777771,REGULAR,2025-09-25,2025-12-31,ACTIVE,\"Express morning service\",33333333-3333-3333-3333-333333333333,3,09:30:00,09:35:00\n");
        
        // Second schedule example
        csv.append("\"Evening Service\",77777777-7777-7777-7777-777777777772,REGULAR,2025-09-25,,ACTIVE,\"Evening return service\",44444444-4444-4444-4444-444444444441,1,17:00:00,17:05:00\n");
        csv.append("\"Evening Service\",77777777-7777-7777-7777-777777777772,REGULAR,2025-09-25,,ACTIVE,\"Evening return service\",44444444-4444-4444-4444-444444444442,2,17:30:00,17:35:00\n");
        
        // Third schedule - special type
        csv.append("\"Holiday Special\",77777777-7777-7777-7777-777777777771,SPECIAL,2025-12-25,2025-12-25,ACTIVE,\"Christmas special\",33333333-3333-3333-3333-333333333331,1,10:00:00,10:05:00\n");
        
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public List<ScheduleTypeEnum> getDistinctScheduleTypes() {
        return scheduleRepository.findDistinctScheduleTypes();
    }

    @Override
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
        // Clear existing stops (orphanRemoval will handle deletion)
        if (schedule.getScheduleStops() == null) {
            schedule.setScheduleStops(new ArrayList<>());
        }
        schedule.getScheduleStops().clear();
        
        // Create and add new stops to existing collection
        List<ScheduleStop> newStops = createScheduleStops(schedule, stopRequests);
        schedule.getScheduleStops().addAll(newStops);
    }

    private void updateScheduleCalendar(Schedule schedule, ScheduleCalendarRequest calendarRequest) {
        // Initialize collection if null
        if (schedule.getScheduleCalendars() == null) {
            schedule.setScheduleCalendars(new ArrayList<>());
        }
        
        if (!schedule.getScheduleCalendars().isEmpty()) {
            // Update existing calendar
            ScheduleCalendar calendar = schedule.getScheduleCalendars().get(0);
            calendar.setMonday(calendarRequest.getMonday());
            calendar.setTuesday(calendarRequest.getTuesday());
            calendar.setWednesday(calendarRequest.getWednesday());
            calendar.setThursday(calendarRequest.getThursday());
            calendar.setFriday(calendarRequest.getFriday());
            calendar.setSaturday(calendarRequest.getSaturday());
            calendar.setSunday(calendarRequest.getSunday());
        } else {
            // Add new calendar to existing collection
            ScheduleCalendar calendar = createScheduleCalendar(schedule, calendarRequest);
            schedule.getScheduleCalendars().add(calendar);
        }
    }

    private void updateScheduleExceptions(Schedule schedule, List<ScheduleExceptionRequest> exceptionRequests) {
        // Clear existing exceptions (orphanRemoval will handle deletion)
        if (schedule.getScheduleExceptions() == null) {
            schedule.setScheduleExceptions(new ArrayList<>());
        }
        schedule.getScheduleExceptions().clear();
        
        // Create and add new exceptions to existing collection
        List<ScheduleException> newExceptions = createScheduleExceptions(schedule, exceptionRequests);
        schedule.getScheduleExceptions().addAll(newExceptions);
    }

    // ========== CSV Import Helper Classes and Methods ==========
    
    /**
     * Internal class to represent a parsed CSV row
     */
    @lombok.Data
    private static class CsvScheduleRow {
        private int rowNumber;
        private String rawRow;
        
        // Schedule fields
        private String scheduleName;
        private UUID routeId;
        private String scheduleType;
        private LocalDate effectiveStartDate;
        private LocalDate effectiveEndDate;
        private String status;
        private String description;
        
        // Schedule stop fields
        private UUID routeStopId;
        private Integer stopOrder;
        private LocalTime arrivalTime;
        private LocalTime departureTime;
        
        public String getCompositeKey() {
            return scheduleName + "|" + routeId + "|" + effectiveStartDate;
        }
    }
    
    /**
     * Internal class to represent the result of processing a schedule group
     */
    @lombok.Data
    private static class ProcessScheduleResult {
        private boolean success;
        private boolean skipped;
        private UUID scheduleId;
        private String routeName;
        private String action; // CREATED, UPDATED, SKIPPED
        private int stopsCreated;
        private int stopsFailed;
    }
    
    /**
     * Parse CSV file and return list of CsvScheduleRow objects
     */
    private List<CsvScheduleRow> parseCsvFile(MultipartFile file, ScheduleCsvImportRequest options, 
                                              ScheduleCsvImportResponse response) throws Exception {
        List<CsvScheduleRow> rows = new ArrayList<>();
        
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            int rowNumber = 0;
            String[] headers = null;
            
            while ((line = reader.readLine()) != null) {
                rowNumber++;
                
                // Skip empty lines
                if (line.trim().isEmpty()) {
                    continue;
                }
                
                // First non-empty line is header
                if (headers == null) {
                    headers = parseCsvLine(line);
                    continue;
                }
                
                try {
                    String[] values = parseCsvLine(line);
                    CsvScheduleRow row = parseCsvRow(values, headers, rowNumber, line, options, response);
                    
                    if (row != null) {
                        rows.add(row);
                    }
                } catch (Exception e) {
                    log.warn("Error parsing row {}: {}", rowNumber, e.getMessage());
                    
                    ScheduleCsvImportResponse.ImportError error = new ScheduleCsvImportResponse.ImportError();
                    error.setRowNumber(rowNumber);
                    error.setErrorMessage("Failed to parse row: " + e.getMessage());
                    error.setRawCsvRow(line);
                    error.setSeverity(ScheduleCsvImportResponse.ImportError.ErrorSeverity.ERROR);
                    response.getErrors().add(error);
                    
                    if (!options.getContinueOnError()) {
                        throw e;
                    }
                }
            }
        }
        
        return rows;
    }
    
    /**
     * Parse a single CSV line handling quoted values
     */
    private String[] parseCsvLine(String line) {
        List<String> values = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            
            if (c == '"') {
                // Check for escaped quote ("")
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++; // Skip the next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                values.add(current.toString().trim());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        
        values.add(current.toString().trim());
        return values.toArray(new String[0]);
    }
    
    /**
     * Parse a CSV row into a CsvScheduleRow object
     */
    private CsvScheduleRow parseCsvRow(String[] values, String[] headers, int rowNumber, String rawRow,
                                       ScheduleCsvImportRequest options, ScheduleCsvImportResponse response) {
        CsvScheduleRow row = new CsvScheduleRow();
        row.setRowNumber(rowNumber);
        row.setRawRow(rawRow);
        
        Map<String, String> valueMap = new HashMap<>();
        for (int i = 0; i < headers.length && i < values.length; i++) {
            valueMap.put(headers[i].toLowerCase().trim(), values[i]);
        }
        
        List<String> rowErrors = new ArrayList<>();
        
        // Parse schedule_name (required)
        String scheduleName = getValueOrNull(valueMap, "schedule_name");
        if (scheduleName == null || scheduleName.isEmpty()) {
            rowErrors.add("schedule_name is required");
        }
        row.setScheduleName(scheduleName);
        
        // Parse route_id (required)
        String routeIdStr = getValueOrNull(valueMap, "route_id");
        if (routeIdStr == null || routeIdStr.isEmpty()) {
            rowErrors.add("route_id is required");
        } else {
            try {
                row.setRouteId(UUID.fromString(routeIdStr));
            } catch (IllegalArgumentException e) {
                rowErrors.add("Invalid UUID format for route_id: " + routeIdStr);
            }
        }
        
        // Parse schedule_type (optional, use default)
        String scheduleType = getValueOrNull(valueMap, "schedule_type");
        if (scheduleType == null || scheduleType.isEmpty()) {
            scheduleType = options.getDefaultScheduleType();
            addWarning(response, rowNumber, scheduleName, "schedule_type", 
                      "Using default value: " + scheduleType, "USED_DEFAULT");
        }
        row.setScheduleType(scheduleType.toUpperCase());
        
        // Parse effective_start_date (required)
        String startDateStr = getValueOrNull(valueMap, "effective_start_date");
        if (startDateStr == null || startDateStr.isEmpty()) {
            rowErrors.add("effective_start_date is required");
        } else {
            try {
                row.setEffectiveStartDate(parseDate(startDateStr));
            } catch (DateTimeParseException e) {
                rowErrors.add("Invalid date format for effective_start_date: " + startDateStr);
            }
        }
        
        // Parse effective_end_date (optional)
        String endDateStr = getValueOrNull(valueMap, "effective_end_date");
        if (endDateStr != null && !endDateStr.isEmpty()) {
            try {
                row.setEffectiveEndDate(parseDate(endDateStr));
            } catch (DateTimeParseException e) {
                rowErrors.add("Invalid date format for effective_end_date: " + endDateStr);
            }
        }
        
        // Parse status (optional, use default)
        String status = getValueOrNull(valueMap, "status");
        if (status == null || status.isEmpty()) {
            status = options.getDefaultStatus();
            addWarning(response, rowNumber, scheduleName, "status", 
                      "Using default value: " + status, "USED_DEFAULT");
        }
        row.setStatus(status.toUpperCase());
        
        // Parse description (optional)
        row.setDescription(getValueOrNull(valueMap, "description"));
        
        // Parse route_stop_id (required for stop)
        String routeStopIdStr = getValueOrNull(valueMap, "route_stop_id");
        if (routeStopIdStr != null && !routeStopIdStr.isEmpty()) {
            try {
                row.setRouteStopId(UUID.fromString(routeStopIdStr));
            } catch (IllegalArgumentException e) {
                rowErrors.add("Invalid UUID format for route_stop_id: " + routeStopIdStr);
            }
        }
        
        // Parse stop_order (required for stop)
        String stopOrderStr = getValueOrNull(valueMap, "stop_order");
        if (stopOrderStr != null && !stopOrderStr.isEmpty()) {
            try {
                row.setStopOrder(Integer.parseInt(stopOrderStr));
            } catch (NumberFormatException e) {
                rowErrors.add("Invalid number format for stop_order: " + stopOrderStr);
            }
        }
        
        // Parse arrival_time (optional)
        String arrivalTimeStr = getValueOrNull(valueMap, "arrival_time");
        if (arrivalTimeStr != null && !arrivalTimeStr.isEmpty()) {
            try {
                row.setArrivalTime(parseTime(arrivalTimeStr));
            } catch (DateTimeParseException e) {
                rowErrors.add("Invalid time format for arrival_time: " + arrivalTimeStr);
            }
        }
        
        // Parse departure_time (optional)
        String departureTimeStr = getValueOrNull(valueMap, "departure_time");
        if (departureTimeStr != null && !departureTimeStr.isEmpty()) {
            try {
                row.setDepartureTime(parseTime(departureTimeStr));
            } catch (DateTimeParseException e) {
                rowErrors.add("Invalid time format for departure_time: " + departureTimeStr);
            }
        }
        
        // Validate time sequence if enabled
        if (options.getValidateTimeSequence() && row.getArrivalTime() != null && row.getDepartureTime() != null) {
            if (row.getArrivalTime().isAfter(row.getDepartureTime())) {
                addWarning(response, rowNumber, scheduleName, "arrival_time/departure_time",
                          "Arrival time is after departure time", "VALIDATION_WARNING");
            }
        }
        
        // Add errors if any
        if (!rowErrors.isEmpty()) {
            for (String errorMsg : rowErrors) {
                ScheduleCsvImportResponse.ImportError error = new ScheduleCsvImportResponse.ImportError();
                error.setRowNumber(rowNumber);
                error.setScheduleName(scheduleName);
                error.setErrorMessage(errorMsg);
                error.setRawCsvRow(rawRow);
                error.setSeverity(ScheduleCsvImportResponse.ImportError.ErrorSeverity.ERROR);
                response.getErrors().add(error);
            }
            return null; // Skip this row
        }
        
        return row;
    }
    
    /**
     * Get value from map or return null
     */
    private String getValueOrNull(Map<String, String> map, String key) {
        String value = map.get(key);
        if (value != null && (value.isEmpty() || value.equalsIgnoreCase("null"))) {
            return null;
        }
        return value;
    }
    
    /**
     * Parse date with multiple format support
     */
    private LocalDate parseDate(String dateStr) {
        // Try different formats
        String[] formats = {"yyyy-MM-dd", "dd/MM/yyyy", "MM/dd/yyyy", "yyyy/MM/dd"};
        
        for (String format : formats) {
            try {
                return LocalDate.parse(dateStr, DateTimeFormatter.ofPattern(format));
            } catch (DateTimeParseException ignored) {
            }
        }
        
        // Try ISO format as last resort
        return LocalDate.parse(dateStr);
    }
    
    /**
     * Parse time with multiple format support
     */
    private LocalTime parseTime(String timeStr) {
        // Try different formats
        String[] formats = {"HH:mm:ss", "HH:mm", "H:mm:ss", "H:mm"};
        
        for (String format : formats) {
            try {
                return LocalTime.parse(timeStr, DateTimeFormatter.ofPattern(format));
            } catch (DateTimeParseException ignored) {
            }
        }
        
        // Try ISO format as last resort
        return LocalTime.parse(timeStr);
    }
    
    /**
     * Add a warning to the response
     */
    private void addWarning(ScheduleCsvImportResponse response, int rowNumber, String scheduleName,
                           String field, String message, String action) {
        ScheduleCsvImportResponse.ImportWarning warning = new ScheduleCsvImportResponse.ImportWarning();
        warning.setRowNumber(rowNumber);
        warning.setScheduleName(scheduleName);
        warning.setField(field);
        warning.setWarningMessage(message);
        warning.setAction(action);
        response.getWarnings().add(warning);
    }
    
    /**
     * Group rows by schedule composite key
     */
    private Map<String, List<CsvScheduleRow>> groupRowsBySchedule(List<CsvScheduleRow> rows) {
        Map<String, List<CsvScheduleRow>> grouped = new LinkedHashMap<>();
        
        for (CsvScheduleRow row : rows) {
            String key = row.getCompositeKey();
            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(row);
        }
        
        return grouped;
    }
    
    /**
     * Process a group of rows belonging to the same schedule
     */
    private ProcessScheduleResult processScheduleGroup(List<CsvScheduleRow> rows, ScheduleCsvImportRequest options,
                                                       String userId, ScheduleCsvImportResponse response) {
        ProcessScheduleResult result = new ProcessScheduleResult();
        CsvScheduleRow firstRow = rows.get(0);
        
        // Validate route exists
        if (options.getValidateRouteExists()) {
            Optional<Route> routeOpt = routeRepository.findById(firstRow.getRouteId());
            if (routeOpt.isEmpty()) {
                ScheduleCsvImportResponse.ImportError error = new ScheduleCsvImportResponse.ImportError();
                error.setRowNumber(firstRow.getRowNumber());
                error.setScheduleName(firstRow.getScheduleName());
                error.setField("route_id");
                error.setValue(firstRow.getRouteId().toString());
                error.setErrorMessage("Route not found with ID: " + firstRow.getRouteId());
                error.setSuggestion("Ensure the route_id exists in the system before importing schedules");
                error.setSeverity(ScheduleCsvImportResponse.ImportError.ErrorSeverity.ERROR);
                response.getErrors().add(error);
                
                result.setSuccess(false);
                return result;
            }
            result.setRouteName(routeOpt.get().getName());
        }
        
        // Check for existing schedule
        Schedule existingSchedule = scheduleRepository.findByNameAndRoute_Id(firstRow.getScheduleName(), firstRow.getRouteId());
        
        if (existingSchedule != null) {
            // Handle duplicate based on strategy
            switch (options.getScheduleDuplicateStrategy()) {
                case SKIP:
                    log.info("Skipping existing schedule: {}", firstRow.getScheduleName());
                    addWarning(response, firstRow.getRowNumber(), firstRow.getScheduleName(), "schedule",
                              "Schedule already exists, skipped", "SKIPPED");
                    result.setSkipped(true);
                    result.setAction("SKIPPED");
                    return result;
                    
                case UPDATE:
                    log.info("Updating existing schedule: {}", firstRow.getScheduleName());
                    return updateExistingSchedule(existingSchedule, rows, options, userId, response, result);
                    
                case CREATE_WITH_SUFFIX:
                    log.info("Creating schedule with suffix: {}", firstRow.getScheduleName());
                    firstRow.setScheduleName(generateUniqueName(firstRow.getScheduleName(), firstRow.getRouteId()));
                    addWarning(response, firstRow.getRowNumber(), firstRow.getScheduleName(), "schedule_name",
                              "Schedule renamed to avoid duplicate", "RENAMED");
                    break;
            }
        }
        
        // Create new schedule
        return createNewSchedule(rows, options, userId, response, result);
    }
    
    /**
     * Generate unique name by adding suffix
     */
    private String generateUniqueName(String baseName, UUID routeId) {
        String newName = baseName;
        int suffix = 1;
        
        while (scheduleRepository.existsByNameAndRoute_Id(newName, routeId)) {
            newName = baseName + " (" + suffix + ")";
            suffix++;
        }
        
        return newName;
    }
    
    /**
     * Create a new schedule from CSV rows
     */
    private ProcessScheduleResult createNewSchedule(List<CsvScheduleRow> rows, ScheduleCsvImportRequest options,
                                                    String userId, ScheduleCsvImportResponse response,
                                                    ProcessScheduleResult result) {
        CsvScheduleRow firstRow = rows.get(0);
        
        Route route = routeRepository.findById(firstRow.getRouteId())
                .orElseThrow(() -> new ResourceNotFoundException("Route not found: " + firstRow.getRouteId()));
        
        result.setRouteName(route.getName());
        
        // Create schedule entity
        Schedule schedule = new Schedule();
        schedule.setName(firstRow.getScheduleName());
        schedule.setRoute(route);
        schedule.setScheduleType(ScheduleTypeEnum.valueOf(firstRow.getScheduleType()));
        schedule.setEffectiveStartDate(firstRow.getEffectiveStartDate());
        schedule.setEffectiveEndDate(firstRow.getEffectiveEndDate());
        schedule.setStatus(ScheduleStatusEnum.valueOf(firstRow.getStatus()));
        schedule.setDescription(firstRow.getDescription());
        schedule.setCreatedBy(userId);
        schedule.setUpdatedBy(userId);
        
        // Create schedule stops
        List<ScheduleStop> scheduleStops = new ArrayList<>();
        int stopsCreated = 0;
        int stopsFailed = 0;
        
        for (CsvScheduleRow row : rows) {
            if (row.getRouteStopId() == null) {
                continue; // Skip rows without route_stop_id
            }
            
            try {
                ScheduleStop stop = createScheduleStopFromRow(schedule, row, options, response);
                if (stop != null) {
                    scheduleStops.add(stop);
                    stopsCreated++;
                } else {
                    stopsFailed++;
                }
            } catch (Exception e) {
                log.warn("Failed to create stop for row {}: {}", row.getRowNumber(), e.getMessage());
                
                ScheduleCsvImportResponse.ImportError error = new ScheduleCsvImportResponse.ImportError();
                error.setRowNumber(row.getRowNumber());
                error.setScheduleName(row.getScheduleName());
                error.setField("route_stop_id");
                error.setValue(row.getRouteStopId().toString());
                error.setErrorMessage("Failed to create stop: " + e.getMessage());
                error.setSeverity(ScheduleCsvImportResponse.ImportError.ErrorSeverity.ERROR);
                response.getErrors().add(error);
                
                stopsFailed++;
                
                if (!options.getAllowPartialStops()) {
                    result.setSuccess(false);
                    result.setStopsFailed(stopsFailed);
                    return result;
                }
            }
        }
        
        // Sort stops by order
        scheduleStops.sort(Comparator.comparingInt(ScheduleStop::getStopOrder));
        schedule.setScheduleStops(scheduleStops);
        
        // Save schedule
        Schedule savedSchedule = scheduleRepository.save(schedule);
        
        result.setSuccess(true);
        result.setScheduleId(savedSchedule.getId());
        result.setAction("CREATED");
        result.setStopsCreated(stopsCreated);
        result.setStopsFailed(stopsFailed);
        
        // Generate trips if requested
        if (options.getGenerateTrips()) {
            try {
                tripService.generateTripsForSchedule(
                    savedSchedule.getId(),
                    savedSchedule.getEffectiveStartDate(),
                    savedSchedule.getEffectiveEndDate(),
                    userId
                );
            } catch (Exception e) {
                log.warn("Failed to generate trips for schedule {}: {}", savedSchedule.getId(), e.getMessage());
                addWarning(response, firstRow.getRowNumber(), firstRow.getScheduleName(), "generate_trips",
                          "Failed to generate trips: " + e.getMessage(), "TRIP_GENERATION_FAILED");
            }
        }
        
        return result;
    }
    
    /**
     * Update an existing schedule from CSV rows
     */
    private ProcessScheduleResult updateExistingSchedule(Schedule existingSchedule, List<CsvScheduleRow> rows,
                                                         ScheduleCsvImportRequest options, String userId,
                                                         ScheduleCsvImportResponse response,
                                                         ProcessScheduleResult result) {
        CsvScheduleRow firstRow = rows.get(0);
        
        result.setRouteName(existingSchedule.getRoute().getName());
        
        // Update schedule fields
        existingSchedule.setScheduleType(ScheduleTypeEnum.valueOf(firstRow.getScheduleType()));
        existingSchedule.setEffectiveStartDate(firstRow.getEffectiveStartDate());
        existingSchedule.setEffectiveEndDate(firstRow.getEffectiveEndDate());
        existingSchedule.setStatus(ScheduleStatusEnum.valueOf(firstRow.getStatus()));
        existingSchedule.setDescription(firstRow.getDescription());
        existingSchedule.setUpdatedBy(userId);
        
        // Clear existing stops and create new ones
        if (existingSchedule.getScheduleStops() != null) {
            existingSchedule.getScheduleStops().clear();
        } else {
            existingSchedule.setScheduleStops(new ArrayList<>());
        }
        
        int stopsCreated = 0;
        int stopsFailed = 0;
        
        for (CsvScheduleRow row : rows) {
            if (row.getRouteStopId() == null) {
                continue;
            }
            
            try {
                ScheduleStop stop = createScheduleStopFromRow(existingSchedule, row, options, response);
                if (stop != null) {
                    existingSchedule.getScheduleStops().add(stop);
                    stopsCreated++;
                } else {
                    stopsFailed++;
                }
            } catch (Exception e) {
                log.warn("Failed to create stop for row {}: {}", row.getRowNumber(), e.getMessage());
                
                ScheduleCsvImportResponse.ImportError error = new ScheduleCsvImportResponse.ImportError();
                error.setRowNumber(row.getRowNumber());
                error.setScheduleName(row.getScheduleName());
                error.setField("route_stop_id");
                error.setValue(row.getRouteStopId().toString());
                error.setErrorMessage("Failed to create stop: " + e.getMessage());
                error.setSeverity(ScheduleCsvImportResponse.ImportError.ErrorSeverity.ERROR);
                response.getErrors().add(error);
                
                stopsFailed++;
                
                if (!options.getAllowPartialStops()) {
                    result.setSuccess(false);
                    result.setStopsFailed(stopsFailed);
                    return result;
                }
            }
        }
        
        // Sort stops by order
        existingSchedule.getScheduleStops().sort(Comparator.comparingInt(ScheduleStop::getStopOrder));
        
        // Save updated schedule
        Schedule savedSchedule = scheduleRepository.save(existingSchedule);
        
        result.setSuccess(true);
        result.setScheduleId(savedSchedule.getId());
        result.setAction("UPDATED");
        result.setStopsCreated(stopsCreated);
        result.setStopsFailed(stopsFailed);
        
        return result;
    }
    
    /**
     * Create a ScheduleStop from a CSV row
     */
    private ScheduleStop createScheduleStopFromRow(Schedule schedule, CsvScheduleRow row,
                                                   ScheduleCsvImportRequest options,
                                                   ScheduleCsvImportResponse response) {
        // Validate route_stop exists
        if (options.getValidateRouteStopExists()) {
            RouteStop routeStop = routeStopRepository.findById(row.getRouteStopId())
                    .orElseThrow(() -> new ResourceNotFoundException("RouteStop not found: " + row.getRouteStopId()));
            
            // Verify route_stop belongs to the schedule's route
            if (!routeStop.getRoute().getId().equals(schedule.getRoute().getId())) {
                throw new IllegalArgumentException("RouteStop " + row.getRouteStopId() + 
                                                  " does not belong to route " + schedule.getRoute().getId());
            }
            
            ScheduleStop scheduleStop = new ScheduleStop();
            scheduleStop.setSchedule(schedule);
            scheduleStop.setRouteStop(routeStop);
            scheduleStop.setStopOrder(row.getStopOrder() != null ? row.getStopOrder() : routeStop.getStopOrder());
            scheduleStop.setArrivalTime(row.getArrivalTime());
            scheduleStop.setDepartureTime(row.getDepartureTime());
            
            return scheduleStop;
        } else {
            // Without validation, try to find route_stop
            Optional<RouteStop> routeStopOpt = routeStopRepository.findById(row.getRouteStopId());
            
            if (routeStopOpt.isEmpty()) {
                addWarning(response, row.getRowNumber(), row.getScheduleName(), "route_stop_id",
                          "RouteStop not found, skipping stop", "STOP_SKIPPED");
                return null;
            }
            
            RouteStop routeStop = routeStopOpt.get();
            
            ScheduleStop scheduleStop = new ScheduleStop();
            scheduleStop.setSchedule(schedule);
            scheduleStop.setRouteStop(routeStop);
            scheduleStop.setStopOrder(row.getStopOrder() != null ? row.getStopOrder() : routeStop.getStopOrder());
            scheduleStop.setArrivalTime(row.getArrivalTime());
            scheduleStop.setDepartureTime(row.getDepartureTime());
            
            return scheduleStop;
        }
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