package com.busmatelk.telemetry.device.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignDeviceRequest {

    @Schema(description = "core-service bus id the device is being installed in", example = "00000000-0000-0000-0000-000000010301")
    @NotNull
    private UUID busId;
}
