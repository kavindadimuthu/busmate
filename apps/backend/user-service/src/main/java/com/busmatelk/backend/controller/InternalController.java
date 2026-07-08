package com.busmatelk.backend.controller;

import com.busmatelk.backend.dto.request.CheckPermissionRequest;
import com.busmatelk.backend.dto.request.ValidateTokenRequest;
import com.busmatelk.backend.dto.response.InternalUserResponse;
import com.busmatelk.backend.service.InternalService;
import com.busmatelk.backend.service.PermissionResolution;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
public class InternalController {

    private final InternalService internalService;

    @GetMapping("/users/{userId}")
    public ResponseEntity<InternalUserResponse> getUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(internalService.getUser(userId));
    }

    @PostMapping("/auth/check-permission")
    public ResponseEntity<Map<String, Object>> checkPermission(@RequestBody CheckPermissionRequest request) {
        PermissionResolution resolution = internalService.checkPermission(
                UUID.fromString(request.getUserId()), request.getPermission());
        return ResponseEntity.ok(Map.of("data", Map.of(
                "granted", resolution.granted(),
                "source", resolution.source())));
    }

    @PostMapping("/auth/validate")
    public ResponseEntity<InternalUserResponse> validate(@RequestBody ValidateTokenRequest request) {
        return ResponseEntity.ok(internalService.validateToken(request.getToken()));
    }
}
