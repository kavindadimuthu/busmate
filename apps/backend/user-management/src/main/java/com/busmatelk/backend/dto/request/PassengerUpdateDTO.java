package com.busmatelk.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PassengerUpdateDTO {
    private String fullName;
    private String phoneNumber;
    private String username;
    private String notification_preferences;
}
