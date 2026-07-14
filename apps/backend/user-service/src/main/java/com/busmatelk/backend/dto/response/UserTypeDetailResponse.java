package com.busmatelk.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
public class UserTypeDetailResponse {
    private UUID id;
    private String name;
    private String displayName;
    private String description;
    private Boolean isSystem;
    private Boolean isActive;
    private List<TypePermissionResponse> permissions;
}
