package com.busmatelk.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ConductorDTO {

    // From `users` table
    private UUID userId;
    private String fullName;
    private String username;
    private String email;
    private String role;
    private String accountStatus;
    private Boolean isVerified;
    private String phoneNumber;

    //for conductor
    private String employee_id;
    private String assign_operator_id;
    private String shift_status;
    private String nicNumber;
    private String dateOfBirth;
    private String gender;
    private String pr_img_path;

    //for auth
    private String password;


}
