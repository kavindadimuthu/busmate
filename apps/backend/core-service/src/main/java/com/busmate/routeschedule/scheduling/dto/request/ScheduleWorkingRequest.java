package com.busmate.routeschedule.scheduling.dto.request;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.busmate.routeschedule.fleet.enums.ServiceClassEnum;
import com.busmate.routeschedule.shared.provenance.SourceTier;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

/**
 * Who normally works a departure (ADR-024). Everything is optional except that the request must say
 * *something*: an operator (linked, or as seen), a service class, or at least one vehicle.
 */
@Schema(description = "Who normally works a departure between two dates. A claim about a pattern, not a particular day.")
public record ScheduleWorkingRequest(
        @Schema(description = "First day it applies. Optional: takes today's date, as a schedule does") LocalDate effectiveStartDate,
        @Schema(description = "Last day it applies; leave out while it is still current") LocalDate effectiveEndDate,
        @Schema(description = "A real operator, if staff already know which") UUID operatorId,
        @Size(max = 255) @Schema(description = "The operator as seen, e.g. \"Weerasinghe Midnight Express\"") String operatorNameObserved,
        ServiceClassEnum serviceClass,
        @Valid @Schema(description = "One row means this vehicle; several mean the operator alternates among them, order unknown")
        List<VehicleClaim> vehicles,
        @Schema(description = "Source recorded; SRC_1 is MOT only. Defaults to field observation") SourceTier sourceTier,
        @Size(max = 255) String attributionLabel,
        @Schema(description = "The date the information dates from, if before it was typed in. Never in the future")
        LocalDate observedOn) {

    @Schema(description = "A vehicle by its plate as seen, and/or a registered bus")
    public record VehicleClaim(
            @Schema(description = "A registered bus, if staff already know which") UUID busId,
            @Size(max = 32) @Schema(description = "The plate as seen, e.g. ND-1712") String plateObserved) {
    }
}
