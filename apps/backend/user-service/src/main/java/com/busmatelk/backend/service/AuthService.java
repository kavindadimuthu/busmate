package com.busmatelk.backend.service;

import com.busmatelk.backend.dto.request.CreateUserRequest;
import com.busmatelk.backend.dto.request.LoginRequestDTO;
import com.busmatelk.backend.dto.request.RegisterRequest;
import com.busmatelk.backend.dto.response.AuthMeResponse;
import com.busmatelk.backend.dto.response.LoginResponse;
import com.busmatelk.backend.dto.response.RegisterResponse;
import com.busmatelk.backend.event.UserEventPublisher;
import com.busmatelk.backend.model.OneTimeTokenType;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    /** Provider name recorded for email/password logins in {@code user_identities}. */
    private static final String LOCAL_PROVIDER = "local";

    /** Account statuses that block a login/refresh outright (the gateway also 403s on "suspended"). */
    private static final Set<String> LOGIN_BLOCKED_STATUSES = Set.of("suspended", "deactivated", "deleted");

    private final CredentialService credentialService;
    private final TokenService tokenService;
    private final RefreshTokenService refreshTokenService;
    private final OneTimeTokenService oneTimeTokenService;
    private final EmailService emailService;
    private final SocialIdentityVerifier socialIdentityVerifier;
    private final UserRepository userRepository;
    private final UserTypeRepository userTypeRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserIdentityRepository userIdentityRepository;
    private final PermissionService permissionService;
    private final UserEventPublisher userEventPublisher;
    private final ProfileSchemaValidator profileSchemaValidator;
    private final OperatorSyncService operatorSyncService;

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
        sendVerificationEmailBestEffort(user);

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
        sendVerificationEmailBestEffort(user);

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

        return startSession(user);
    }

    /**
     * Revokes every live refresh-token session for the caller. This is a "log out everywhere":
     * without the refresh token in hand (the gateway only forwards the access token here) a single
     * family can't be singled out, and revoking all sessions is the safe choice. Requires an
     * authenticated caller — an expired access token can't reach this, which is fine because the
     * gateway clears its own cookies regardless.
     */
    @Transactional
    public void logout(UUID userId) {
        refreshTokenService.revokeAllForUser(userId);
    }

    // Deliberately NOT @Transactional: rotate() and revokeAllForUser() each own their transaction
    // and must commit independently of the DisabledException below (an ambient transaction here
    // would roll their writes back on that throw).
    public LoginResponse refresh(String refreshToken) {
        RefreshTokenService.Rotation rotation = refreshTokenService.rotate(refreshToken);
        User user = userRepository.findById(rotation.userId())
                .orElseThrow(() -> new InvalidTokenException("Account for this refresh token no longer exists"));

        if (LOGIN_BLOCKED_STATUSES.contains(user.getAccountStatus())) {
            // The account was blocked mid-session — kill every session, including the one we just
            // rotated into, rather than hand back a working token.
            refreshTokenService.revokeAllForUser(user.getUserId());
            throw new DisabledException("Account is " + user.getAccountStatus());
        }

        return buildSession(user, rotation.newRefreshToken());
    }

    /**
     * Passenger-only social login (Phase 4): {@code idToken} is the provider's own signed ID
     * token, already verified by {@link SocialIdentityVerifier} before this method sees it.
     * Find-or-link: an already-linked identity logs straight in; an unlinked identity whose
     * email matches an existing account links to it (passenger accounts only — staff/operator
     * emails are rejected rather than silently linked); anything else creates a brand-new
     * passenger. The provider already vouches for the email, so the new account starts verified
     * and active, with no {@code auth_credentials} row at all.
     */
    @Transactional
    public LoginResponse socialLogin(String provider, String idToken) {
        VerifiedSocialIdentity identity = socialIdentityVerifier.verify(provider.toLowerCase(), idToken);

        Optional<UserIdentity> linkedIdentity = userIdentityRepository
                .findByProviderAndProviderUserId(identity.provider(), identity.subject());
        if (linkedIdentity.isPresent()) {
            User user = userRepository.findById(linkedIdentity.get().getUserId())
                    .orElseThrow(() -> new InvalidTokenException("Account for this social identity no longer exists"));
            ensurePassengerAudience(user);
            ensureLoginAllowed(user);
            return finishSocialLogin(user);
        }

        Optional<User> existingUser = userRepository.findByEmail(identity.email());
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            ensurePassengerAudience(user);
            ensureLoginAllowed(user);
            linkSocialIdentity(user.getUserId(), identity);
            return finishSocialLogin(user);
        }

        User user = createPassengerFromSocialIdentity(identity);
        linkSocialIdentity(user.getUserId(), identity);
        return finishSocialLogin(user);
    }

    /**
     * Always returns normally, whether or not the email belongs to an account — a differing
     * response (404 vs 200) would let a caller enumerate registered emails.
     */
    @Transactional
    public void forgotPassword(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            String rawToken = oneTimeTokenService.issuePasswordResetToken(user.getUserId());
            try {
                emailService.sendPasswordResetEmail(user.getEmail(), rawToken);
            } catch (RuntimeException e) {
                // Best-effort: a transient SMTP failure shouldn't turn into a 500 that could hint
                // an account exists. The token is already issued — the user can just ask again.
                log.warn("Failed to send password reset email to {}", user.getEmail(), e);
            }
        });
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        UUID userId = oneTimeTokenService.consume(token, OneTimeTokenType.PASSWORD_RESET);
        credentialService.updatePassword(userId, newPassword);
        // A reset invalidates every existing session — force re-login everywhere.
        refreshTokenService.revokeAllForUser(userId);
    }

    @Transactional
    public void verifyEmail(String token) {
        UUID userId = oneTimeTokenService.consume(token, OneTimeTokenType.EMAIL_VERIFY);
        userRepository.findById(userId).ifPresent(user -> {
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
        // A password change invalidates every existing session — force re-login everywhere.
        refreshTokenService.revokeAllForUser(callerId);
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

    /** Opens a fresh session (new refresh-token family) for a just-authenticated user. */
    private LoginResponse startSession(User user) {
        return buildSession(user, refreshTokenService.issue(user.getUserId()));
    }

    /** Pairs a newly minted access token with an already-issued refresh token. */
    private LoginResponse buildSession(User user, String refreshToken) {
        TokenService.AccessToken accessToken = tokenService.issueAccessToken(user);
        return new LoginResponse(
                accessToken.value(),
                refreshToken,
                accessToken.expiresIn(),
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

    /** Social login is passenger-only — staff/operator/conductor accounts must use email/password. */
    private void ensurePassengerAudience(User user) {
        if (!"passenger".equals(user.getUserType().getName())) {
            throw new AccessDeniedException("Social login is only available for passenger accounts");
        }
    }

    private void linkSocialIdentity(UUID userId, VerifiedSocialIdentity identity) {
        userIdentityRepository.save(UserIdentity.builder()
                .userId(userId)
                .provider(identity.provider())
                .providerUserId(identity.subject())
                .email(identity.email())
                .build());
    }

    /**
     * The provider already vouches for this email, so the account is created active and
     * verified — there's no local password to set up and nothing to email a verification link
     * to first.
     */
    private User createPassengerFromSocialIdentity(VerifiedSocialIdentity identity) {
        UserType passengerType = userTypeRepository.findByName("passenger")
                .orElseThrow(() -> new IllegalStateException("'passenger' user type is not seeded"));

        User user = User.builder()
                .userId(UUID.randomUUID())
                .email(identity.email())
                .userType(passengerType)
                .accountStatus("active")
                .isEmailVerified(identity.emailVerified())
                .build();
        user = userRepository.save(user);

        UserProfile profile = UserProfile.builder()
                .user(user)
                .profileData(new HashMap<>())
                .build();
        userProfileRepository.save(profile);
        userEventPublisher.publishUserCreated(user);
        return user;
    }

    private LoginResponse finishSocialLogin(User user) {
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);
        return startSession(user);
    }

    /**
     * Best-effort: a signup should still succeed even if the verification email fails to send
     * (transient SMTP issue) — the user can request it again later once that lands (not built
     * yet; today a failed send just means they stay unverified until support intervenes).
     */
    private void sendVerificationEmailBestEffort(User user) {
        try {
            String rawToken = oneTimeTokenService.issueEmailVerificationToken(user.getUserId());
            emailService.sendVerificationEmail(user.getEmail(), rawToken);
        } catch (RuntimeException e) {
            log.warn("Failed to send verification email to {}", user.getEmail(), e);
        }
    }
}
