package com.busmatelk.telemetry.device.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceRegisteredResponse {

    private DeviceResponse device;

    @Schema(description = "The device's ingest token — shown ONCE at registration/rotation. Only its hash is stored; it cannot be recovered later.")
    private String token;
}
