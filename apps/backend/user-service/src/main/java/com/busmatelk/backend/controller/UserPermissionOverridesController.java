package com.busmatelk.backend.controller;

import com.busmatelk.backend.dto.request.UpsertOverrideRequest;
import com.busmatelk.backend.dto.response.OverrideResponse;
import com.busmatelk.backend.security.RequiresPermission;
import com.busmatelk.backend.service.UserPermissionOverrideService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users/{userId}/permission-overrides")
@RequiredArgsConstructor
public class UserPermissionOverridesController {

    private final UserPermissionOverrideService overrideService;

    @GetMapping
    @RequiresPermission("permission:manage")
    public ResponseEntity<List<OverrideResponse>> list(@PathVariable UUID userId) {
        return ResponseEntity.ok(overrideService.listOverrides(userId));
    }

    @PutMapping("/{permissionId}")
    @RequiresPermission("permission:manage")
    public ResponseEntity<OverrideResponse> upsert(Authentication authentication,
                                                    @PathVariable UUID userId,
                                                    @PathVariable UUID permissionId,
                                                    @RequestBody UpsertOverrideRequest request) {
        UUID callerId = UUID.fromString((String) authentication.getPrincipal());
        return ResponseEntity.ok(overrideService.upsertOverride(userId, permissionId, request, callerId));
    }

    @DeleteMapping("/{permissionId}")
    @RequiresPermission("permission:manage")
    public ResponseEntity<Void> remove(@PathVariable UUID userId, @PathVariable UUID permissionId) {
        overrideService.removeOverride(userId, permissionId);
        return ResponseEntity.noContent().build();
    }
}
