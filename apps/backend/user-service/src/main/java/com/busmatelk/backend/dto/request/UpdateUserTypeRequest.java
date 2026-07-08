package com.busmatelk.backend.dto.request;

import lombok.Data;

@Data
public class UpdateUserTypeRequest {
    private String displayName;
    private String description;
    private Boolean isActive;
}
