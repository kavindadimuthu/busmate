package com.busmatelk.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
public class OverrideResponse {
    private String permissionName;
    private Boolean isGranted;
    private UUID grantedBy;
    private String reason;
    private Instant expiresAt;
}
