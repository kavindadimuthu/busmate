package com.busmatelk.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TimekeeperDTO {
    private UUID id;
    private String fullname;
    private String phonenumber;
    private String email;
    private String assign_stand;
    private String nic;
    private String province;
    private String password;
}
