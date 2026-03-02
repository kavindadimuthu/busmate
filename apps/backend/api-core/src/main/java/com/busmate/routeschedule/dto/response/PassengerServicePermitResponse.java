package com.busmate.routeschedule.dto.response;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class PassengerServicePermitResponse {
    private UUID id;
    private UUID operatorId;
    private String operatorName;
    private UUID routeGroupId;
    private String routeGroupName;
    private String permitNumber;
    private LocalDate issueDate;
    private LocalDate expiryDate;
    private Integer maximumBusAssigned;
    private String status;
    private String permitType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
