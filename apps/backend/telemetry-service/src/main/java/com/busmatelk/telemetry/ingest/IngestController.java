package com.busmatelk.telemetry.ingest;

import com.busmatelk.telemetry.ingest.dto.DeviceStatusIngestRequest;
import com.busmatelk.telemetry.ingest.dto.IngestAcceptedResponse;
import com.busmatelk.telemetry.ingest.dto.LocationIngestRequest;
import com.busmatelk.telemetry.ingest.security.DeviceTokenAuthenticationFilter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Device telemetry ingestion (IoT Platform Layer plan, Phase 2). Authenticated by a device's own
 * bearer token (see {@link DeviceTokenAuthenticationFilter}), not staff auth — routed through the
 * API gateway with {@code requiresAuth: false} since the gateway's staff-JWT check doesn't apply
 * here. {@code deviceId} arrives via a request attribute the auth filter sets after validating the
 * token, never trusted from the request body.
 */
@RestController
@RequestMapping("/ingest/v1")
@RequiredArgsConstructor
@Tag(name = "Ingest", description = "Device telemetry ingestion — device-token authenticated, not staff JWT")
@SecurityRequirement(name = "deviceToken")
public class IngestController {

    private final IngestService ingestService;

    @Operation(summary = "Report a GPS fix")
    @PostMapping("/location")
    public ResponseEntity<IngestAcceptedResponse> location(
            @RequestAttribute(DeviceTokenAuthenticationFilter.DEVICE_ID_ATTRIBUTE) UUID deviceId,
            @Valid @RequestBody LocationIngestRequest request) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ingestService.ingestLocation(deviceId, request));
    }

    @Operation(summary = "Report a device status transition")
    @PostMapping("/device-status")
    public ResponseEntity<IngestAcceptedResponse> deviceStatus(
            @RequestAttribute(DeviceTokenAuthenticationFilter.DEVICE_ID_ATTRIBUTE) UUID deviceId,
            @Valid @RequestBody DeviceStatusIngestRequest request) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ingestService.ingestDeviceStatus(deviceId, request));
    }
}
