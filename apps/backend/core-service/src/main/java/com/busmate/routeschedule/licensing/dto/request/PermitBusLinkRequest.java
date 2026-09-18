package com.busmate.routeschedule.licensing.dto.request;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** Authorise one of the operator's buses to run under one of their permits (INC-017). */
@Data
public class PermitBusLinkRequest {
    @NotNull(message = "Bus is mandatory")
    private UUID busId;

    /** Defaults to today when omitted. */
    private LocalDate startDate;

    private LocalDate endDate;
}
