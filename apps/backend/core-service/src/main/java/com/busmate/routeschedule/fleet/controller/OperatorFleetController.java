package com.busmate.routeschedule.fleet.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.busmate.routeschedule.fleet.dto.request.OperatorBusRequest;
import com.busmate.routeschedule.fleet.dto.response.BusResponse;
import com.busmate.routeschedule.fleet.security.OperatorAccess;
import com.busmate.routeschedule.fleet.service.BusProfileService;
import com.busmate.routeschedule.shared.security.Caller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** An operator registering and editing their own buses (INC-018). */
@RestController
@PreAuthorize("hasAnyRole('ADMIN', 'MOT', 'OPERATOR')")
@RequestMapping("/api/v1/bus-operator/{operatorId}/buses")
@RequiredArgsConstructor
@Tag(name = "Bus Operator Operations")
public class OperatorFleetController {

    private final BusProfileService busProfileService;
    private final OperatorAccess operatorAccess;

    @PostMapping
    @Operation(summary = "Register a bus in the operator's own fleet", operationId = "createOperatorBus")
    public ResponseEntity<BusResponse> createBus(@PathVariable UUID operatorId, @Valid @RequestBody OperatorBusRequest request) {
        Caller caller = operatorAccess.requireAccess(operatorId);
        return new ResponseEntity<>(busProfileService.createForOperator(operatorId, request, caller), HttpStatus.CREATED);
    }

    @PutMapping("/{busId}")
    @Operation(summary = "Update one of the operator's own buses", operationId = "updateOperatorBus")
    public ResponseEntity<BusResponse> updateBus(@PathVariable UUID operatorId, @PathVariable UUID busId,
                                                 @Valid @RequestBody OperatorBusRequest request) {
        Caller caller = operatorAccess.requireAccess(operatorId);
        return ResponseEntity.ok(busProfileService.updateForOperator(operatorId, busId, request, caller));
    }
}
