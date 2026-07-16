package com.busmatelk.backend.service;

import com.busmatelk.backend.client.SupabaseAuthClient;
import com.busmatelk.backend.client.dto.SupabaseTokenResponse;
import com.busmatelk.backend.dto.request.CreateUserRequest;
import com.busmatelk.backend.dto.request.LoginRequestDTO;
import com.busmatelk.backend.dto.request.RegisterRequest;
import com.busmatelk.backend.dto.response.AuthMeResponse;
import com.busmatelk.backend.dto.response.LoginResponse;
import com.busmatelk.backend.dto.response.RegisterResponse;
import com.busmatelk.backend.event.UserEventPublisher;
import com.busmatelk.backend.model.User;
import com.busmatelk.backend.model.UserIdentity;
import com.busmatelk.backend.model.UserProfile;
import com.busmatelk.backend.model.UserType;
import com.busmatelk.backend.operator.OperatorSyncService;
import com.busmatelk.backend.repository.UserIdentityRepository;
import com.busmatelk.backend.repository.UserProfileRepository;
import com.busmatelk.backend.repository.UserRepository;
import com.busmatelk.backend.repository.UserTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    /** Provider name recorded for email/password logins in {@code user_identities}. */
    private static final String LOCAL_PROVIDER = "local";

    /** Account statuses that block a login/refresh outright (the gateway also 403s on "suspended"). */
    private static final Set<String> LOGIN_BLOCKED_STATUSES = Set.of("suspended", "deactivated", "deleted");

    private final CredentialService credentialService;
    private final TokenService tokenService;
    private final UserRepository userRepository;
    private final UserTypeRepository userTypeRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserIdentityRepository userIdentityRepository;
    private final PermissionService permissionService;
    private final UserEventPublisher userEventPublisher;
    private final ProfileSchemaValidator profileSchemaValidator;
    private final OperatorSyncService operatorSyncService;

    // Still backs the email flows (forgot/reset/verify) until Phase 3 brings them in-house.
    private final SupabaseAuthClient supabaseAuthClient;

    /**
     * Self-registration flow — always creates a "passenger", pending verification. The user row,
     * its password credential, the local identity, and the profile are all written in one
     * transaction, so a failure anywhere rolls the whole thing back. (This is what retires the old
     * Supabase dual-write and its orphaned-user compensation: there is no second system to keep in
     * sync anymore.)
     */
    @Transactional
    public RegisterResponse registerPassenger(RegisterRequest request) {
        UserType passengerType = userTypeRepository.findByName("passenger")
                .orElseThrow(() -> new IllegalStateException("'passenger' user type is not seeded"));

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new EmailAlreadyExistsException("An account with this email already exists");
        }

        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .userId(userId)
                .email(request.getEmail())
                .fullName(request.getFullName())
                .username(request.getUsername())
                .phoneNumber(request.getPhoneNumber())
                .userType(passengerType)
                .accountStatus("pending")
                .isEmailVerified(false)
                .build();
        user = userRepository.save(user);

        credentialService.createCredential(userId, request.getPassword());
        saveLocalIdentity(userId, request.getEmail());

        UserProfile profile = UserProfile.builder()
                .user(user)
                .profileData(new HashMap<>())
                .build();
        userProfileRepository.save(profile);
        userEventPublisher.publishUserCreated(user);

        return new RegisterResponse(user.getUserId(), user.getEmail(), "passenger", user.getAccountStatus());
    }

    /**
     * Privileged user creation, used by the admin-facing endpoints in Phase 6 (POST /users).
     * Not called from anywhere yet — wired up once that controller exists.
     */
    @Transactional
    public RegisterResponse createUser(CreateUserRequest request, UUID callerId) {
        String permission = "user." + request.getUserType() + ":create";
        if (!permissionService.hasPermission(callerId, permission)) {
            throw new AccessDeniedException("Permission denied: " + permission);
        }

        UserType targetType = userTypeRepository.findByName(request.getUserType())
                .orElseThrow(() -> new IllegalArgumentException("Unknown user type: " + request.getUserType()));

        // Validated up front, before any row is written, so an incomplete profile (e.g. an
        // operator missing organization_name/operator_type/region — required since the unified
        // operator lifecycle sync needs them) fails fast rather than half-creating the account.
        Map<String, Object> profileData = request.getProfileData() != null
                ? new HashMap<>(request.getProfileData())
                : new HashMap<>();
        profileSchemaValidator.validate(request.getUserType(), profileData);

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new EmailAlreadyExistsException("An account with this email already exists");
        }

        UUID userId = UUID.randomUUID();
        User creator = userRepository.findById(callerId).orElseThrow();

        User user = User.builder()
                .userId(userId)
                .email(request.getEmail())
                .fullName(request.getFullName())
                .username(request.getUsername())
                .phoneNumber(request.getPhoneNumber())
                .userType(targetType)
                .accountStatus("active")
                .isEmailVerified(false)
                .createdBy(creator)
                .build();
        user = userRepository.save(user);

        credentialService.createCredential(userId, request.getPassword());
        saveLocalIdentity(userId, request.getEmail());

        UserProfile profile = UserProfile.builder()
                .user(user)
                .profileData(profileData)
                .build();
        userProfileRepository.save(profile);
        userEventPublisher.publishUserCreated(user);
        operatorSyncService.syncCreate(user.getUserId(), request.getUserType(), profileData, user.getAccountStatus());

        return new RegisterResponse(user.getUserId(), user.getEmail(), request.getUserType(), user.getAccountStatus());
    }

    @Transactional
    public LoginResponse login(LoginRequestDTO request) {
        // A missing user and a wrong password fail identically — no account-enumeration signal.
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!credentialService.verifyPassword(user.getUserId(), request.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        ensureLoginAllowed(user);

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        return toLoginResponse(user);
    }

    public void logout(String accessToken) {
        // Phase 1: access and refresh tokens are both stateless JWTs, so there is nothing to
        // revoke server-side yet — the gateway clears its own session cookies on logout. Real
        // server-side revocation (invalidating a stored refresh-token family) arrives in Phase 2.
    }

    @Transactional
    public LoginResponse refresh(String refreshToken) {
        UUID userId = tokenService.parseRefreshToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new InvalidTokenException("Account for this refresh token no longer exists"));
        ensureLoginAllowed(user);
        return toLoginResponse(user);
    }

    // TODO(Phase 3): forgot/reset/verify still call Supabase GoTrue. Once the local one-time-token
    // + email pipeline lands, these move in-house; until then they only work for users that still
    // exist in Supabase, not for accounts created through the local registration path above.
    public void forgotPassword(String email) {
        supabaseAuthClient.sendRecoveryEmail(email);
    }

    public void resetPassword(String token, String newPassword) {
        SupabaseTokenResponse session = supabaseAuthClient.verifyOtp("recovery", token);
        if (session.getAccessToken() == null) {
            throw new IllegalStateException("Recovery token verification did not return a session");
        }
        supabaseAuthClient.updateUserPassword(session.getAccessToken(), newPassword);
    }

    @Transactional
    public void verifyEmail(String token) {
        SupabaseTokenResponse session = supabaseAuthClient.verifyOtp("signup", token);
        SupabaseTokenResponse.SupabaseUser supaUser = session.getUser();
        if (supaUser == null || supaUser.getId() == null) {
            throw new IllegalStateException("Signup token verification did not return user info");
        }
        userRepository.findById(UUID.fromString(supaUser.getId())).ifPresent(user -> {
            user.setIsEmailVerified(true);
            userRepository.save(user);
        });
    }

    /**
     * Re-authenticates against the current password (verified locally against auth_credentials)
     * before applying the new one. Supabase is no longer in this path.
     */
    @Transactional
    public void changePassword(UUID callerId, String currentPassword, String newPassword) {
        if (!credentialService.verifyPassword(callerId, currentPassword)) {
            throw new BadCredentialsException("Current password is incorrect");
        }
        credentialService.updatePassword(callerId, newPassword);
    }

    public AuthMeResponse getCurrentUserWithPermissions(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow();
        List<String> permissions = permissionService.getEffectivePermissions(userId);
        return new AuthMeResponse(
                user.getUserId(),
                user.getEmail(),
                user.getFullName(),
                user.getUsername(),
                user.getPhoneNumber(),
                user.getUserType().getName(),
                user.getAccountStatus(),
                user.getIsEmailVerified(),
                permissions
        );
    }

    private void ensureLoginAllowed(User user) {
        if (LOGIN_BLOCKED_STATUSES.contains(user.getAccountStatus())) {
            throw new DisabledException("Account is " + user.getAccountStatus());
        }
    }

    private LoginResponse toLoginResponse(User user) {
        TokenService.IssuedTokens tokens = tokenService.issueTokens(user);
        return new LoginResponse(
                tokens.accessToken(),
                tokens.refreshToken(),
                tokens.expiresIn(),
                user.getUserId().toString(),
                user.getUserType().getName()
        );
    }

    private void saveLocalIdentity(UUID userId, String email) {
        userIdentityRepository.save(UserIdentity.builder()
                .userId(userId)
                .provider(LOCAL_PROVIDER)
                .providerUserId(email)
                .email(email)
                .build());
    }
}
