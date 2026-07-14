package com.busmate.routeschedule.fleet.dto.internal;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** Status-only transition, used for deactivate/reactivate propagation from user-service. */
@Data
public class InternalOperatorStatusRequest {

    @NotBlank(message = "Status is mandatory")
    private String status;
}
