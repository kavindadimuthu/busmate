package com.busmatelk.backend.service;

import com.busmatelk.backend.client.SupabaseAuthClient;
import com.busmatelk.backend.client.dto.SupabaseSignupResponse;
import com.busmatelk.backend.client.dto.SupabaseTokenResponse;
import com.busmatelk.backend.dto.request.CreateUserRequest;
import com.busmatelk.backend.dto.request.LoginRequestDTO;
import com.busmatelk.backend.dto.request.RegisterRequest;
import com.busmatelk.backend.dto.response.AuthMeResponse;
import com.busmatelk.backend.dto.response.LoginResponse;
import com.busmatelk.backend.dto.response.RegisterResponse;
import com.busmatelk.backend.event.UserEventPublisher;
import com.busmatelk.backend.model.User;
import com.busmatelk.backend.model.UserProfile;
import com.busmatelk.backend.model.UserType;
import com.busmatelk.backend.operator.OperatorSyncService;
import com.busmatelk.backend.repository.UserProfileRepository;
import com.busmatelk.backend.repository.UserRepository;
import com.busmatelk.backend.repository.UserTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final SupabaseAuthClient supabaseAuthClient;
    private final UserRepository userRepository;
    private final UserTypeRepository userTypeRepository;
    private final UserProfileRepository userProfileRepository;
    private final PermissionService permissionService;
    private final UserEventPublisher userEventPublisher;
    private final ProfileSchemaValidator profileSchemaValidator;
    private final OperatorSyncService operatorSyncService;

    /**
     * Self-registration flow — always creates a "passenger", pending verification.
     */
    @Transactional
    public RegisterResponse registerPassenger(RegisterRequest request) {
        UserType passengerType = userTypeRepository.findByName("passenger")
                .orElseThrow(() -> new IllegalStateException("'passenger' user type is not seeded"));

        SupabaseSignupResponse signup = supabaseAuthClient.signup(request.getEmail(), request.getPassword());
        String userIdString = signup.userId();
        if (userIdString == null) {
            throw new IllegalStateException("Supabase signup response did not include a user id");
        }

        try {
            supabaseAuthClient.updateUserAppMetadata(userIdString, Map.of(
                    "user_type", "passenger",
                    "account_status", "pending"
            ));

            User user = User.builder()
                    .userId(UUID.fromString(userIdString))
                    .email(request.getEmail())
                    .fullName(request.getFullName())
                    .username(request.getUsername())
                    .phoneNumber(request.getPhoneNumber())
                    .userType(passengerType)
                    .accountStatus("pending")
                    .isEmailVerified(false)
                    .build();
            user = userRepository.save(user);

            UserProfile profile = UserProfile.builder()
                    .user(user)
                    .profileData(new HashMap<>())
                    .build();
            userProfileRepository.save(profile);
            userEventPublisher.publishUserCreated(user);

            return new RegisterResponse(user.getUserId(), user.getEmail(), "passenger", user.getAccountStatus());
        } catch (RuntimeException e) {
            rollBackOrphanedSupabaseUser(userIdString);
            throw e;
        }
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

        // Validated up front, before the Supabase signup call, so an incomplete profile
        // (e.g. an operator missing organization_name/operator_type/region — required since
        // the unified operator lifecycle sync needs them) never leaves an orphaned Supabase
        // Auth user behind.
        Map<String, Object> profileData = request.getProfileData() != null
                ? new HashMap<>(request.getProfileData())
                : new HashMap<>();
        profileSchemaValidator.validate(request.getUserType(), profileData);

        SupabaseSignupResponse signup = supabaseAuthClient.signup(request.getEmail(), request.getPassword());
        String userIdString = signup.userId();
        if (userIdString == null) {
            throw new IllegalStateException("Supabase signup response did not include a user id");
        }

        try {
            supabaseAuthClient.updateUserAppMetadata(userIdString, Map.of(
                    "user_type", request.getUserType(),
                    "account_status", "active"
            ));

            User creator = userRepository.findById(callerId).orElseThrow();

            User user = User.builder()
                    .userId(UUID.fromString(userIdString))
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

            UserProfile profile = UserProfile.builder()
                    .user(user)
                    .profileData(profileData)
                    .build();
            userProfileRepository.save(profile);
            userEventPublisher.publishUserCreated(user);
            operatorSyncService.syncCreate(user.getUserId(), request.getUserType(), profileData, user.getAccountStatus());

            return new RegisterResponse(user.getUserId(), user.getEmail(), request.getUserType(), user.getAccountStatus());
        } catch (RuntimeException e) {
            rollBackOrphanedSupabaseUser(userIdString);
            throw e;
        }
    }

    public LoginResponse login(LoginRequestDTO request) {
        SupabaseTokenResponse token = supabaseAuthClient.loginWithPassword(request.getEmail(), request.getPassword());
        SupabaseTokenResponse.SupabaseUser supaUser = token.getUser();
        if (supaUser == null || supaUser.getId() == null) {
            throw new IllegalStateException("Supabase login response did not include user info");
        }

        userRepository.findById(UUID.fromString(supaUser.getId())).ifPresent(user -> {
            user.setLastLoginAt(Instant.now());
            userRepository.save(user);
        });

        return new LoginResponse(
                token.getAccessToken(),
                token.getRefreshToken(),
                token.getExpiresIn(),
                supaUser.getId(),
                userTypeOf(supaUser)
        );
    }

    public void logout(String accessToken) {
        supabaseAuthClient.logout(accessToken);
    }

    public LoginResponse refresh(String refreshToken) {
        SupabaseTokenResponse token = supabaseAuthClient.refreshToken(refreshToken);
        SupabaseTokenResponse.SupabaseUser supaUser = token.getUser();
        return new LoginResponse(
                token.getAccessToken(),
                token.getRefreshToken(),
                token.getExpiresIn(),
                supaUser != null ? supaUser.getId() : null,
                userTypeOf(supaUser)
        );
    }

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
     * Verifies currentPassword by performing a real Supabase login with it (doubling as
     * re-authentication), then applies newPassword using the session that login just returned.
     * No separate "current password" check is needed against the local DB — Supabase Auth is
     * the sole source of truth for credentials, this service never stores a password hash.
     */
    public void changePassword(UUID callerId, String currentPassword, String newPassword) {
        User user = userRepository.findById(callerId).orElseThrow();
        SupabaseTokenResponse session = supabaseAuthClient.loginWithPassword(user.getEmail(), currentPassword);
        if (session.getAccessToken() == null) {
            throw new IllegalStateException("Password verification did not return a session");
        }
        supabaseAuthClient.updateUserPassword(session.getAccessToken(), newPassword);
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

    private String userTypeOf(SupabaseTokenResponse.SupabaseUser supaUser) {
        if (supaUser == null || supaUser.getAppMetadata() == null) {
            return null;
        }
        Object userType = supaUser.getAppMetadata().get("user_type");
        return userType != null ? userType.toString() : null;
    }

    /**
     * Best-effort compensation for the dual-write: if the local DB save fails after the
     * Supabase Auth user was already created, delete it rather than leave it orphaned.
     */
    private void rollBackOrphanedSupabaseUser(String userIdString) {
        try {
            supabaseAuthClient.deleteUser(userIdString);
        } catch (RuntimeException cleanupError) {
            // Swallow — the original failure is what the caller needs to see.
        }
    }
}
