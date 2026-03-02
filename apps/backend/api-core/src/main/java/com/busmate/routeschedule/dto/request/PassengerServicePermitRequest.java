package com.busmate.routeschedule.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class PassengerServicePermitRequest {
    @NotNull(message = "Operator ID is mandatory")
    private UUID operatorId;

    @NotNull(message = "Route group ID is mandatory")
    private UUID routeGroupId;

    @NotBlank(message = "Permit number is mandatory")
    private String permitNumber;

    @NotNull(message = "Issue date is mandatory")
    private LocalDate issueDate;

    private LocalDate expiryDate;

    @Positive(message = "Maximum bus assigned must be positive")
    private Integer maximumBusAssigned;

    private String status = "pending";

    private String permitType = "NORMAL";
}
