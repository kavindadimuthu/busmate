package com.busmatelk.backend.service;

import com.busmatelk.backend.model.User;
import com.busmatelk.backend.model.UserPermissionOverride;
import com.busmatelk.backend.model.UserTypePermission;
import com.busmatelk.backend.repository.UserPermissionOverrideRepository;
import com.busmatelk.backend.repository.UserRepository;
import com.busmatelk.backend.repository.UserTypePermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final UserPermissionOverrideRepository overrideRepo;
    private final UserTypePermissionRepository typePermRepo;
    private final UserRepository userRepo;

    /**
     * Resolves whether a user has a given permission.
     * Priority: individual override > type default > implicit deny
     */
    public boolean hasPermission(UUID userId, String permissionName) {
        // 1. Check for individual override
        Optional<UserPermissionOverride> override = overrideRepo
            .findByUserUserIdAndPermissionName(userId, permissionName);

        if (override.isPresent()) {
            UserPermissionOverride o = override.get();
            // Check if override has expired
            if (o.getExpiresAt() != null && o.getExpiresAt().isBefore(Instant.now())) {
                // Expired override — fall through to type default
            } else {
                return o.getIsGranted();
            }
        }

        // 2. Check type-level permission
        User user = userRepo.findById(userId).orElseThrow();
        Optional<UserTypePermission> typePermission = typePermRepo
            .findByUserTypeIdAndPermissionName(user.getUserType().getId(), permissionName);

        return typePermission.map(UserTypePermission::getIsGranted).orElse(false);
    }

    /**
     * Returns the full list of effective permissions for a user.
     * Used by GET /auth/me and GET /users/{id}/permissions
     */
    public List<String> getEffectivePermissions(UUID userId) {
        User user = userRepo.findById(userId).orElseThrow();
        UUID userTypeId = user.getUserType().getId();

        // Get all type permissions
        Map<String, Boolean> effectiveMap = new HashMap<>();
        typePermRepo.findByUserTypeId(userTypeId)
            .forEach(tp -> effectiveMap.put(tp.getPermission().getName(), tp.getIsGranted()));

        // Apply individual overrides (override type defaults)
        overrideRepo.findByUserUserId(userId).forEach(override -> {
            if (override.getExpiresAt() == null || override.getExpiresAt().isAfter(Instant.now())) {
                effectiveMap.put(override.getPermission().getName(), override.getIsGranted());
            }
        });

        return effectiveMap.entrySet().stream()
            .filter(Map.Entry::getValue)
            .map(Map.Entry::getKey)
            .collect(Collectors.toList());
    }
}
