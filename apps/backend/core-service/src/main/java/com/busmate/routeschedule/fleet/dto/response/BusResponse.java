package com.busmate.routeschedule.fleet.dto.response;

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
    // Structured seat layout. Never null in responses — the service fills a default 2+2
    // layout derived from `capacity` when the bus has no explicit layout stored.
    private JsonNode seatLayout;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
