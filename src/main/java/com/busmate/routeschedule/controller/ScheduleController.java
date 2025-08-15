package com.busmate.routeschedule.controller;

import com.busmate.routeschedule.dto.request.ScheduleRequest;
import com.busmate.routeschedule.dto.response.ScheduleResponse;
import com.busmate.routeschedule.service.ScheduleService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
@Tag(name = "03. Schedule Management", description = "APIs for managing bus schedules")
public class ScheduleController {
    private final ScheduleService scheduleService;

    @PostMapping
    public ResponseEntity<ScheduleResponse> createSchedule(@Valid @RequestBody ScheduleRequest request, Authentication authentication) {
        try {
            String userId = authentication.getName();
            ScheduleResponse response = scheduleService.createSchedule(request, userId);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("Error creating schedule: {}", e.getMessage(), e);
            throw e;
        }
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<ScheduleResponse>> createBulkSchedules(@Valid @RequestBody List<ScheduleRequest> requests, Authentication authentication) {
        String userId = authentication.getName();
        List<ScheduleResponse> responses = scheduleService.createBulkSchedules(requests, userId);
        return new ResponseEntity<>(responses, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScheduleResponse> getScheduleById(@PathVariable UUID id) {
        ScheduleResponse response = scheduleService.getScheduleById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<ScheduleResponse>> getAllSchedules() {
        List<ScheduleResponse> responses = scheduleService.getAllSchedules();
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ScheduleResponse> updateSchedule(@PathVariable UUID id, @Valid @RequestBody ScheduleRequest request, Authentication authentication) {
        String userId = authentication.getName();
        ScheduleResponse response = scheduleService.updateSchedule(id, request, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable UUID id) {
        scheduleService.deleteSchedule(id);
        return ResponseEntity.noContent().build();
    }
}