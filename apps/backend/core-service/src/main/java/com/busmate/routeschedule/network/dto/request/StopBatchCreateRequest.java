package com.busmate.routeschedule.network.dto.request;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class StopBatchCreateRequest {
    @NotEmpty(message = "At least one stop is required")
    @Valid
    private List<StopRequest> stops;
}
