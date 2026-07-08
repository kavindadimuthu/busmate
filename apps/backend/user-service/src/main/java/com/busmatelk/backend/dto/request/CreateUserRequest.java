package com.busmatelk.backend.dto.request;

import lombok.Data;

import java.util.Map;

/**
 * Used by AuthService.createUser() (privileged user creation). Not yet wired to a controller —
 * that lands in Phase 6's POST /users, which will reuse this same request shape.
 */
@Data
public class CreateUserRequest {
    private String email;
    private String password;
    private String fullName;
    private String username;
    private String phoneNumber;
    private String userType;
    private Map<String, Object> profileData;
}
