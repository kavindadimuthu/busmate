package com.busmatelk.backend.service;

import com.busmatelk.backend.model.Permission;
import com.busmatelk.backend.model.User;
import com.busmatelk.backend.model.UserPermissionOverride;
import com.busmatelk.backend.model.UserType;
import com.busmatelk.backend.model.UserTypePermission;
import com.busmatelk.backend.repository.UserPermissionOverrideRepository;
import com.busmatelk.backend.repository.UserRepository;
import com.busmatelk.backend.repository.UserTypePermissionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PermissionServiceTest {

    @Mock
    private UserPermissionOverrideRepository overrideRepo;
    @Mock
    private UserTypePermissionRepository typePermRepo;
    @Mock
    private UserRepository userRepo;

    private PermissionService permissionService;

    private final UUID userId = UUID.randomUUID();
    private final UUID userTypeId = UUID.randomUUID();
    private static final String PERMISSION = "user.conductor:create";

    @BeforeEach
    void setUp() {
        permissionService = new PermissionService(overrideRepo, typePermRepo, userRepo);
    }

    private User userWithType(UUID typeId) {
        UserType userType = UserType.builder().id(typeId).name("operator").build();
        return User.builder().userId(userId).userType(userType).build();
    }

    private Permission permission(String name) {
        return Permission.builder().id(UUID.randomUUID()).name(name).build();
    }

    private UserTypePermission typePermission(UUID typeId, String permName, boolean granted) {
        return UserTypePermission.builder()
                .userType(UserType.builder().id(typeId).build())
                .permission(permission(permName))
                .isGranted(granted)
                .build();
    }

    private UserPermissionOverride override(boolean granted, Instant expiresAt) {
        return UserPermissionOverride.builder()
                .permission(permission(PERMISSION))
                .isGranted(granted)
                .expiresAt(expiresAt)
                .build();
    }

    @Test
    void individualOverrideGrantOverridesTypeDeny() {
        when(overrideRepo.findByUserUserIdAndPermissionName(userId, PERMISSION))
                .thenReturn(Optional.of(override(true, null)));

        // Note: typePermRepo is never stubbed here — the override short-circuits before
        // the type-level lookup would even happen, which is itself part of what's being verified.
        assertThat(permissionService.hasPermission(userId, PERMISSION)).isTrue();
    }

    @Test
    void individualOverrideDenyOverridesTypeGrant() {
        when(overrideRepo.findByUserUserIdAndPermissionName(userId, PERMISSION))
                .thenReturn(Optional.of(override(false, null)));

        assertThat(permissionService.hasPermission(userId, PERMISSION)).isFalse();
    }

    @Test
    void expiredOverrideFallsBackToTypePermission() {
        when(overrideRepo.findByUserUserIdAndPermissionName(userId, PERMISSION))
                .thenReturn(Optional.of(override(false, Instant.now().minus(1, ChronoUnit.DAYS))));
        when(userRepo.findById(userId)).thenReturn(Optional.of(userWithType(userTypeId)));
        when(typePermRepo.findByUserTypeIdAndPermissionName(userTypeId, PERMISSION))
                .thenReturn(Optional.of(typePermission(userTypeId, PERMISSION, true)));

        assertThat(permissionService.hasPermission(userId, PERMISSION)).isTrue();
    }

    @Test
    void typePermissionGrantReturnsTrue() {
        when(overrideRepo.findByUserUserIdAndPermissionName(userId, PERMISSION))
                .thenReturn(Optional.empty());
        when(userRepo.findById(userId)).thenReturn(Optional.of(userWithType(userTypeId)));
        when(typePermRepo.findByUserTypeIdAndPermissionName(userTypeId, PERMISSION))
                .thenReturn(Optional.of(typePermission(userTypeId, PERMISSION, true)));

        assertThat(permissionService.hasPermission(userId, PERMISSION)).isTrue();
    }

    @Test
    void noTypePermissionReturnsFalse() {
        when(overrideRepo.findByUserUserIdAndPermissionName(userId, PERMISSION))
                .thenReturn(Optional.empty());
        when(userRepo.findById(userId)).thenReturn(Optional.of(userWithType(userTypeId)));
        when(typePermRepo.findByUserTypeIdAndPermissionName(userTypeId, PERMISSION))
                .thenReturn(Optional.empty());

        assertThat(permissionService.hasPermission(userId, PERMISSION)).isFalse();
    }

    @Test
    void adminUserHasAllPermissions() {
        // Represents Phase 2's seed-data intent (admin is granted every permission at the
        // type level) against a representative sample, since this is a pure unit test with
        // mocked repositories — exhaustively iterating the real 28-row seed set against real
        // data is PermissionMatrixTest's job.
        UUID adminTypeId = UUID.randomUUID();
        User admin = User.builder().userId(userId)
                .userType(UserType.builder().id(adminTypeId).name("admin").build())
                .build();
        when(userRepo.findById(userId)).thenReturn(Optional.of(admin));
        when(overrideRepo.findByUserUserIdAndPermissionName(eq(userId), anyString()))
                .thenReturn(Optional.empty());

        List<String> samplePermissions = List.of(
                "user.admin:delete", "user-type:manage", "permission:manage",
                "user.passenger:create", "profile:read:own");

        for (String permName : samplePermissions) {
            when(typePermRepo.findByUserTypeIdAndPermissionName(adminTypeId, permName))
                    .thenReturn(Optional.of(typePermission(adminTypeId, permName, true)));
            assertThat(permissionService.hasPermission(userId, permName))
                    .as("admin should have %s", permName)
                    .isTrue();
        }
    }
}
