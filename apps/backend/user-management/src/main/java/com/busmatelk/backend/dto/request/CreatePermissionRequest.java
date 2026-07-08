package com.busmatelk.backend.dto.request;

import lombok.Data;

@Data
public class CreatePermissionRequest {
    private String name;
    private String resource;
    private String action;
    private String scope;
    private String description;
}
