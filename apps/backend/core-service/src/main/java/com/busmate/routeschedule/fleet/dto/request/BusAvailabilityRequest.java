package com.busmate.routeschedule.fleet.dto.request;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Mark a bus available, or out of use for a period (INC-018). */
@Data
public class BusAvailabilityRequest {
    /** AVAILABLE, UNDER_MAINTENANCE or OFF_ROAD. */
    @NotBlank(message = "Availability is mandatory")
    private String availability;

    /** First unavailable day; defaults to today. Ignored when AVAILABLE. */
    private LocalDate from;

    /** Last unavailable day; null = until further notice. Ignored when AVAILABLE. */
    private LocalDate until;

    @Size(max = 500)
    private String note;
}
