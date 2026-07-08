package com.busmatelk.backend.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * Supabase /auth/v1/signup replies with the user object at the root in most
 * configurations, but some project settings wrap it under "user" instead —
 * userId() checks both so callers don't need to know which shape came back.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class SupabaseSignupResponse {
    private String id;
    private String email;
    private SupabaseSignupResponse user;

    public String userId() {
        return id != null ? id : (user != null ? user.getId() : null);
    }
}
