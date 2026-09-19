package com.busmate.routeschedule.community.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.ToString;

/** A staff decision. The reason is required to decline or suspend, and the applicant sees it. */
@Data
public class ContributorDecisionRequest {
    @ToString.Exclude
    @Size(max = 500)
    private String reason;
}
