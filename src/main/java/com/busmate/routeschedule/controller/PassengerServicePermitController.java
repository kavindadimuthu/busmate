package com.busmate.routeschedule.controller;

import com.busmate.routeschedule.dto.request.PassengerServicePermitRequest;
import com.busmate.routeschedule.dto.response.PassengerServicePermitResponse;
import com.busmate.routeschedule.service.PassengerServicePermitService;
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
@RequestMapping("/api/permits")
@RequiredArgsConstructor
@Tag(name = "7. Permit Management", description = "APIs for managing passenger service permits")
public class PassengerServicePermitController {
    private final PassengerServicePermitService permitService;

    @PostMapping
    public ResponseEntity<PassengerServicePermitResponse> createPermit(@Valid @RequestBody PassengerServicePermitRequest request, Authentication authentication) {
        String userId = authentication.getName();
        PassengerServicePermitResponse response = permitService.createPermit(request, userId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PassengerServicePermitResponse> getPermitById(@PathVariable UUID id) {
        PassengerServicePermitResponse response = permitService.getPermitById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<PassengerServicePermitResponse>> getAllPermits() {
        List<PassengerServicePermitResponse> responses = permitService.getAllPermits();
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PassengerServicePermitResponse> updatePermit(@PathVariable UUID id, @Valid @RequestBody PassengerServicePermitRequest request, Authentication authentication) {
        String userId = authentication.getName();
        PassengerServicePermitResponse response = permitService.updatePermit(id, request, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePermit(@PathVariable UUID id) {
        permitService.deletePermit(id);
        return ResponseEntity.noContent().build();
    }
}
