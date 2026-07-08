package com.busmatelk.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class UserTypeResponse {
    private UUID id;
    private String name;
    private String displayName;
    private String description;
    private Boolean isSystem;
    private Boolean isActive;
    private Long permissionCount;
}
