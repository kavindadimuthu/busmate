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
 * A contributor's correction to a working already on record, or a claim that it has stopped (INC-058,
 * ADR-027). Anything left out stays as it is; never a registered operator or bus.
 */
@Schema(description = "A correction to an existing working, as the contributor now sees it")
public record WorkingCorrectionRequest(
        @NotNull UUID targetWorkingId,
        @Size(max = 255) String operatorNameObserved,
        List<@Size(min = 1, max = 32) String> platesObserved,
        ServiceClassEnum serviceClass,
        @Schema(description = "The last day it applied, if it has stopped") LocalDate effectiveEndDate,
        @NotNull @PastOrPresent @Schema(description = "The day they saw it") LocalDate observedOn,
        @NotNull ObservationMethod observationMethod,
        @Size(max = 1000) String note) {
}
