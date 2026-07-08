package com.busmatelk.backend.repository;

import com.busmatelk.backend.model.UserPermissionOverride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserPermissionOverrideRepository extends JpaRepository<UserPermissionOverride, UUID> {
    List<UserPermissionOverride> findByUserUserId(UUID userId);
    Optional<UserPermissionOverride> findByUserUserIdAndPermissionName(UUID userId, String permissionName);
    Optional<UserPermissionOverride> findByUserUserIdAndPermissionId(UUID userId, UUID permissionId);
    List<UserPermissionOverride> findByPermissionId(UUID permissionId);
}
