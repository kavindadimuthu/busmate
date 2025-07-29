package com.busmate.routeschedule.controller;

import com.busmate.routeschedule.dto.request.PassengerServicePermitScheduleAssignmentRequest;
import com.busmate.routeschedule.dto.response.PassengerServicePermitScheduleAssignmentResponse;
import com.busmate.routeschedule.service.PassengerServicePermitScheduleAssignmentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/permit-schedule-assignments")
@RequiredArgsConstructor
@Tag(name = "9. Permit-Schedule Assignment", description = "APIs for managing passenger service permit - schedule assignments")
public class PassengerServicePermitScheduleAssignmentController {
    private final PassengerServicePermitScheduleAssignmentService assignmentService;

    @PostMapping
    public ResponseEntity<PassengerServicePermitScheduleAssignmentResponse> createAssignment(@Valid @RequestBody PassengerServicePermitScheduleAssignmentRequest request, Authentication authentication) {
        String userId = authentication.getName();
        PassengerServicePermitScheduleAssignmentResponse response = assignmentService.createAssignment(request, userId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PassengerServicePermitScheduleAssignmentResponse> getAssignmentById(@PathVariable UUID id) {
        PassengerServicePermitScheduleAssignmentResponse response = assignmentService.getAssignmentById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<PassengerServicePermitScheduleAssignmentResponse>> getAllAssignments() {
        List<PassengerServicePermitScheduleAssignmentResponse> responses = assignmentService.getAllAssignments();
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PassengerServicePermitScheduleAssignmentResponse> updateAssignment(@PathVariable UUID id, @Valid @RequestBody PassengerServicePermitScheduleAssignmentRequest request, Authentication authentication) {
        String userId = authentication.getName();
        PassengerServicePermitScheduleAssignmentResponse response = assignmentService.updateAssignment(id, request, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssignment(@PathVariable UUID id) {
        assignmentService.deleteAssignment(id);
        return ResponseEntity.noContent().build();
    }
}
