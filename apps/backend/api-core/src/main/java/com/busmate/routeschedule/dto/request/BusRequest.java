package com.busmate.routeschedule.dto.request;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.util.UUID;

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

    private String status = "active";
}
