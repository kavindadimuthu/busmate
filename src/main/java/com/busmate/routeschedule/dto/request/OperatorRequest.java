package com.busmate.routeschedule.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.UUID;

@Data
public class OperatorRequest {
    private UUID id;

    @NotBlank(message = "Name is mandatory")
    private String name;

    private String operatorType = "PRIVATE";

    private String region;

    private String status = "active";
}
