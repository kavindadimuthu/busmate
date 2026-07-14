package com.busmatelk.backend.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.Map;

/**
 * Shape returned by Supabase's /auth/v1/token (password + refresh_token grants)
 * and /auth/v1/verify (recovery/signup OTP verification) — all three hand back a session.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class SupabaseTokenResponse {
    @JsonProperty("access_token")
    private String accessToken;

    @JsonProperty("refresh_token")
    private String refreshToken;

    @JsonProperty("expires_in")
    private Long expiresIn;

    @JsonProperty("token_type")
    private String tokenType;

    private SupabaseUser user;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SupabaseUser {
        private String id;
        private String email;

        @JsonProperty("app_metadata")
        private Map<String, Object> appMetadata;
    }
}
