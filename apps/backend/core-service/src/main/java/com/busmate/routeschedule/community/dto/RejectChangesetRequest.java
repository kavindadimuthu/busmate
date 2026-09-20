package com.busmate.routeschedule.community.dto;

import com.busmate.routeschedule.community.entity.RejectionReason;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RejectChangesetRequest {
    @NotNull(message = "Choose a reason")
    private RejectionReason reason;

    @Size(max = 400)
    private String note;
}
