package com.busmatelk.telemetry.device.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
public class RegisterDeviceRequest {

    @Schema(description = "Unique hardware serial / installation identifier", example = "GPS-2026-00042")
    @NotBlank
    @Size(max = 120)
    private String serialNumber;

    @Schema(description = "Device type code from the device_type reference data", example = "GPS_TRACKER")
    @NotBlank
    @Size(max = 40)
    private String deviceTypeCode;

    @Schema(description = "Optional human-friendly label", example = "Tracker – WP CAA-4521 dashboard")
    @Size(max = 160)
    private String label;
}
