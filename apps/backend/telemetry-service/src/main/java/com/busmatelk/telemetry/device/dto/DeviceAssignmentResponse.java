package com.busmatelk.telemetry.device.dto;

import com.busmatelk.telemetry.device.entity.DeviceAssignment;
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
public class DeviceAssignmentResponse {

    private UUID id;
    private UUID deviceId;
    private UUID busId;
    private Instant assignedAt;
    private Instant unassignedAt;
    private String createdBy;

    public static DeviceAssignmentResponse of(DeviceAssignment a) {
        return DeviceAssignmentResponse.builder()
                .id(a.getId())
                .deviceId(a.getDeviceId())
                .busId(a.getBusId())
                .assignedAt(a.getAssignedAt())
                .unassignedAt(a.getUnassignedAt())
                .createdBy(a.getCreatedBy())
                .build();
    }
}
