package com.busmatelk.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;


@Data
@AllArgsConstructor
@NoArgsConstructor
public class MotDTO {
    // From `users` table
    private UUID userId;
    private String fullName;
    private String username;
    private String email;
    private String role;
    private String accountStatus;
    private Boolean isVerified;

    private String password;
}
