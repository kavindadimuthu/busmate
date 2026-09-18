package com.busmate.routeschedule.licensing.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** A status change that has to say why (suspend, withdraw, cancel). */
@Data
public class StatusReasonRequest {
    @NotBlank(message = "A reason is required")
    @Size(max = 500, message = "Reason must be at most 500 characters")
    private String reason;
}
