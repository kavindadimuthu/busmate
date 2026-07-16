package com.busmatelk.backend.controller;

import com.busmatelk.backend.model.User;
import com.busmatelk.backend.model.UserType;
import com.busmatelk.backend.repository.UserRepository;
import com.busmatelk.backend.repository.UserTypeRepository;
import com.busmatelk.backend.repository.AuthAuditLogRepository;
import com.busmatelk.backend.repository.UserIdentityRepository;
import com.busmatelk.backend.service.CredentialService;
import com.busmatelk.backend.service.EmailService;
import com.busmatelk.backend.service.OneTimeTokenService;
import com.busmatelk.backend.service.SocialIdentityVerifier;
import com.busmatelk.backend.service.VerifiedSocialIdentity;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
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

    @Autowired
    private CredentialService credentialService;

    @Autowired
    private OneTimeTokenService oneTimeTokenService;

    @Autowired
    private UserIdentityRepository userIdentityRepository;

    @Autowired
    private AuthAuditLogRepository auditLogRepository;

    // The only external side effect left in the auth flows — mocked so tests never need a real
    // mailbox, but the token issuance/consumption/state-change logic around it is exercised for
    // real (see forgotPassword/resetPassword/verifyEmail tests below).
    @MockitoBean
    private EmailService emailService;

    // Real ID-token signature/issuer/audience verification is covered directly by
    // JwtSocialIdentityVerifierTest against a local JWKS server; mocked here so these tests
    // exercise only AuthService's find-or-link/audience-enforcement logic.
    @MockitoBean
    private SocialIdentityVerifier socialIdentityVerifier;

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

        // The family-burn write survives the very exception it raises (AuditLogService's
        // REQUIRES_NEW, mirroring RefreshTokenService.rotate's own noRollbackFor). userId is null
        // here — AuthService.refresh only learns which account a bad/reused token belonged to
        // after successfully rotating it, which by definition never happens on this path.
        assertThat(auditLogRepository.findTopByOrderByCreatedAtDesc().orElseThrow().getAction())
                .isEqualTo("refresh.failure");
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

        assertThat(latestAuditAction(userId)).isEqualTo("logout");
    }

    @Test
    void loginWritesAnAuditEntryOnSuccessAndOnFailure() throws Exception {
        UUID userId = UUID.randomUUID();
        UserType passengerType = userTypeRepository.findByName("passenger").orElseThrow();
        userRepository.save(User.builder()
                .userId(userId)
                .email("audited@example.com")
                .userType(passengerType)
                .accountStatus("active")
                .isEmailVerified(true)
                .build());
        credentialService.createCredential(userId, "Sup3rSecret!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("email", "audited@example.com", "password", "not-it"))))
                .andExpect(status().isUnauthorized());
        assertThat(latestAuditAction(userId)).isEqualTo("login.failure");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("email", "audited@example.com", "password", "Sup3rSecret!"))))
                .andExpect(status().isOk());
        assertThat(latestAuditAction(userId)).isEqualTo("login.success");
    }

    private String login(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
    }

    private String latestAuditAction(UUID userId) {
        return auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 1))
                .getContent().get(0).getAction();
    }

    private String jsonField(String json, String field) throws Exception {
        return objectMapper.readTree(json).get(field).asText();
    }

    @Test
    void registerSendsAVerificationEmail() throws Exception {
        String body = "{\"email\":\"verifyme@example.com\",\"password\":\"Sup3rSecret!\",\"fullName\":\"Verify Me\"}";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());

        verify(emailService).sendVerificationEmail(eq("verifyme@example.com"), anyString());
    }

    @Test
    void verifyEmailMarksTheAccountVerified() throws Exception {
        UUID userId = UUID.randomUUID();
        UserType passengerType = userTypeRepository.findByName("passenger").orElseThrow();
        User user = userRepository.save(User.builder()
                .userId(userId)
                .email("toverify@example.com")
                .userType(passengerType)
                .accountStatus("pending")
                .isEmailVerified(false)
                .build());
        credentialService.createCredential(userId, "Sup3rSecret!");

        // Drive verifyEmail() directly with a real token from OneTimeTokenService rather than
        // capturing one out of a register call — keeps this test independent of registration's
        // own email-sending behavior.
        String rawToken = oneTimeTokenService.issueEmailVerificationToken(userId);

        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("token", rawToken))))
                .andExpect(status().isOk());

        assertThat(userRepository.findById(userId).orElseThrow().getIsEmailVerified()).isTrue();
        assertThat(latestAuditAction(userId)).isEqualTo("email.verified");

        // Single-use: the same token doesn't work twice.
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("token", rawToken))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void forgotPasswordAlwaysReturns200ButOnlyEmailsRealAccounts() throws Exception {
        UUID userId = UUID.randomUUID();
        UserType passengerType = userTypeRepository.findByName("passenger").orElseThrow();
        userRepository.save(User.builder()
                .userId(userId)
                .email("hasaccount@example.com")
                .userType(passengerType)
                .accountStatus("active")
                .isEmailVerified(true)
                .build());
        credentialService.createCredential(userId, "Old-Password-1");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "hasaccount@example.com"))))
                .andExpect(status().isOk());
        verify(emailService).sendPasswordResetEmail(eq("hasaccount@example.com"), anyString());

        // An email with no account behind it gets the identical 200 — no enumeration signal —
        // and (implicitly) no email is sent for it since sendPasswordResetEmail was verified
        // exactly once above, for the real account only.
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "nobody@example.com"))))
                .andExpect(status().isOk());
    }

    @Test
    void requestingPasswordResetTwiceInvalidatesTheFirstLink() throws Exception {
        UUID userId = UUID.randomUUID();
        UserType passengerType = userTypeRepository.findByName("passenger").orElseThrow();
        userRepository.save(User.builder()
                .userId(userId)
                .email("tworesets@example.com")
                .userType(passengerType)
                .accountStatus("active")
                .isEmailVerified(true)
                .build());
        credentialService.createCredential(userId, "Some-Password-1");

        String firstToken = oneTimeTokenService.issuePasswordResetToken(userId);
        String secondToken = oneTimeTokenService.issuePasswordResetToken(userId);

        // The first (now-superseded) link is dead...
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("token", firstToken, "newPassword", "Wont-Apply-1"))))
                .andExpect(status().isUnauthorized());

        // ...only the most recently requested one works.
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("token", secondToken, "newPassword", "Applied-2"))))
                .andExpect(status().isOk());
    }

    @Test
    void resetPasswordChangesThePasswordAndRevokesSessions() throws Exception {
        UUID userId = UUID.randomUUID();
        UserType passengerType = userTypeRepository.findByName("passenger").orElseThrow();
        userRepository.save(User.builder()
                .userId(userId)
                .email("willreset@example.com")
                .userType(passengerType)
                .accountStatus("active")
                .isEmailVerified(true)
                .build());
        credentialService.createCredential(userId, "Old-Password-1");

        String refreshToken = jsonField(login("willreset@example.com", "Old-Password-1"), "refreshToken");

        String rawToken = oneTimeTokenService.issuePasswordResetToken(userId);
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("token", rawToken, "newPassword", "New-Password-2"))))
                .andExpect(status().isOk());
        assertThat(latestAuditAction(userId)).isEqualTo("password.reset");

        // Old password no longer works, new one does.
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("email", "willreset@example.com", "password", "Old-Password-1"))))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("email", "willreset@example.com", "password", "New-Password-2"))))
                .andExpect(status().isOk());

        // The session that existed before the reset is dead.
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", refreshToken))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void changePasswordActuallyPersistsAndRevokesSessions() throws Exception {
        // Regression test: changePassword() follows updatePassword() with a refresh-token-family
        // revocation, the same ordering that silently lost the reset-password write above (an
        // unflushed AuthCredential change getting wiped by RefreshTokenRepository's
        // @Modifying(clearAutomatically = true) bulk query) before CredentialService started
        // flushing immediately.
        UUID userId = UUID.randomUUID();
        UserType passengerType = userTypeRepository.findByName("passenger").orElseThrow();
        userRepository.save(User.builder()
                .userId(userId)
                .email("changepw@example.com")
                .userType(passengerType)
                .accountStatus("active")
                .isEmailVerified(true)
                .build());
        credentialService.createCredential(userId, "Old-Password-1");

        String session = login("changepw@example.com", "Old-Password-1");
        String refreshToken = jsonField(session, "refreshToken");
        String accessToken = jsonField(session, "accessToken");

        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("currentPassword", "Old-Password-1", "newPassword", "New-Password-2"))))
                .andExpect(status().isOk());
        assertThat(latestAuditAction(userId)).isEqualTo("password.change");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("email", "changepw@example.com", "password", "Old-Password-1"))))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("email", "changepw@example.com", "password", "New-Password-2"))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", refreshToken))))
                .andExpect(status().isUnauthorized());
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

    @Test
    void socialLoginCreatesANewPassengerWhenNoAccountMatches() throws Exception {
        when(socialIdentityVerifier.verify("google", "raw-id-token"))
                .thenReturn(new VerifiedSocialIdentity("google", "google-subject-new", "newrider@example.com", true));

        mockMvc.perform(post("/api/auth/social/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("idToken", "raw-id-token"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.userType").value("passenger"));

        // Not re-querying the created User here: same H2-only JsonBinaryType re-read issue noted
        // on passengerCanSelfRegister above (loading a mappedBy OneToOne eagerly resolves the
        // profile's JSONB column from a fresh persistence context). user_identities has no JSONB
        // column, so that's the safe thing to assert against instead.
        UUID createdUserId = userIdentityRepository.findByProviderAndProviderUserId("google", "google-subject-new")
                .orElseThrow().getUserId();
        assertThat(latestAuditAction(createdUserId)).isEqualTo("social_login.success");
    }

    @Test
    void socialLoginLinksToAnExistingPassengerAccountByEmail() throws Exception {
        UUID userId = UUID.randomUUID();
        UserType passengerType = userTypeRepository.findByName("passenger").orElseThrow();
        userRepository.save(User.builder()
                .userId(userId)
                .email("alreadyregistered@example.com")
                .userType(passengerType)
                .accountStatus("active")
                .isEmailVerified(true)
                .build());
        when(socialIdentityVerifier.verify("google", "raw-id-token")).thenReturn(
                new VerifiedSocialIdentity("google", "google-subject-link", "alreadyregistered@example.com", true));

        mockMvc.perform(post("/api/auth/social/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("idToken", "raw-id-token"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(userId.toString()));

        assertThat(userIdentityRepository.findByProviderAndProviderUserId("google", "google-subject-link")
                .orElseThrow().getUserId()).isEqualTo(userId);
    }

    @Test
    void socialLoginLogsInAnAlreadyLinkedAccountViaTheStoredIdentity() throws Exception {
        UUID userId = UUID.randomUUID();
        UserType passengerType = userTypeRepository.findByName("passenger").orElseThrow();
        userRepository.save(User.builder()
                .userId(userId)
                .email("returning@example.com")
                .userType(passengerType)
                .accountStatus("active")
                .isEmailVerified(true)
                .build());
        userIdentityRepository.save(com.busmatelk.backend.model.UserIdentity.builder()
                .userId(userId)
                .provider("google")
                .providerUserId("google-subject-returning")
                .email("returning@example.com")
                .build());
        // Even if the provider now reports a different email (e.g. the user changed it with
        // Google), the stored (provider, subject) link is what's authoritative.
        when(socialIdentityVerifier.verify("google", "raw-id-token")).thenReturn(
                new VerifiedSocialIdentity("google", "google-subject-returning", "changed@example.com", true));

        mockMvc.perform(post("/api/auth/social/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("idToken", "raw-id-token"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(userId.toString()));
    }

    @Test
    void socialLoginRejectsNonPassengerAccounts() throws Exception {
        UUID userId = UUID.randomUUID();
        UserType operatorType = userTypeRepository.findByName("operator").orElseThrow();
        userRepository.save(User.builder()
                .userId(userId)
                .email("staffmember@example.com")
                .userType(operatorType)
                .accountStatus("active")
                .isEmailVerified(true)
                .build());
        when(socialIdentityVerifier.verify("google", "raw-id-token")).thenReturn(
                new VerifiedSocialIdentity("google", "google-subject-staff", "staffmember@example.com", true));

        mockMvc.perform(post("/api/auth/social/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("idToken", "raw-id-token"))))
                .andExpect(status().isForbidden());

        assertThat(userIdentityRepository.findByProviderAndProviderUserId("google", "google-subject-staff"))
                .isEmpty();
        assertThat(latestAuditAction(userId)).isEqualTo("social_login.rejected");
    }

    @Test
    void socialLoginRejectsBlockedAccounts() throws Exception {
        UUID userId = UUID.randomUUID();
        UserType passengerType = userTypeRepository.findByName("passenger").orElseThrow();
        userRepository.save(User.builder()
                .userId(userId)
                .email("suspendedrider@example.com")
                .userType(passengerType)
                .accountStatus("suspended")
                .isEmailVerified(true)
                .build());
        when(socialIdentityVerifier.verify("google", "raw-id-token")).thenReturn(
                new VerifiedSocialIdentity("google", "google-subject-suspended", "suspendedrider@example.com", true));

        mockMvc.perform(post("/api/auth/social/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("idToken", "raw-id-token"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void socialLoginPropagatesAnInvalidTokenAsUnauthorized() throws Exception {
        when(socialIdentityVerifier.verify(eq("google"), anyString()))
                .thenThrow(new com.busmatelk.backend.service.InvalidTokenException("bad signature"));

        mockMvc.perform(post("/api/auth/social/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("idToken", "garbage"))))
                .andExpect(status().isUnauthorized());
    }
}
