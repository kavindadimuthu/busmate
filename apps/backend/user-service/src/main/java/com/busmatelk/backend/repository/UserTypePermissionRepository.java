package com.busmatelk.backend.repository;

import com.busmatelk.backend.model.UserTypePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserTypePermissionRepository extends JpaRepository<UserTypePermission, UUID> {
    List<UserTypePermission> findByUserTypeId(UUID userTypeId);
    Optional<UserTypePermission> findByUserTypeIdAndPermissionName(UUID userTypeId, String permissionName);
    List<UserTypePermission> findByPermissionId(UUID permissionId);
}
