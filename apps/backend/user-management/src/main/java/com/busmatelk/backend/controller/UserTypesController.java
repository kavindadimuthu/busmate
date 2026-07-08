package com.busmatelk.backend.controller;

import com.busmatelk.backend.dto.request.CreateUserTypeRequest;
import com.busmatelk.backend.dto.request.GrantPermissionRequest;
import com.busmatelk.backend.dto.request.ReplacePermissionsRequest;
import com.busmatelk.backend.dto.request.UpdateUserTypeRequest;
import com.busmatelk.backend.dto.response.TypePermissionResponse;
import com.busmatelk.backend.dto.response.UserTypeDetailResponse;
import com.busmatelk.backend.dto.response.UserTypeResponse;
import com.busmatelk.backend.security.RequiresPermission;
import com.busmatelk.backend.service.UserTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/user-types")
@RequiredArgsConstructor
public class UserTypesController {

    private final UserTypeService userTypeService;

    @GetMapping
    @RequiresPermission("user-type:manage")
    public ResponseEntity<List<UserTypeResponse>> list() {
        return ResponseEntity.ok(userTypeService.listUserTypes());
    }

    @PostMapping
    @RequiresPermission("user-type:manage")
    public ResponseEntity<UserTypeResponse> create(@RequestBody CreateUserTypeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userTypeService.createUserType(request));
    }

    @GetMapping("/{typeId}")
    @RequiresPermission("user-type:manage")
    public ResponseEntity<UserTypeDetailResponse> get(@PathVariable UUID typeId) {
        return ResponseEntity.ok(userTypeService.getUserType(typeId));
    }

    @PatchMapping("/{typeId}")
    @RequiresPermission("user-type:manage")
    public ResponseEntity<UserTypeResponse> update(@PathVariable UUID typeId, @RequestBody UpdateUserTypeRequest request) {
        return ResponseEntity.ok(userTypeService.updateUserType(typeId, request));
    }

    @DeleteMapping("/{typeId}")
    @RequiresPermission("user-type:manage")
    public ResponseEntity<Void> delete(@PathVariable UUID typeId) {
        userTypeService.deleteUserType(typeId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{typeId}/permissions")
    @RequiresPermission("user-type:manage")
    public ResponseEntity<List<TypePermissionResponse>> listPermissions(@PathVariable UUID typeId) {
        return ResponseEntity.ok(userTypeService.listTypePermissions(typeId));
    }

    @PutMapping("/{typeId}/permissions")
    @RequiresPermission("user-type:manage")
    public ResponseEntity<List<TypePermissionResponse>> replacePermissions(@PathVariable UUID typeId,
                                                                            @RequestBody ReplacePermissionsRequest request) {
        return ResponseEntity.ok(userTypeService.replacePermissions(typeId, request));
    }

    @PutMapping("/{typeId}/permissions/{permissionId}")
    @RequiresPermission("user-type:manage")
    public ResponseEntity<TypePermissionResponse> setPermission(@PathVariable UUID typeId, @PathVariable UUID permissionId,
                                                                 @RequestBody GrantPermissionRequest request) {
        return ResponseEntity.ok(userTypeService.setPermission(typeId, permissionId, request));
    }

    @DeleteMapping("/{typeId}/permissions/{permissionId}")
    @RequiresPermission("user-type:manage")
    public ResponseEntity<Void> removePermission(@PathVariable UUID typeId, @PathVariable UUID permissionId) {
        userTypeService.removePermission(typeId, permissionId);
        return ResponseEntity.noContent().build();
    }
}
