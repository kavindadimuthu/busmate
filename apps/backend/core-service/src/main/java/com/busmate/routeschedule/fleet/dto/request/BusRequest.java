package com.busmate.routeschedule.fleet.dto.request;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.util.UUID;
import com.busmate.routeschedule.fleet.entity.Operator;

@Data
public class BusRequest {
    @NotNull(message = "Operator ID is mandatory")
    private UUID operatorId;

    @NotBlank(message = "NTC registration number is mandatory")
    private String ntcRegistrationNumber;

    @NotBlank(message = "Plate number is mandatory")
    private String plateNumber;

    @Positive(message = "Capacity must be positive")
    private Integer capacity;

    private String model;

    private JsonNode facilities;

    // Optional structured seat layout. If omitted, the bus falls back to a default 2+2
    // layout generated from `capacity` when read back.
    private JsonNode seatLayout;

    private String status = "active";
}
