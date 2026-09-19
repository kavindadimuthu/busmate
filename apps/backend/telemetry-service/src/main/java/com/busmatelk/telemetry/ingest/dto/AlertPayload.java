package com.busmatelk.telemetry.ingest.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Mirrors {@code libs/iot-schemas/schemas/alert.v1.json} (INC-023). The device owns its alerts: a
 * raised alert stays active until the device sends {@code cleared} for the same code and component.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AlertPayload {

    public static final String RAISED = "raised";
    public static final String CLEARED = "cleared";

    @Schema(description = "Stable machine-readable condition", example = "TYRE_PRESSURE_LOW")
    @NotBlank @Pattern(regexp = "^[A-Z][A-Z0-9_]{1,39}$")
    private String code;

    @Schema(allowableValues = {"raised", "cleared"})
    @NotBlank @Pattern(regexp = "^(raised|cleared)$")
    private String state;

    @Schema(allowableValues = {"info", "warning", "critical"})
    @NotBlank @Pattern(regexp = "^(info|warning|critical)$")
    private String severity;

    @Schema(description = "Which part the condition concerns when a code can apply to several, e.g. a tyre position")
    @Pattern(regexp = "^[A-Z0-9]{1,6}$")
    private String component;

    @Size(max = 200)
    private String message;
}
