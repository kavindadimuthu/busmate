package com.busmatelk.backend.dto.request;

import lombok.Data;

import java.time.Instant;

@Data
public class UpsertOverrideRequest {
    private Boolean isGranted;
    private String reason;
    private Instant expiresAt;
}
