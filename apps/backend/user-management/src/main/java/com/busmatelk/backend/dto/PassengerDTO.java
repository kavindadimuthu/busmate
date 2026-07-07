package com.busmatelk.backend.dto;

import lombok.*;

import java.util.UUID;


@Data
@AllArgsConstructor
@NoArgsConstructor
public class PassengerDTO {

    // From `users` table
    private UUID userId;
    private String fullName;
    private String username;
    private String email;
    private String role;
    private String accountStatus;
    private Boolean isVerified;


    private String password;
    //for passenger table


    private String notification_preferences;
}
