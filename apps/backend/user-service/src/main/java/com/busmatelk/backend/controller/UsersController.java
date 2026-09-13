package com.busmatelk.backend.controller;

import com.busmatelk.backend.dto.request.CreateUserRequest;
import com.busmatelk.backend.dto.request.UpdateUserRequest;
import com.busmatelk.backend.dto.response.RegisterResponse;
import com.busmatelk.backend.dto.response.UserPermissionsResponse;
import com.busmatelk.backend.dto.response.UserResponse;
import com.busmatelk.backend.service.AuthService;
import com.busmatelk.backend.service.ProfilePhotoService;
import com.busmatelk.backend.service.UserProfileService;
import com.busmatelk.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UsersController {

    private final UserService userService;
    private final UserProfileService userProfileService;
    private final ProfilePhotoService profilePhotoService;
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

    /**
     * The bytes are read here rather than streamed onward because every later step — the size
     * check, the format check, and the re-encode that strips metadata — needs the whole image,
     * and the upload limit is what keeps that bounded.
     *
     * <p>{@code consumes} and {@code produces} are stated explicitly on both photo endpoints
     * because they cannot be inferred: without them the published contract describes this upload
     * as JSON and the download as text, and a client generated from that description cannot call
     * either one. The wire behaviour is unchanged — only its description was wrong.
     */
    @PutMapping(value = "/{userId}/profile/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> uploadProfilePhoto(Authentication authentication, @PathVariable UUID userId,
                                                   @RequestParam("file") MultipartFile file) throws IOException {
        profilePhotoService.replacePhoto(callerId(authentication), userId, file.getBytes());
        return ResponseEntity.noContent().build();
    }

    /**
     * 404 distinguishes "this user has no photo" from a photo that failed to load, so a client
     * never has to guess whether to show a fallback.
     */
    @GetMapping(value = "/{userId}/profile/photo",
            produces = { MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE })
    public ResponseEntity<byte[]> getProfilePhoto(Authentication authentication, @PathVariable UUID userId) {
        return profilePhotoService.readPhoto(callerId(authentication), userId)
                .map(photo -> ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(photo.contentType()))
                        .body(photo.bytes()))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{userId}/permissions")
    public ResponseEntity<UserPermissionsResponse> getPermissions(Authentication authentication, @PathVariable UUID userId) {
        return ResponseEntity.ok(userService.getPermissions(callerId(authentication), userId));
    }

    private UUID callerId(Authentication authentication) {
        return UUID.fromString((String) authentication.getPrincipal());
    }
}
