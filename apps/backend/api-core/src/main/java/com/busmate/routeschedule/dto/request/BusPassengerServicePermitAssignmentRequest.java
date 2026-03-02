package com.busmate.routeschedule.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class BusPassengerServicePermitAssignmentRequest {
    @NotNull(message = "Bus ID is mandatory")
    private UUID busId;

    @NotNull(message = "Passenger service permit ID is mandatory")
    private UUID passengerServicePermitId;

    @NotNull(message = "Start date is mandatory")
    private LocalDate startDate;

    private LocalDate endDate;

    private String requestStatus;

    private String status = "active";
}
