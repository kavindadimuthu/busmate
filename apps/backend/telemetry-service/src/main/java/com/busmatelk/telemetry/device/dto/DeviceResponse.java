package com.busmatelk.telemetry.device.dto;

import com.busmatelk.telemetry.device.entity.Device;
import com.busmatelk.telemetry.device.entity.DeviceAssignment;
import com.busmatelk.telemetry.device.entity.DeviceStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceResponse {

    private UUID id;
    private String serialNumber;
    private String deviceTypeCode;
    private String label;
    private DeviceStatus status;
    private Instant lastSeenAt;

    @Schema(description = "Set when FleetHealthMonitorJob (Phase 3) has flagged this device silent; null if healthy")
    private Instant silenceFlaggedAt;

    @Schema(description = "Bus this device is currently assigned to (core-service bus id), or null")
    private UUID currentBusId;

    @Schema(description = "When the current assignment began, or null if unassigned")
    private Instant assignedAt;

    private Instant createdAt;
    private Instant updatedAt;

    public static DeviceResponse of(Device device, DeviceAssignment currentAssignment) {
        return DeviceResponse.builder()
                .id(device.getId())
                .serialNumber(device.getSerialNumber())
                .deviceTypeCode(device.getDeviceTypeCode())
                .label(device.getLabel())
                .status(device.getStatus())
                .lastSeenAt(device.getLastSeenAt())
                .silenceFlaggedAt(device.getSilenceFlaggedAt())
                .currentBusId(currentAssignment != null ? currentAssignment.getBusId() : null)
                .assignedAt(currentAssignment != null ? currentAssignment.getAssignedAt() : null)
                .createdAt(device.getCreatedAt())
                .updatedAt(device.getUpdatedAt())
                .build();
    }
}
