package com.busmatelk.backend.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class ReplacePermissionsRequest {
    private List<String> permissionNames;
}
