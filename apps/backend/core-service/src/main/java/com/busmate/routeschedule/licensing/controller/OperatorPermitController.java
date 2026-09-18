package com.busmate.routeschedule.licensing.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.busmate.routeschedule.fleet.security.OperatorAccess;
import com.busmate.routeschedule.licensing.dto.request.OperatorPermitRequest;
import com.busmate.routeschedule.licensing.dto.request.PermitBusLinkRequest;
import com.busmate.routeschedule.licensing.dto.request.StatusReasonRequest;
import com.busmate.routeschedule.licensing.dto.response.BusPassengerServicePermitAssignmentResponse;
import com.busmate.routeschedule.licensing.dto.response.PassengerServicePermitResponse;
import com.busmate.routeschedule.licensing.entity.BusPassengerServicePermitAssignment;
import com.busmate.routeschedule.licensing.entity.PassengerServicePermit;
import com.busmate.routeschedule.licensing.service.PassengerServicePermitService;
import com.busmate.routeschedule.licensing.service.PermitBusLinks;
import com.busmate.routeschedule.shared.exception.ResourceNotFoundException;
import com.busmate.routeschedule.shared.security.Caller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * An operator keeping their own permit records (INC-017). Permits are applied for and approved
 * outside BusMate; these endpoints only record permits the operator already holds. A recorded
 * permit is in force immediately — MOT can suspend it.
 */
@RestController
@PreAuthorize("hasAnyRole('ADMIN', 'MOT', 'OPERATOR')")
@RequestMapping("/api/v1/bus-operator/{operatorId}/permits")
@RequiredArgsConstructor
@Tag(name = "Bus Operator Operations")
public class OperatorPermitController {

    private final PassengerServicePermitService permitService;
    private final PermitBusLinks permitBusLinks;
    private final OperatorAccess operatorAccess;

    @PostMapping
    @Operation(summary = "Record one of the operator's own passenger service permits", operationId = "createOperatorPermit")
    public ResponseEntity<PassengerServicePermitResponse> createPermit(
            @PathVariable UUID operatorId, @Valid @RequestBody OperatorPermitRequest request) {
        Caller caller = operatorAccess.requireAccess(operatorId);
        return new ResponseEntity<>(permitService.createPermitForOperator(operatorId, request, caller.auditId()), HttpStatus.CREATED);
    }

    @PutMapping("/{permitId}")
    @Operation(summary = "Update one of the operator's own permits", operationId = "updateOperatorPermit")
    public ResponseEntity<PassengerServicePermitResponse> updatePermit(
            @PathVariable UUID operatorId, @PathVariable UUID permitId, @Valid @RequestBody OperatorPermitRequest request) {
        Caller caller = operatorAccess.requireAccess(operatorId);
        return ResponseEntity.ok(permitService.updatePermitForOperator(operatorId, permitId, request, caller.auditId()));
    }

    @PostMapping("/{permitId}/withdraw")
    @Operation(summary = "Withdraw a permit the operator no longer holds; ends its bus links",
            operationId = "withdrawOperatorPermit")
    public ResponseEntity<PassengerServicePermitResponse> withdrawPermit(
            @PathVariable UUID operatorId, @PathVariable UUID permitId, @Valid @RequestBody StatusReasonRequest request) {
        Caller caller = operatorAccess.requireAccess(operatorId);
        return ResponseEntity.ok(permitService.withdrawPermit(operatorId, permitId, request.getReason(), caller.auditId()));
    }

    @GetMapping("/{permitId}/buses")
    @Operation(summary = "Buses linked to one of the operator's permits (current and past)",
            operationId = "getOperatorPermitBuses")
    public ResponseEntity<List<BusPassengerServicePermitAssignmentResponse>> getPermitBuses(
            @PathVariable UUID operatorId, @PathVariable UUID permitId) {
        operatorAccess.requireAccess(operatorId);
        permitService.requireOwnedPermit(operatorId, permitId);
        return ResponseEntity.ok(permitBusLinks.forPermit(permitId));
    }

    @PostMapping("/{permitId}/buses")
    @Operation(summary = "Authorise one of the operator's buses to run under this permit",
            description = "In force immediately, up to the permit's maximum buses. The bus's service class must match the permit type.",
            operationId = "linkBusToOperatorPermit")
    public ResponseEntity<BusPassengerServicePermitAssignmentResponse> linkBus(
            @PathVariable UUID operatorId, @PathVariable UUID permitId, @Valid @RequestBody PermitBusLinkRequest request) {
        Caller caller = operatorAccess.requireAccess(operatorId);
        PassengerServicePermit permit = permitService.requireOwnedPermit(operatorId, permitId);
        return new ResponseEntity<>(permitBusLinks.link(permit, request.getBusId(), request.getStartDate(),
                request.getEndDate(), caller.auditId()), HttpStatus.CREATED);
    }

    @PostMapping("/{permitId}/buses/{linkId}/end")
    @Operation(summary = "End a bus's link to this permit", operationId = "endOperatorPermitBusLink")
    public ResponseEntity<Void> endLink(
            @PathVariable UUID operatorId, @PathVariable UUID permitId, @PathVariable UUID linkId) {
        Caller caller = operatorAccess.requireAccess(operatorId);
        permitService.requireOwnedPermit(operatorId, permitId);
        BusPassengerServicePermitAssignment link = permitBusLinks.require(linkId);
        if (!link.getPassengerServicePermit().getId().equals(permitId)) {
            throw new ResourceNotFoundException("Permit link not found with id: " + linkId);
        }
        permitBusLinks.end(link, caller.auditId());
        return ResponseEntity.noContent().build();
    }
}
