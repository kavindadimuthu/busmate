package com.busmatelk.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

/**
 * Shared by GET /internal/users/{userId} (from a DB lookup) and POST /internal/auth/validate
 * (decoded straight from JWT claims) — both resolve to the same four fields.
 */
@Data
@AllArgsConstructor
public class InternalUserResponse {
    private UUID userId;
    private String email;
    private String userType;
    private String accountStatus;
}
