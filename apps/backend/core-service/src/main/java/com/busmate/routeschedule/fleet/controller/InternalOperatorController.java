package com.busmate.routeschedule.fleet.controller;

import com.busmate.routeschedule.fleet.dto.internal.InternalOperatorRequest;
import com.busmate.routeschedule.fleet.dto.internal.InternalOperatorStatusRequest;
import com.busmate.routeschedule.fleet.dto.response.OperatorResponse;
import com.busmate.routeschedule.fleet.service.InternalOperatorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Receiving side of the unified operator lifecycle sync. Gated by InternalApiKeyFilter,
 * not JWT — only called directly, service-to-service, by user-service's OperatorSyncClient
 * (never routed through the API gateway, which 404s /internal/** outright).
 */
@RestController
@RequestMapping("/internal/operators")
@RequiredArgsConstructor
public class InternalOperatorController {

    private final InternalOperatorService internalOperatorService;

    @PostMapping
    public ResponseEntity<OperatorResponse> createOrGetOperator(@Valid @RequestBody InternalOperatorRequest request) {
        var result = internalOperatorService.createOrGetOperator(request);
        return ResponseEntity.status(result.created() ? HttpStatus.CREATED : HttpStatus.OK).body(result.operator());
    }

    @PatchMapping("/by-user/{userId}")
    public ResponseEntity<OperatorResponse> updateOperator(
            @PathVariable UUID userId,
            @Valid @RequestBody InternalOperatorRequest request) {
        return ResponseEntity.ok(internalOperatorService.updateOperatorByUserId(userId, request));
    }

    @PatchMapping("/by-user/{userId}/status")
    public ResponseEntity<OperatorResponse> updateOperatorStatus(
            @PathVariable UUID userId,
            @Valid @RequestBody InternalOperatorStatusRequest request) {
        return ResponseEntity.ok(internalOperatorService.updateStatusByUserId(userId, request));
    }
}
