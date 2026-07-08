package com.busmatelk.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class RegisterResponse {
    private UUID userId;
    private String email;
    private String userType;
    private String accountStatus;
}
