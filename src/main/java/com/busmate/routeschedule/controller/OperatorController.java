package com.busmate.routeschedule.controller;

import com.busmate.routeschedule.dto.request.OperatorRequest;
import com.busmate.routeschedule.dto.response.OperatorResponse;
import com.busmate.routeschedule.service.OperatorService;
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
@RequestMapping("/api/operators")
@RequiredArgsConstructor
@Tag(name = "6. Operator Management", description = "APIs for managing operators")
public class OperatorController {
    private final OperatorService operatorService;

    @PostMapping
    public ResponseEntity<OperatorResponse> createOperator(@Valid @RequestBody OperatorRequest request, Authentication authentication) {
        String userId = authentication.getName();
        OperatorResponse response = operatorService.createOperator(request, userId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OperatorResponse> getOperatorById(@PathVariable UUID id) {
        OperatorResponse response = operatorService.getOperatorById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<OperatorResponse>> getAllOperators() {
        List<OperatorResponse> responses = operatorService.getAllOperators();
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OperatorResponse> updateOperator(@PathVariable UUID id, @Valid @RequestBody OperatorRequest request, Authentication authentication) {
        String userId = authentication.getName();
        OperatorResponse response = operatorService.updateOperator(id, request, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOperator(@PathVariable UUID id) {
        operatorService.deleteOperator(id);
        return ResponseEntity.noContent().build();
    }
}
