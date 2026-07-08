package com.busmatelk.backend.dto.request;

import lombok.Data;

@Data
public class CreateUserTypeRequest {
    private String name;
    private String displayName;
    private String description;
}
