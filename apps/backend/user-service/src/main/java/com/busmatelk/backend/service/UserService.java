package com.busmatelk.backend.service;

import com.busmatelk.backend.client.SupabaseAuthClient;
import com.busmatelk.backend.dto.request.UpdateUserRequest;
import com.busmatelk.backend.dto.response.OverrideResponse;
import com.busmatelk.backend.dto.response.UserPermissionsResponse;
import com.busmatelk.backend.dto.response.UserResponse;
import com.busmatelk.backend.event.UserEventPublisher;
import com.busmatelk.backend.model.User;
import com.busmatelk.backend.model.UserProfile;
import com.busmatelk.backend.repository.UserPermissionOverrideRepository;
import com.busmatelk.backend.repository.UserProfileRepository;
import com.busmatelk.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserPermissionOverrideRepository overrideRepository;
    private final PermissionService permissionService;
    private final SupabaseAuthClient supabaseAuthClient;
    private final UserEventPublisher userEventPublisher;

    /**
     * Checks if the caller is accessing their own resource and holds the given own-scoped permission.
     */
    public boolean resolveOwnAccess(UUID callerId, UUID targetUserId, String permission) {
        return callerId.equals(targetUserId) && permissionService.hasPermission(callerId, permission);
    }

    /**
     * Throws AccessDeniedException unless the caller has user.{targetUserType}:read, or is
     * reading their own record and holds profile:read:own.
     */
    public void requireReadAccess(UUID callerId, UUID targetUserId, String targetUserType) {
        String scoped = "user." + targetUserType + ":read";
        if (permissionService.hasPermission(callerId, scoped) || resolveOwnAccess(callerId, targetUserId, "profile:read:own")) {
            return;
        }
        throw new AccessDeniedException("Permission denied: " + scoped);
    }

    /**
     * Throws AccessDeniedException unless the caller has user.{targetUserType}:update, or is
     * updating their own record and holds profile:update:own.
     */
    public void requireUpdateAccess(UUID callerId, UUID targetUserId, String targetUserType) {
        String scoped = "user." + targetUserType + ":update";
        if (permissionService.hasPermission(callerId, scoped) || resolveOwnAccess(callerId, targetUserId, "profile:update:own")) {
            return;
        }
        throw new AccessDeniedException("Permission denied: " + scoped);
    }

    public Page<UserResponse> listUsers(UUID callerId, String userType, String status, String search, Pageable pageable) {
        String permission = "user." + userType + ":read";
        if (!permissionService.hasPermission(callerId, permission)) {
            throw new AccessDeniedException("Permission denied: " + permission);
        }

        Specification<User> spec = hasUserType(userType);
        if (status != null && !status.isBlank()) {
            spec = spec.and(hasStatus(status));
        }
        if (search != null && !search.isBlank()) {
            spec = spec.and(matchesSearch(search));
        }

        return userRepository.findAll(spec, pageable).map(this::toUserResponse);
    }

    public UserResponse getUser(UUID callerId, UUID targetUserId) {
        User target = findUserOrThrow(targetUserId);
        requireReadAccess(callerId, targetUserId, target.getUserType().getName());
        return toUserResponse(target);
    }

    @Transactional
    public UserResponse updateUser(UUID callerId, UUID targetUserId, UpdateUserRequest request) {
        User target = findUserOrThrow(targetUserId);
        requireUpdateAccess(callerId, targetUserId, target.getUserType().getName());

        List<String> changedFields = new ArrayList<>();
        if (request.getFullName() != null) {
            target.setFullName(request.getFullName());
            changedFields.add("fullName");
        }
        if (request.getUsername() != null) {
            target.setUsername(request.getUsername());
            changedFields.add("username");
        }
        if (request.getPhoneNumber() != null) {
            target.setPhoneNumber(request.getPhoneNumber());
            changedFields.add("phoneNumber");
        }

        target = userRepository.save(target);
        if (!changedFields.isEmpty()) {
            userEventPublisher.publishUserUpdated(targetUserId, changedFields);
        }
        return toUserResponse(target);
    }

    @Transactional
    public void deleteUser(UUID callerId, UUID targetUserId) {
        User target = findUserOrThrow(targetUserId);
        String permission = "user." + target.getUserType().getName() + ":delete";
        if (!permissionService.hasPermission(callerId, permission)) {
            throw new AccessDeniedException("Permission denied: " + permission);
        }

        // Ban in Supabase Auth first — the security-critical step. Only flip the local
        // status once that's confirmed, so a failed ban never leaves a false "inactive"
        // record for a user who could still authenticate.
        supabaseAuthClient.banUser(target.getUserId().toString());

        target.setAccountStatus("inactive");
        userRepository.save(target);
        userEventPublisher.publishUserDeleted(targetUserId);
    }

    /**
     * Reverses deleteUser() — unbans in Supabase Auth first (the security-critical step,
     * same ordering rationale as deleteUser), then flips the local status back to active.
     * Gated on :update rather than :delete since this restores rather than removes access.
     */
    @Transactional
    public UserResponse reactivateUser(UUID callerId, UUID targetUserId) {
        User target = findUserOrThrow(targetUserId);
        requireUpdateAccess(callerId, targetUserId, target.getUserType().getName());

        supabaseAuthClient.unbanUser(target.getUserId().toString());

        target.setAccountStatus("active");
        target = userRepository.save(target);
        userEventPublisher.publishUserUpdated(targetUserId, List.of("accountStatus"));
        return toUserResponse(target);
    }

    public UserPermissionsResponse getPermissions(UUID callerId, UUID targetUserId) {
        User target = findUserOrThrow(targetUserId);
        requireReadAccess(callerId, targetUserId, target.getUserType().getName());

        List<String> effective = permissionService.getEffectivePermissions(targetUserId);
        List<OverrideResponse> overrides = overrideRepository.findByUserUserId(targetUserId).stream()
                .map(o -> new OverrideResponse(
                        o.getPermission().getName(),
                        o.getIsGranted(),
                        o.getGrantedBy() != null ? o.getGrantedBy().getUserId() : null,
                        o.getReason(),
                        o.getExpiresAt()))
                .collect(Collectors.toList());

        return new UserPermissionsResponse(effective, overrides);
    }

    private User findUserOrThrow(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));
    }

    private UserResponse toUserResponse(User user) {
        Map<String, Object> profileData = userProfileRepository.findByUserUserId(user.getUserId())
                .map(UserProfile::getProfileData)
                .orElse(null);

        return UserResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .username(user.getUsername())
                .phoneNumber(user.getPhoneNumber())
                .userType(user.getUserType().getName())
                .accountStatus(user.getAccountStatus())
                .isEmailVerified(user.getIsEmailVerified())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .profileData(profileData)
                .build();
    }

    private static Specification<User> hasUserType(String userType) {
        return (root, query, cb) -> cb.equal(root.get("userType").get("name"), userType);
    }

    private static Specification<User> hasStatus(String status) {
        return (root, query, cb) -> cb.equal(root.get("accountStatus"), status);
    }

    private static Specification<User> matchesSearch(String search) {
        String like = "%" + search.toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("email")), like),
                cb.like(cb.lower(root.get("fullName")), like));
    }
}
