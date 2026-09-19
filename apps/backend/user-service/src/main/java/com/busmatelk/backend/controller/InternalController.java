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
    private final com.busmatelk.backend.repository.UserRepository userRepository;
    private final com.busmatelk.backend.operator.OperatorScope operatorScope;

    /**
     * A conductor account as core-service needs it to check a trip or default-bus assignment
     * (INC-019/020): which operator they work for and whether the account can still work.
     * 404 when the id is not a conductor.
     */
    @GetMapping("/conductors/{userId}")
    public ResponseEntity<Map<String, Object>> getConductor(@PathVariable UUID userId) {
        return userRepository.findById(userId)
                .filter(u -> com.busmatelk.backend.operator.OperatorScope.CONDUCTOR.equals(u.getUserType().getName()))
                .map(u -> {
                    Map<String, Object> body = new java.util.HashMap<>();
                    body.put("userId", u.getUserId());
                    body.put("fullName", u.getFullName());
                    body.put("accountStatus", u.getAccountStatus());
                    body.put("operatorId", operatorScope.linkedOperatorOf(u.getUserId()));
                    return ResponseEntity.ok(body);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

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
