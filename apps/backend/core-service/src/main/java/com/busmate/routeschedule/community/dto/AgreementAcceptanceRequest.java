package com.busmate.routeschedule.community.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AgreementAcceptanceRequest {
    @NotBlank
    private String agreementVersion;
}
