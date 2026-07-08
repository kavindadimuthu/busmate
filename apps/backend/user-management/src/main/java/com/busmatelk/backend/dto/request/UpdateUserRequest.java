package com.busmatelk.backend.dto.request;

import lombok.Data;

/**
 * Deliberately excludes email, userType, and accountStatus — those are separate admin actions,
 * not editable through this endpoint.
 */
@Data
public class UpdateUserRequest {
    private String fullName;
    private String username;
    private String phoneNumber;
}
