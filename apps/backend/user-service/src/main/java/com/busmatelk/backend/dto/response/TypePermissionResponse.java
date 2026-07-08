package com.busmatelk.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class TypePermissionResponse {
    private UUID permissionId;
    private String permissionName;
    private String resource;
    private String action;
    private String scope;
    private Boolean isGranted;
}
