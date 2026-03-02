package com.busmate.routeschedule.dto.response;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class BusPassengerServicePermitAssignmentResponse {
    private UUID id;
    private UUID busId;
    private String busPlateNumber;
    private UUID passengerServicePermitId;
    private String permitNumber;
    private LocalDate startDate;
    private LocalDate endDate;
    private String requestStatus;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
