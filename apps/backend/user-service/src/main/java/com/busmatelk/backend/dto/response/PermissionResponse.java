package com.busmatelk.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class PermissionResponse {
    private UUID id;
    private String name;
    private String resource;
    private String action;
    private String scope;
    private String description;
}
