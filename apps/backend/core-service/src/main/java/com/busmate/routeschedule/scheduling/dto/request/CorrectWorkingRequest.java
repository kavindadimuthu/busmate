package com.busmate.routeschedule.scheduling.dto.request;

import java.time.LocalDate;
import java.util.List;

import com.busmate.routeschedule.fleet.enums.ServiceClassEnum;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

/**
 * A correction to a working's observed fields (INC-058, ADR-027). Every field is optional and any left out
 * is kept as it is — the same rule a stop's correction follows (INC-043). Never a registered operator or
 * bus: that stays a staff act through {@code resolveOperator}/{@code resolveBus} (INC-057).
 */
@Schema(description = "What was observed about a working, corrected. Anything left out stays as it is")
public record CorrectWorkingRequest(
        @Size(max = 255) String operatorNameObserved,
        @Schema(description = "Replaces the whole list when given; leave out to keep the vehicles as they are")
        List<@Size(min = 1, max = 32) String> platesObserved,
        ServiceClassEnum serviceClass,
        @Schema(description = "The last day it applied, if it has stopped") LocalDate effectiveEndDate) {
}
