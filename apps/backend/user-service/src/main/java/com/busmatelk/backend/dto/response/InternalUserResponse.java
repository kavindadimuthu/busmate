package com.busmatelk.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

/**
 * Shared by GET /internal/users/{userId} (from a DB lookup) and POST /internal/auth/validate
 * (decoded straight from JWT claims). The token carries only the first four; {@code fullName} and
 * {@code emailVerified} come from the DB lookup and are null on the token path. core-service reads
 * {@code emailVerified} to decide who may apply to be a contributor (INC-029).
 */
@Data
@AllArgsConstructor
public class InternalUserResponse {
    private UUID userId;
    private String email;
    private String userType;
    private String accountStatus;
    private String fullName;
    private Boolean emailVerified;
}
