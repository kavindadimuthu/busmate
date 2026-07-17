package com.busmatelk.telemetry.device.controller;

import com.busmatelk.telemetry.device.dto.AssignDeviceRequest;
import com.busmatelk.telemetry.device.dto.DeviceAssignmentResponse;
import com.busmatelk.telemetry.device.dto.DeviceRegisteredResponse;
import com.busmatelk.telemetry.device.dto.DeviceResponse;
import com.busmatelk.telemetry.device.dto.RegisterDeviceRequest;
import com.busmatelk.telemetry.device.service.DeviceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Device registry admin API (IoT Platform Layer plan, Phase 1). Reached through the API gateway
 * (/api/devices), staff-only: ADMIN and MOT manage the physical fleet's devices, mirroring how
 * fleet resources are guarded in core-service (per-method @PreAuthorize, not class-level — so the
 * HTTP-layer authenticated() rule in SecurityConfig is what rejects anonymous callers with 401,
 * consistent with the other services' controllers).
 */
@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
@Tag(name = "Devices", description = "IoT device registry: provisioning, credentials, bus assignment")
public class DeviceController {

    private final DeviceService deviceService;

    @Operation(summary = "Register a device", description = "Creates the device and returns its ingest token — shown once, only the hash is stored.")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @PostMapping
    public ResponseEntity<DeviceRegisteredResponse> register(@Valid @RequestBody RegisterDeviceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(deviceService.register(request));
    }

    @Operation(summary = "Self-provision (or re-provision) the caller's own conductor-app device",
            description = "IoT Platform Layer plan, Phase 4 — closes Phase 2's shared-credential " +
                    "simplification. Called by conductor-mobile itself (staff JWT, role CONDUCTOR), " +
                    "not by MOT/admin staff. Idempotent per user: returns a freshly-rotated token " +
                    "for the caller's existing device, or creates one on first call.")
    @PreAuthorize("hasRole('CONDUCTOR')")
    @PostMapping("/provision-conductor")
    public DeviceRegisteredResponse provisionConductor(@RequestHeader("x-user-id") UUID ownerUserId) {
        return deviceService.provisionForConductor(ownerUserId);
    }

    @Operation(summary = "List devices with their current bus assignment")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @GetMapping
    public List<DeviceResponse> list() {
        return deviceService.list();
    }

    @Operation(summary = "Get one device")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @GetMapping("/{id}")
    public DeviceResponse get(@PathVariable UUID id) {
        return deviceService.get(id);
    }

    @Operation(summary = "Rotate the device's ingest token", description = "Revokes all active credentials and returns a fresh token — shown once.")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @PostMapping("/{id}/rotate-token")
    public DeviceRegisteredResponse rotateToken(@PathVariable UUID id) {
        return deviceService.rotateToken(id);
    }

    @Operation(summary = "Disable a device", description = "Revokes credentials; ingest rejects the device until it is re-enabled and a new token issued.")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @PostMapping("/{id}/disable")
    public DeviceResponse disable(@PathVariable UUID id) {
        return deviceService.disable(id);
    }

    @Operation(summary = "Re-enable a disabled device")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @PostMapping("/{id}/enable")
    public DeviceResponse enable(@PathVariable UUID id) {
        return deviceService.enable(id);
    }

    @Operation(summary = "Assign the device to a bus")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @PostMapping("/{id}/assignment")
    public ResponseEntity<DeviceAssignmentResponse> assign(@PathVariable UUID id,
                                                           @Valid @RequestBody AssignDeviceRequest request,
                                                           Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : null;
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(deviceService.assign(id, request.getBusId(), actor));
    }

    @Operation(summary = "End the device's current bus assignment")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @DeleteMapping("/{id}/assignment")
    public DeviceAssignmentResponse unassign(@PathVariable UUID id) {
        return deviceService.unassign(id);
    }

    @Operation(summary = "Assignment history (newest first)")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @GetMapping("/{id}/assignments")
    public List<DeviceAssignmentResponse> assignmentHistory(@PathVariable UUID id) {
        return deviceService.assignmentHistory(id);
    }
}
