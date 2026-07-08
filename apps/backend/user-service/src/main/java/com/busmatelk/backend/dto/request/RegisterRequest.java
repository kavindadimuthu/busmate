package com.busmatelk.backend.dto.request;

import lombok.Data;

/**
 * No userType field on purpose — self-registration always creates a passenger,
 * so there is no field through which a caller could request another type.
 */
@Data
public class RegisterRequest {
    private String email;
    private String password;
    private String fullName;
    private String username;
    private String phoneNumber;
}
