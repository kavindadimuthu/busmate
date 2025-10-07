package com.busmate.routeschedule.controller;

import com.busmate.routeschedule.dto.request.BusPassengerServicePermitAssignmentRequest;
import com.busmate.routeschedule.dto.response.BusPassengerServicePermitAssignmentResponse;
import com.busmate.routeschedule.service.BusPassengerServicePermitAssignmentService;
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
@RequestMapping("/api/bus-permit-assignments")
@RequiredArgsConstructor
@Tag(name = "07. Bus-Permit Assignment", description = "APIs for managing bus - passenger service permit assignments")
public class BusPassengerServicePermitAssignmentController {
    private final BusPassengerServicePermitAssignmentService assignmentService;

    @PostMapping
    public ResponseEntity<BusPassengerServicePermitAssignmentResponse> createAssignment(@Valid @RequestBody BusPassengerServicePermitAssignmentRequest request, Authentication authentication) {
        String userId = authentication.getName();
        BusPassengerServicePermitAssignmentResponse response = assignmentService.createAssignment(request, userId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BusPassengerServicePermitAssignmentResponse> getAssignmentById(@PathVariable UUID id) {
        BusPassengerServicePermitAssignmentResponse response = assignmentService.getAssignmentById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<BusPassengerServicePermitAssignmentResponse>> getAllAssignments() {
        List<BusPassengerServicePermitAssignmentResponse> responses = assignmentService.getAllAssignments();
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BusPassengerServicePermitAssignmentResponse> updateAssignment(@PathVariable UUID id, @Valid @RequestBody BusPassengerServicePermitAssignmentRequest request, Authentication authentication) {
        String userId = authentication.getName();
        BusPassengerServicePermitAssignmentResponse response = assignmentService.updateAssignment(id, request, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssignment(@PathVariable UUID id) {
        assignmentService.deleteAssignment(id);
        return ResponseEntity.noContent().build();
    }
}
