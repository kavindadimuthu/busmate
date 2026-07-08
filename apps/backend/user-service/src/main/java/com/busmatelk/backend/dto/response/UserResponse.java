package com.busmatelk.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
@AllArgsConstructor
@Builder
public class UserResponse {
    private UUID userId;
    private String email;
    private String fullName;
    private String username;
    private String phoneNumber;
    private String userType;
    private String accountStatus;
    private Boolean isEmailVerified;
    private Instant lastLoginAt;
    private Instant createdAt;
    private Map<String, Object> profileData;
}
