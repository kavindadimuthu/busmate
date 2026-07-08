package com.busmatelk.backend.service;

import com.busmatelk.backend.dto.request.CreatePermissionRequest;
import com.busmatelk.backend.dto.request.UpdatePermissionRequest;
import com.busmatelk.backend.dto.response.PermissionResponse;
import com.busmatelk.backend.model.Permission;
import com.busmatelk.backend.repository.PermissionRepository;
import com.busmatelk.backend.repository.UserPermissionOverrideRepository;
import com.busmatelk.backend.repository.UserTypePermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * CRUD for permission definitions themselves — distinct from PermissionService (Phase 4),
 * which evaluates whether a user holds a given permission.
 */
@Service
@RequiredArgsConstructor
public class PermissionAdminService {

    private final PermissionRepository permissionRepository;
    private final UserTypePermissionRepository typePermissionRepository;
    private final UserPermissionOverrideRepository overrideRepository;

    public List<PermissionResponse> listPermissions(String resource, String action) {
        return permissionRepository.findAll().stream()
                .filter(p -> resource == null || resource.isBlank() || p.getResource().equals(resource))
                .filter(p -> action == null || action.isBlank() || p.getAction().equals(action))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public PermissionResponse createPermission(CreatePermissionRequest request) {
        if (permissionRepository.findByName(request.getName()).isPresent()) {
            throw new IllegalArgumentException("Permission already exists: " + request.getName());
        }

        Permission permission = Permission.builder()
                .name(request.getName())
                .resource(request.getResource())
                .action(request.getAction())
                .scope(request.getScope() != null ? request.getScope() : "any")
                .description(request.getDescription())
                .build();

        return toResponse(permissionRepository.save(permission));
    }

    public PermissionResponse getPermission(UUID permissionId) {
        return toResponse(findOrThrow(permissionId));
    }

    @Transactional
    public PermissionResponse updatePermission(UUID permissionId, UpdatePermissionRequest request) {
        Permission permission = findOrThrow(permissionId);
        if (request.getDescription() != null) {
            permission.setDescription(request.getDescription());
        }
        return toResponse(permissionRepository.save(permission));
    }

    @Transactional
    public void deletePermission(UUID permissionId) {
        Permission permission = findOrThrow(permissionId);
        if (!typePermissionRepository.findByPermissionId(permissionId).isEmpty()) {
            throw new IllegalArgumentException("Cannot delete permission assigned to a user type: " + permission.getName());
        }
        if (!overrideRepository.findByPermissionId(permissionId).isEmpty()) {
            throw new IllegalArgumentException("Cannot delete permission assigned to a user override: " + permission.getName());
        }
        permissionRepository.delete(permission);
    }

    private Permission findOrThrow(UUID permissionId) {
        return permissionRepository.findById(permissionId)
                .orElseThrow(() -> new NoSuchElementException("Permission not found: " + permissionId));
    }

    private PermissionResponse toResponse(Permission p) {
        return new PermissionResponse(p.getId(), p.getName(), p.getResource(), p.getAction(), p.getScope(), p.getDescription());
    }
}
