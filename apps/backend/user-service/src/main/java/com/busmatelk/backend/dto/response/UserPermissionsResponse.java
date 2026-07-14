package com.busmatelk.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class UserPermissionsResponse {
    private List<String> effectivePermissions;
    private List<OverrideResponse> overrides;
}
