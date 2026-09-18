package com.busmate.routeschedule.fleet.dto.request;

import java.time.LocalDate;

import jakarta.validation.constraints.Size;
import lombok.Data;

/** Edit a photo's or document's details; fields left null are unchanged. */
@Data
public class BusMediaUpdateRequest {
    @Size(max = 200)
    private String title;
    /** Documents only. */
    private String documentType;
    /** Documents only; set clearExpiryDate to remove it. */
    private LocalDate expiryDate;
    private Boolean clearExpiryDate;
    /** Photos only: make this the bus's cover photo. */
    private Boolean cover;
}
