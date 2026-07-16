package com.busmatelk.backend.controller;

import com.busmatelk.backend.client.SupabaseAuthClient;
import com.busmatelk.backend.model.User;
import com.busmatelk.backend.model.UserType;
import com.busmatelk.backend.repository.UserRepository;
import com.busmatelk.backend.repository.UserTypeRepository;
import com.busmatelk.backend.service.CredentialService;
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

    @Autowired
    private CredentialService credentialService;

    // Auth is fully in-house now; this mock only stands in for the email flows (forgot/reset/
    // verify) that still call GoTrue until Phase 3. Register/login below never touch it.
    @MockitoBean
    private SupabaseAuthClient supabaseAuthClient;

    @Value("${supabase.jwt.secret}")
    private String jwtSecret;

    @Test
    void passengerCanSelfRegister() throws Exception {
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
        String requestJson = "{\"email\":\"wannabeadmin@example.com\",\"password\":\"Sup3rSecret!\","
                + "\"fullName\":\"Sneaky\",\"userType\":\"admin\"}";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userType").value("passenger"));
    }

    @Test
    void registerRejectsDuplicateEmail() throws Exception {
        // Seed the pre-existing account directly (no user_profiles row) rather than via a first
        // /register call: the duplicate-check re-reads the existing user by email, and re-reading
        // a profile's "{}" JSONB from a fresh persistence context trips the same H2-only
        // JsonBinaryType bug noted in passengerCanSelfRegister (fine on real Postgres).
        UserType passengerType = userTypeRepository.findByName("passenger").orElseThrow();
        userRepository.save(User.builder()
                .userId(UUID.randomUUID())
                .email("dupe@example.com")
                .userType(passengerType)
                .accountStatus("active")
                .isEmailVerified(true)
                .build());

        String body = "{\"email\":\"dupe@example.com\",\"password\":\"Sup3rSecret!\",\"fullName\":\"Second\"}";
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());
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
        credentialService.createCredential(existingUserId, "Sup3rSecret!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("email", "existing@example.com", "password", "Sup3rSecret!"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.userType").value("passenger"))
                .andExpect(jsonPath("$.userId").value(existingUserId.toString()));

        User reloaded = userRepository.findById(existingUserId).orElseThrow();
        assertThat(reloaded.getLastLoginAt()).isNotNull();
    }

    @Test
    void loginRejectsWrongPassword() throws Exception {
        UUID userId = UUID.randomUUID();
        UserType passengerType = userTypeRepository.findByName("passenger").orElseThrow();
        userRepository.save(User.builder()
                .userId(userId)
                .email("wrongpass@example.com")
                .userType(passengerType)
                .accountStatus("active")
                .isEmailVerified(true)
                .build());
        credentialService.createCredential(userId, "Correct-Password-1");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("email", "wrongpass@example.com", "password", "not-it"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refreshRotatesTokenAndDetectsReuse() throws Exception {
        UUID userId = UUID.randomUUID();
        UserType passengerType = userTypeRepository.findByName("passenger").orElseThrow();
        userRepository.save(User.builder()
                .userId(userId)
                .email("rotate@example.com")
                .userType(passengerType)
                .accountStatus("active")
                .isEmailVerified(true)
                .build());
        credentialService.createCredential(userId, "Sup3rSecret!");

        String firstRefresh = jsonField(login("rotate@example.com", "Sup3rSecret!"), "refreshToken");

        // A refresh rotates: 200 with a brand-new, different refresh token.
        String secondRefresh = mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", firstRefresh))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andReturn().getResponse().getContentAsString();
        String rotated = jsonField(secondRefresh, "refreshToken");
        assertThat(rotated).isNotEqualTo(firstRefresh);

        // Replaying the now-rotated first token is rejected AND burns the whole family...
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", firstRefresh))))
                .andExpect(status().isUnauthorized());

        // ...so the legitimately rotated successor is now dead too.
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", rotated))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logoutRevokesRefreshTokens() throws Exception {
        UUID userId = UUID.randomUUID();
        UserType passengerType = userTypeRepository.findByName("passenger").orElseThrow();
        userRepository.save(User.builder()
                .userId(userId)
                .email("logout@example.com")
                .userType(passengerType)
                .accountStatus("active")
                .isEmailVerified(true)
                .build());
        credentialService.createCredential(userId, "Sup3rSecret!");

        String session = login("logout@example.com", "Sup3rSecret!");
        String accessToken = jsonField(session, "accessToken");
        String refreshToken = jsonField(session, "refreshToken");

        mockMvc.perform(post("/api/auth/logout").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNoContent());

        // The refresh token no longer works after logout.
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", refreshToken))))
                .andExpect(status().isUnauthorized());
    }

    private String login(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
    }

    private String jsonField(String json, String field) throws Exception {
        return objectMapper.readTree(json).get(field).asText();
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
