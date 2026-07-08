package com.busmatelk.backend.controller;

import com.busmatelk.backend.client.SupabaseAuthClient;
import com.busmatelk.backend.client.dto.SupabaseSignupResponse;
import com.busmatelk.backend.client.dto.SupabaseTokenResponse;
import com.busmatelk.backend.model.User;
import com.busmatelk.backend.model.UserType;
import com.busmatelk.backend.repository.UserRepository;
import com.busmatelk.backend.repository.UserTypeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserTypeRepository userTypeRepository;

    // Never hits the real Supabase Auth API — every test stubs exactly the calls it needs.
    @MockitoBean
    private SupabaseAuthClient supabaseAuthClient;

    @Value("${supabase.jwt.secret}")
    private String jwtSecret;

    @Test
    void passengerCanSelfRegister() throws Exception {
        String fakeUserId = UUID.randomUUID().toString();
        SupabaseSignupResponse signupResponse = new SupabaseSignupResponse();
        signupResponse.setId(fakeUserId);
        signupResponse.setEmail("newpassenger@example.com");
        when(supabaseAuthClient.signup(anyString(), anyString())).thenReturn(signupResponse);

        Map<String, Object> requestBody = Map.of(
                "email", "newpassenger@example.com",
                "password", "Sup3rSecret!",
                "fullName", "New Passenger");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userType").value("passenger"))
                .andExpect(jsonPath("$.accountStatus").value("pending"));

        // Not re-querying the user afterward here: doing so would force Hibernate to re-read
        // the just-written user_profiles.profile_data JSONB column from a fresh persistence
        // context (rather than serving it from the first-level cache, as happens within the
        // same request) — and hypersistence-utils' JsonBinaryType round-trips that specific
        // read incorrectly against H2 (works fine against real Postgres; confirmed live in
        // Phase 11). The response assertions above already verify the write succeeded.
    }

    @Test
    void registerIgnoresAnAttemptToRequestAdminType() throws Exception {
        // RegisterRequest has no userType field by design (Phase 5) — self-registration can
        // only ever produce a passenger, so there is no runtime check to "return 403" against
        // as the plan's literal test case describes. This verifies that guarantee holds even
        // if a caller sends the field anyway: Jackson silently ignores the unknown property
        // and the user is still created as a passenger, rather than failing at all.
        String fakeUserId = UUID.randomUUID().toString();
        SupabaseSignupResponse signupResponse = new SupabaseSignupResponse();
        signupResponse.setId(fakeUserId);
        signupResponse.setEmail("wannabeadmin@example.com");
        when(supabaseAuthClient.signup(anyString(), anyString())).thenReturn(signupResponse);

        String requestJson = "{\"email\":\"wannabeadmin@example.com\",\"password\":\"Sup3rSecret!\","
                + "\"fullName\":\"Sneaky\",\"userType\":\"admin\"}";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userType").value("passenger"));
    }

    @Test
    void loginReturnsTokensAndUserType() throws Exception {
        UUID existingUserId = UUID.randomUUID();
        UserType passengerType = userTypeRepository.findByName("passenger").orElseThrow();
        userRepository.save(User.builder()
                .userId(existingUserId)
                .email("existing@example.com")
                .userType(passengerType)
                .accountStatus("active")
                .isEmailVerified(true)
                .build());

        SupabaseTokenResponse tokenResponse = new SupabaseTokenResponse();
        tokenResponse.setAccessToken("fake-access-token");
        tokenResponse.setRefreshToken("fake-refresh-token");
        tokenResponse.setExpiresIn(3600L);
        SupabaseTokenResponse.SupabaseUser supaUser = new SupabaseTokenResponse.SupabaseUser();
        supaUser.setId(existingUserId.toString());
        supaUser.setEmail("existing@example.com");
        supaUser.setAppMetadata(Map.of("user_type", "passenger", "account_status", "active"));
        tokenResponse.setUser(supaUser);

        when(supabaseAuthClient.loginWithPassword("existing@example.com", "whatever")).thenReturn(tokenResponse);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("email", "existing@example.com", "password", "whatever"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("fake-access-token"))
                .andExpect(jsonPath("$.refreshToken").value("fake-refresh-token"))
                .andExpect(jsonPath("$.userType").value("passenger"))
                .andExpect(jsonPath("$.userId").value(existingUserId.toString()));

        User reloaded = userRepository.findById(existingUserId).orElseThrow();
        assertThat(reloaded.getLastLoginAt()).isNotNull();
    }

    @Test
    void meReturnsEffectivePermissions() throws Exception {
        UUID userId = UUID.randomUUID();
        UserType passengerType = userTypeRepository.findByName("passenger").orElseThrow();
        userRepository.save(User.builder()
                .userId(userId)
                .email("me@example.com")
                .userType(passengerType)
                .accountStatus("active")
                .isEmailVerified(true)
                .build());

        String token = Jwts.builder()
                .setSubject(userId.toString())
                .claim("email", "me@example.com")
                .claim("app_metadata", Map.of("user_type", "passenger", "account_status", "active"))
                .setExpiration(Date.from(Instant.now().plusSeconds(3600)))
                .signWith(new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), SignatureAlgorithm.HS256.getJcaName()))
                .compact();

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userType").value("passenger"))
                .andExpect(jsonPath("$.effectivePermissions",
                        containsInAnyOrder("profile:read:own", "profile:update:own")));
    }
}
