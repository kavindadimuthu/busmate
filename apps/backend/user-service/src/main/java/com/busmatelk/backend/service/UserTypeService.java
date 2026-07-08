package com.busmatelk.backend.service;

import com.busmatelk.backend.dto.request.CreateUserTypeRequest;
import com.busmatelk.backend.dto.request.GrantPermissionRequest;
import com.busmatelk.backend.dto.request.ReplacePermissionsRequest;
import com.busmatelk.backend.dto.request.UpdateUserTypeRequest;
import com.busmatelk.backend.dto.response.TypePermissionResponse;
import com.busmatelk.backend.dto.response.UserTypeDetailResponse;
import com.busmatelk.backend.dto.response.UserTypeResponse;
import com.busmatelk.backend.event.UserEventPublisher;
import com.busmatelk.backend.model.Permission;
import com.busmatelk.backend.model.UserType;
import com.busmatelk.backend.model.UserTypePermission;
import com.busmatelk.backend.repository.PermissionRepository;
import com.busmatelk.backend.repository.UserRepository;
import com.busmatelk.backend.repository.UserTypePermissionRepository;
import com.busmatelk.backend.repository.UserTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserTypeService {

    private static final List<String> AUTO_SEEDED_PERMISSIONS = List.of("profile:read:own", "profile:update:own");

    private final UserTypeRepository userTypeRepository;
    private final PermissionRepository permissionRepository;
    private final UserTypePermissionRepository typePermissionRepository;
    private final UserRepository userRepository;
    private final UserEventPublisher userEventPublisher;

    public List<UserTypeResponse> listUserTypes() {
        return userTypeRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserTypeResponse createUserType(CreateUserTypeRequest request) {
        if (userTypeRepository.findByName(request.getName()).isPresent()) {
            throw new IllegalArgumentException("User type already exists: " + request.getName());
        }

        UserType userType = UserType.builder()
                .name(request.getName())
                .displayName(request.getDisplayName())
                .description(request.getDescription())
                .isSystem(false)
                .isActive(true)
                .build();
        userType = userTypeRepository.save(userType);

        for (String permissionName : AUTO_SEEDED_PERMISSIONS) {
            Permission permission = permissionRepository.findByName(permissionName)
                    .orElseThrow(() -> new IllegalStateException("Missing seeded permission: " + permissionName));
            UserTypePermission utp = UserTypePermission.builder()
                    .userType(userType)
                    .permission(permission)
                    .isGranted(true)
                    .build();
            typePermissionRepository.save(utp);
            userEventPublisher.publishTypePermissionChanged(userType.getId(), permissionName, true);
        }

        return toResponse(userType);
    }

    public UserTypeDetailResponse getUserType(UUID typeId) {
        UserType userType = findOrThrow(typeId);
        List<TypePermissionResponse> permissions = typePermissionRepository.findByUserTypeId(typeId).stream()
                .map(this::toTypePermissionResponse)
                .collect(Collectors.toList());
        return new UserTypeDetailResponse(userType.getId(), userType.getName(), userType.getDisplayName(),
                userType.getDescription(), userType.getIsSystem(), userType.getIsActive(), permissions);
    }

    @Transactional
    public UserTypeResponse updateUserType(UUID typeId, UpdateUserTypeRequest request) {
        UserType userType = findOrThrow(typeId);
        if (request.getDisplayName() != null) {
            userType.setDisplayName(request.getDisplayName());
        }
        if (request.getDescription() != null) {
            userType.setDescription(request.getDescription());
        }
        if (request.getIsActive() != null) {
            userType.setIsActive(request.getIsActive());
        }
        userType = userTypeRepository.save(userType);
        return toResponse(userType);
    }

    @Transactional
    public void deleteUserType(UUID typeId) {
        UserType userType = findOrThrow(typeId);
        if (Boolean.TRUE.equals(userType.getIsSystem())) {
            throw new IllegalArgumentException("Cannot delete a system user type: " + userType.getName());
        }
        if (!userRepository.findByUserTypeId(typeId).isEmpty()) {
            throw new IllegalArgumentException("Cannot delete user type with existing users: " + userType.getName());
        }
        userTypeRepository.delete(userType);
    }

    public List<TypePermissionResponse> listTypePermissions(UUID typeId) {
        findOrThrow(typeId);
        return typePermissionRepository.findByUserTypeId(typeId).stream()
                .map(this::toTypePermissionResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<TypePermissionResponse> replacePermissions(UUID typeId, ReplacePermissionsRequest request) {
        UserType userType = findOrThrow(typeId);

        typePermissionRepository.deleteAll(typePermissionRepository.findByUserTypeId(typeId));

        List<TypePermissionResponse> result = new ArrayList<>();
        for (String permissionName : request.getPermissionNames()) {
            Permission permission = permissionRepository.findByName(permissionName)
                    .orElseThrow(() -> new NoSuchElementException("Permission not found: " + permissionName));
            UserTypePermission utp = UserTypePermission.builder()
                    .userType(userType)
                    .permission(permission)
                    .isGranted(true)
                    .build();
            result.add(toTypePermissionResponse(typePermissionRepository.save(utp)));
            userEventPublisher.publishTypePermissionChanged(typeId, permissionName, true);
        }
        return result;
    }

    @Transactional
    public TypePermissionResponse setPermission(UUID typeId, UUID permissionId, GrantPermissionRequest request) {
        UserType userType = findOrThrow(typeId);
        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new NoSuchElementException("Permission not found: " + permissionId));

        UserTypePermission utp = typePermissionRepository.findByUserTypeIdAndPermissionName(typeId, permission.getName())
                .orElse(UserTypePermission.builder().userType(userType).permission(permission).build());
        utp.setIsGranted(request.getIsGranted());

        TypePermissionResponse response = toTypePermissionResponse(typePermissionRepository.save(utp));
        userEventPublisher.publishTypePermissionChanged(typeId, permission.getName(), Boolean.TRUE.equals(request.getIsGranted()));
        return response;
    }

    @Transactional
    public void removePermission(UUID typeId, UUID permissionId) {
        findOrThrow(typeId);
        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new NoSuchElementException("Permission not found: " + permissionId));
        typePermissionRepository.findByUserTypeIdAndPermissionName(typeId, permission.getName())
                .ifPresent(typePermissionRepository::delete);
    }

    private UserType findOrThrow(UUID typeId) {
        return userTypeRepository.findById(typeId)
                .orElseThrow(() -> new NoSuchElementException("User type not found: " + typeId));
    }

    private UserTypeResponse toResponse(UserType userType) {
        long count = typePermissionRepository.findByUserTypeId(userType.getId()).size();
        return new UserTypeResponse(userType.getId(), userType.getName(), userType.getDisplayName(),
                userType.getDescription(), userType.getIsSystem(), userType.getIsActive(), count);
    }

    private TypePermissionResponse toTypePermissionResponse(UserTypePermission utp) {
        Permission p = utp.getPermission();
        return new TypePermissionResponse(p.getId(), p.getName(), p.getResource(), p.getAction(), p.getScope(), utp.getIsGranted());
    }
}
