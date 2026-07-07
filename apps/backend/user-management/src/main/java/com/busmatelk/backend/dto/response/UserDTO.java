package com.busmatelk.backend.dto.response;

import lombok.Data;

import java.time.Instant;

@Data
public class UserDTO {

    private String fullName;
    private String username;
    private String phoneNumber;
    private String email;
    private String role;
    private String accountStatus;
    private Instant lastLoginAt;

}
