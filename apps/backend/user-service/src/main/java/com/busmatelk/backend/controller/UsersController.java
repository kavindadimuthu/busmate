package com.busmatelk.backend.controller;

import com.busmatelk.backend.dto.request.CreateUserRequest;
import com.busmatelk.backend.dto.request.UpdateUserRequest;
import com.busmatelk.backend.dto.response.RegisterResponse;
import com.busmatelk.backend.dto.response.UserPermissionsResponse;
import com.busmatelk.backend.dto.response.UserResponse;
import com.busmatelk.backend.service.AuthService;
import com.busmatelk.backend.service.UserProfileService;
import com.busmatelk.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UsersController {

    private final UserService userService;
    private final UserProfileService userProfileService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<Page<UserResponse>> listUsers(
            Authentication authentication,
            @RequestParam("user_type") String userType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        Page<UserResponse> result = userService.listUsers(callerId(authentication), userType, status, search, pageable);
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<RegisterResponse> createUser(Authentication authentication, @RequestBody CreateUserRequest request) {
        RegisterResponse created = authService.createUser(request, callerId(authentication));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUser(Authentication authentication, @PathVariable UUID userId) {
        return ResponseEntity.ok(userService.getUser(callerId(authentication), userId));
    }

    @PatchMapping("/{userId}")
    public ResponseEntity<UserResponse> updateUser(Authentication authentication, @PathVariable UUID userId,
                                                    @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(callerId(authentication), userId, request));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(Authentication authentication, @PathVariable UUID userId) {
        userService.deleteUser(callerId(authentication), userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{userId}/suspend")
    public ResponseEntity<UserResponse> suspendUser(Authentication authentication, @PathVariable UUID userId) {
        return ResponseEntity.ok(userService.suspendUser(callerId(authentication), userId));
    }

    @PostMapping("/{userId}/deactivate")
    public ResponseEntity<UserResponse> deactivateUser(Authentication authentication, @PathVariable UUID userId) {
        return ResponseEntity.ok(userService.deactivateUser(callerId(authentication), userId));
    }

    @PostMapping("/{userId}/reactivate")
    public ResponseEntity<UserResponse> reactivateUser(Authentication authentication, @PathVariable UUID userId) {
        return ResponseEntity.ok(userService.reactivateUser(callerId(authentication), userId));
    }

    /** Manual "retry sync" action — resets any FAILED core-service sync for this operator to PENDING. */
    @PostMapping("/{userId}/operator-sync/retry")
    public ResponseEntity<Void> retryOperatorSync(Authentication authentication, @PathVariable UUID userId) {
        userService.retryOperatorSync(callerId(authentication), userId);
        return ResponseEntity.accepted().build();
    }

    @GetMapping("/{userId}/profile")
    public ResponseEntity<Map<String, Object>> getProfile(Authentication authentication, @PathVariable UUID userId) {
        return ResponseEntity.ok(userProfileService.getProfile(callerId(authentication), userId));
    }

    @PatchMapping("/{userId}/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(Authentication authentication, @PathVariable UUID userId,
                                                               @RequestBody Map<String, Object> patch) {
        return ResponseEntity.ok(userProfileService.updateProfile(callerId(authentication), userId, patch));
    }

    @GetMapping("/{userId}/permissions")
    public ResponseEntity<UserPermissionsResponse> getPermissions(Authentication authentication, @PathVariable UUID userId) {
        return ResponseEntity.ok(userService.getPermissions(callerId(authentication), userId));
    }

    private UUID callerId(Authentication authentication) {
        return UUID.fromString((String) authentication.getPrincipal());
    }
}
