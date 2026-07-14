package com.busmatelk.backend.controller;

import com.busmatelk.backend.dto.request.CreatePermissionRequest;
import com.busmatelk.backend.dto.request.UpdatePermissionRequest;
import com.busmatelk.backend.dto.response.PermissionResponse;
import com.busmatelk.backend.security.RequiresPermission;
import com.busmatelk.backend.service.PermissionAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
public class PermissionsController {

    private final PermissionAdminService permissionAdminService;

    @GetMapping
    @RequiresPermission("permission:manage")
    public ResponseEntity<List<PermissionResponse>> list(@RequestParam(required = false) String resource,
                                                          @RequestParam(required = false) String action) {
        return ResponseEntity.ok(permissionAdminService.listPermissions(resource, action));
    }

    @PostMapping
    @RequiresPermission("permission:manage")
    public ResponseEntity<PermissionResponse> create(@RequestBody CreatePermissionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(permissionAdminService.createPermission(request));
    }

    @GetMapping("/{permissionId}")
    @RequiresPermission("permission:manage")
    public ResponseEntity<PermissionResponse> get(@PathVariable UUID permissionId) {
        return ResponseEntity.ok(permissionAdminService.getPermission(permissionId));
    }

    @PatchMapping("/{permissionId}")
    @RequiresPermission("permission:manage")
    public ResponseEntity<PermissionResponse> update(@PathVariable UUID permissionId, @RequestBody UpdatePermissionRequest request) {
        return ResponseEntity.ok(permissionAdminService.updatePermission(permissionId, request));
    }

    @DeleteMapping("/{permissionId}")
    @RequiresPermission("permission:manage")
    public ResponseEntity<Void> delete(@PathVariable UUID permissionId) {
        permissionAdminService.deletePermission(permissionId);
        return ResponseEntity.noContent().build();
    }
}
