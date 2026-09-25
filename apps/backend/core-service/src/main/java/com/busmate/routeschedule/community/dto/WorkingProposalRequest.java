package com.busmate.routeschedule.community.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.busmate.routeschedule.community.entity.ObservationMethod;
import com.busmate.routeschedule.fleet.enums.ServiceClassEnum;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

/**
 * A contributor's claim about who normally works a departure (ADR-026). Names and plates as seen: a contributor
 * cannot pick a registered operator or bus, and staff link them afterwards.
 */
@Schema(description = "Who usually works a departure, as the contributor saw it")
public record WorkingProposalRequest(
        @NotNull UUID scheduleId,
        @Size(max = 255) @Schema(description = "The operator as seen on the bus, e.g. \"Weerasinghe Midnight Express\"") String operatorNameObserved,
        @Size(max = 10) @Schema(description = "Plates as seen. One means this vehicle; several mean it alternates among them")
        List<@Size(min = 1, max = 32) String> platesObserved,
        ServiceClassEnum serviceClass,
        @NotNull @PastOrPresent @Schema(description = "The day they saw it") LocalDate observedOn,
        @NotNull ObservationMethod observationMethod,
        @Size(max = 1000) String note) {
}
