package com.busmate.routeschedule.licensing.dto.request;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

/**
 * A permit as an operator records it (INC-017). No operator id and no status: the operator is
 * whoever is calling, and a permit an operator records is in force from the moment it is saved.
 */
@Data
public class OperatorPermitRequest {
    @NotNull(message = "Route group is mandatory")
    private UUID routeGroupId;

    @NotBlank(message = "Permit number is mandatory")
    private String permitNumber;

    @NotNull(message = "Issue date is mandatory")
    private LocalDate issueDate;

    private LocalDate expiryDate;

    @NotNull(message = "Maximum buses is mandatory")
    @Positive(message = "Maximum buses must be positive")
    private Integer maximumBusAssigned;

    @NotBlank(message = "Permit type is mandatory")
    private String permitType;
}
