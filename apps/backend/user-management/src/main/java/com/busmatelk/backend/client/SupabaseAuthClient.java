package com.busmatelk.backend.client;

import com.busmatelk.backend.client.dto.SupabaseSignupResponse;
import com.busmatelk.backend.client.dto.SupabaseTokenResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Encapsulates every Supabase Auth (GoTrue) HTTP call. Public operations (signup, login,
 * refresh, recover, verify) are authorized with the anon key; admin operations (updating
 * app_metadata, banning, deleting) require the service-role key.
 */
@Component
public class SupabaseAuthClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.anon-key}")
    private String anonKey;

    @Value("${supabase.api.key}")
    private String serviceRoleKey;

    public SupabaseSignupResponse signup(String email, String password) {
        HttpHeaders headers = anonHeaders();
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(Map.of("email", email, "password", password), headers);
        return execute(() -> restTemplate.postForObject(supabaseUrl + "/auth/v1/signup", entity, SupabaseSignupResponse.class),
                "Supabase signup failed");
    }

    public SupabaseTokenResponse loginWithPassword(String email, String password) {
        HttpHeaders headers = anonHeaders();
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(Map.of("email", email, "password", password), headers);
        return execute(() -> restTemplate.postForObject(
                        supabaseUrl + "/auth/v1/token?grant_type=password", entity, SupabaseTokenResponse.class),
                "Supabase login failed");
    }

    public SupabaseTokenResponse refreshToken(String refreshToken) {
        HttpHeaders headers = anonHeaders();
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(Map.of("refresh_token", refreshToken), headers);
        return execute(() -> restTemplate.postForObject(
                        supabaseUrl + "/auth/v1/token?grant_type=refresh_token", entity, SupabaseTokenResponse.class),
                "Supabase token refresh failed");
    }

    public void logout(String accessToken) {
        HttpHeaders headers = anonHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        execute(() -> {
            restTemplate.postForObject(supabaseUrl + "/auth/v1/logout", entity, Void.class);
            return null;
        }, "Supabase logout failed");
    }

    public void sendRecoveryEmail(String email) {
        HttpHeaders headers = anonHeaders();
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(Map.of("email", email), headers);
        execute(() -> restTemplate.postForObject(supabaseUrl + "/auth/v1/recover", entity, Void.class),
                "Supabase recovery email failed");
    }

    /**
     * Verifies a signup or recovery OTP/token and returns the resulting session.
     * Used by both the reset-password (type=recovery) and verify-email (type=signup) flows.
     */
    public SupabaseTokenResponse verifyOtp(String type, String token) {
        HttpHeaders headers = anonHeaders();
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(Map.of("type", type, "token", token), headers);
        return execute(() -> restTemplate.postForObject(supabaseUrl + "/auth/v1/verify", entity, SupabaseTokenResponse.class),
                "Supabase token verification failed");
    }

    /**
     * Sets the new password on a recovery-verified session (the access_token returned by verifyOtp).
     */
    public void updateUserPassword(String accessToken, String newPassword) {
        HttpHeaders headers = anonHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(Map.of("password", newPassword), headers);
        execute(() -> {
            restTemplate.put(supabaseUrl + "/auth/v1/user", entity);
            return null;
        }, "Supabase password update failed");
    }

    public void updateUserAppMetadata(String userId, Map<String, Object> appMetadata) {
        HttpHeaders headers = serviceRoleHeaders();
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(Map.of("app_metadata", appMetadata), headers);
        execute(() -> {
            restTemplate.exchange(supabaseUrl + "/auth/v1/admin/users/" + userId, HttpMethod.PUT, entity, Void.class);
            return null;
        }, "Supabase app_metadata update failed");
    }

    /**
     * Effectively suspends the account by setting a ~100-year ban duration
     * (Supabase Admin API has no direct "suspend" flag).
     */
    public void banUser(String userId) {
        HttpHeaders headers = serviceRoleHeaders();
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(Map.of("ban_duration", "876000h"), headers);
        execute(() -> {
            restTemplate.exchange(supabaseUrl + "/auth/v1/admin/users/" + userId, HttpMethod.PUT, entity, Void.class);
            return null;
        }, "Supabase ban user failed");
    }

    public void deleteUser(String userId) {
        HttpHeaders headers = serviceRoleHeaders();
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        execute(() -> {
            restTemplate.exchange(supabaseUrl + "/auth/v1/admin/users/" + userId, HttpMethod.DELETE, entity, Void.class);
            return null;
        }, "Supabase delete user failed");
    }

    private HttpHeaders anonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", anonKey);
        return headers;
    }

    private HttpHeaders serviceRoleHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", serviceRoleKey);
        headers.setBearerAuth(serviceRoleKey);
        return headers;
    }

    private <T> T execute(java.util.function.Supplier<T> call, String errorPrefix) {
        try {
            return call.get();
        } catch (HttpStatusCodeException e) {
            throw new RuntimeException(errorPrefix + ": " + e.getResponseBodyAsString(), e);
        }
    }
}
