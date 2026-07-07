package com.busmatelk.backend.dto;

import lombok.*;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class fleetOperatorDTO {

    // From `users` table
    private UUID userId;
    private String fullName;
    private String username;
    private String email;
    private String phoneNumber;  // Added phoneNumber field
//    private String role;
    private String accountStatus;
    private Boolean isVerified;

    // From `fleetoperator_profile` table
    private String operatorType;
    private String organizationName;
    private String region;
    private String registrationId;
    private String address;
    private String district;
    private String fleetSize;
    private String profilePictureUrl;


    // passward set for dto
    private String password;


    public String toJson() {
        return "{" +
                "\"userId\":\"" + userId + "\"," +
                "\"fullName\":\"" + fullName + "\"," +
                "\"username\":\"" + username + "\"," +
                "\"email\":\"" + email + "\"," +
                "\"phoneNumber\":\"" + phoneNumber + "\"," +
                "\"accountStatus\":\"" + accountStatus + "\"," +
                "\"isVerified\":" + isVerified + "," +
                "\"operatorType\":\"" + operatorType + "\"," +
                "\"organizationName\":\"" + organizationName + "\"," +
                "\"region\":\"" + region + "\"," +
                "\"registrationId\":\"" + registrationId + "\"," +
                "\"address\":\"" + address + "\"," +
                "\"district\":\"" + district + "\"," +
                "\"fleetSize\":\"" + fleetSize + "\"," +
                "\"profilePictureUrl\":\"" + profilePictureUrl + "\"" +
                "}";
    }
}
