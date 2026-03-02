package com.busmate.routeschedule.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class BusResponse {
    private UUID id;
    private UUID operatorId;
    private String operatorName;
    private String ntcRegistrationNumber;
    private String plateNumber;
    private Integer capacity;
    private String model;
    private JsonNode facilities;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
