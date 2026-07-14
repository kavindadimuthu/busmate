package com.busmatelk.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
public class AuthMeResponse {
    private UUID userId;
    private String email;
    private String fullName;
    private String username;
    private String phoneNumber;
    private String userType;
    private String accountStatus;
    private Boolean isEmailVerified;
    private List<String> effectivePermissions;
}
