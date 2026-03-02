package com.busmate.routeschedule.permit.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;
import com.busmate.routeschedule.bus.entity.Bus;

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
