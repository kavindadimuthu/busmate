package com.busmate.routeschedule.scheduling.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.busmate.routeschedule.scheduling.dto.request.ResolveBusRequest;
import com.busmate.routeschedule.scheduling.dto.request.CorrectWorkingRequest;
import com.busmate.routeschedule.scheduling.dto.request.ResolveOperatorRequest;
import com.busmate.routeschedule.scheduling.dto.request.ScheduleWorkingEndRequest;
import com.busmate.routeschedule.scheduling.dto.request.ScheduleWorkingRequest;
import com.busmate.routeschedule.scheduling.dto.response.ScheduleWorkingResponse;
import com.busmate.routeschedule.scheduling.service.ScheduleWorkingService;
import com.busmate.routeschedule.shared.security.CallerContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Who normally works a departure (ADR-024, INC-045). Staff only; passengers get it through passenger endpoints. */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
@Tag(name = "12. Schedule Workings", description = "Who normally works a departure — a claim about a pattern, never about a day")
public class ScheduleWorkingController {

    private final ScheduleWorkingService service;
    private final CallerContext callerContext;

    @GetMapping("/schedules/{scheduleId}/workings")
    @Operation(summary = "A schedule's workings, oldest first", operationId = "listScheduleWorkings")
    public List<ScheduleWorkingResponse> list(@PathVariable UUID scheduleId) {
        return service.list(scheduleId);
    }

    @PostMapping("/schedules/{scheduleId}/workings")
    @Operation(summary = "Record who normally works a departure; a plate or operator name as seen is enough",
            operationId = "createScheduleWorking")
    public ResponseEntity<ScheduleWorkingResponse> create(@PathVariable UUID scheduleId,
                                                          @Valid @RequestBody ScheduleWorkingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(scheduleId, request, callerContext.require().auditId()));
    }

    @PutMapping("/schedule-workings/{workingId}")
    @Operation(summary = "Correct what was observed about a working; anything left out stays as it is",
            operationId = "correctScheduleWorking")
    public ScheduleWorkingResponse correct(@PathVariable UUID workingId, @Valid @RequestBody CorrectWorkingRequest request) {
        return service.correct(workingId, request, callerContext.require().auditId());
    }

    @PutMapping("/schedule-workings/{workingId}/end")
    @Operation(summary = "Set the last day a working applied", operationId = "endScheduleWorking")
    public ScheduleWorkingResponse end(@PathVariable UUID workingId, @Valid @RequestBody ScheduleWorkingEndRequest request) {
        return service.end(workingId, request.effectiveEndDate(), callerContext.require().auditId());
    }

    @PutMapping("/schedule-workings/{workingId}/operator")
    @Operation(summary = "Link a working's operator, seen only as a name, to a registered operator",
            operationId = "resolveScheduleWorkingOperator")
    public ScheduleWorkingResponse resolveOperator(@PathVariable UUID workingId, @Valid @RequestBody ResolveOperatorRequest request) {
        return service.resolveOperator(workingId, request.operatorId(), callerContext.require().auditId());
    }

    @PutMapping("/schedule-working-vehicles/{vehicleId}/bus")
    @Operation(summary = "Link a plate seen on a working to a registered bus", operationId = "resolveScheduleWorkingBus")
    public ScheduleWorkingResponse resolveBus(@PathVariable UUID vehicleId, @Valid @RequestBody ResolveBusRequest request) {
        return service.resolveBus(vehicleId, request.busId(), callerContext.require().auditId());
    }

    @DeleteMapping("/schedule-workings/{workingId}")
    @Operation(summary = "Remove a working recorded by mistake", operationId = "deleteScheduleWorking")
    public ResponseEntity<Void> delete(@PathVariable UUID workingId) {
        service.delete(workingId);
        return ResponseEntity.noContent().build();
    }
}
