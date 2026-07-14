package com.busmatelk.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class CheckPermissionRequest {
    @JsonProperty("user_id")
    private String userId;
    private String permission;
}
