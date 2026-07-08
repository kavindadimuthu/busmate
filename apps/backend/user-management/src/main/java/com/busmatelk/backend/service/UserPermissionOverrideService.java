package com.busmatelk.backend.service;

import com.busmatelk.backend.dto.request.UpsertOverrideRequest;
import com.busmatelk.backend.dto.response.OverrideResponse;
import com.busmatelk.backend.event.UserEventPublisher;
import com.busmatelk.backend.model.Permission;
import com.busmatelk.backend.model.User;
import com.busmatelk.backend.model.UserPermissionOverride;
import com.busmatelk.backend.repository.PermissionRepository;
import com.busmatelk.backend.repository.UserPermissionOverrideRepository;
import com.busmatelk.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserPermissionOverrideService {

    private final UserPermissionOverrideRepository overrideRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;
    private final UserEventPublisher userEventPublisher;

    public List<OverrideResponse> listOverrides(UUID userId) {
        return overrideRepository.findByUserUserId(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public OverrideResponse upsertOverride(UUID userId, UUID permissionId, UpsertOverrideRequest request, UUID grantedByCallerId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));
        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new NoSuchElementException("Permission not found: " + permissionId));
        User grantedBy = userRepository.findById(grantedByCallerId).orElse(null);

        UserPermissionOverride override = overrideRepository.findByUserUserIdAndPermissionId(userId, permissionId)
                .orElse(UserPermissionOverride.builder().user(user).permission(permission).build());

        override.setIsGranted(request.getIsGranted());
        override.setReason(request.getReason());
        override.setExpiresAt(request.getExpiresAt());
        override.setGrantedBy(grantedBy);

        override = overrideRepository.save(override);
        userEventPublisher.publishPermissionChanged(userId, permission.getName(), Boolean.TRUE.equals(request.getIsGranted()));
        return toResponse(override);
    }

    @Transactional
    public void removeOverride(UUID userId, UUID permissionId) {
        overrideRepository.findByUserUserIdAndPermissionId(userId, permissionId)
                .ifPresent(overrideRepository::delete);
    }

    private OverrideResponse toResponse(UserPermissionOverride o) {
        return new OverrideResponse(
                o.getPermission().getName(),
                o.getIsGranted(),
                o.getGrantedBy() != null ? o.getGrantedBy().getUserId() : null,
                o.getReason(),
                o.getExpiresAt());
    }
}
