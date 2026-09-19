package com.busmatelk.telemetry.ingest.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * Mirrors {@code libs/iot-schemas/schemas/vehicle-telemetry.v1.json} (INC-023) — a snapshot of the
 * vehicle's own state. Bean Validation here, JSON Schema there; both express the same constraints
 * and are kept in sync by hand. Position is not here: it travels as a {@code location} event.
 *
 * <p>Only the fields declared below are ever kept. Anything else a device sends is dropped when the
 * request is bound, so it is never stored or forwarded — which is what keeps this contract free of
 * driver or passenger identity however a device behaves.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class VehicleTelemetryPayload {

    @Schema(description = "Whether the ignition is on")
    @NotNull
    private Boolean ignition;

    @Schema(description = "Total distance travelled, km")
    @DecimalMin("0")
    private Double odometerKm;

    @Valid
    private Engine engine;

    @Valid
    private Fuel fuel;

    @Valid
    private Electrical electrical;

    @Valid
    @Size(max = 24)
    private List<@Valid Tyre> tyres;

    @Valid
    private Cabin cabin;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Engine {
        @NotNull
        private Boolean running;
        @Min(0)
        private Integer rpm;
        @Schema(description = "0 is neutral or not engaged")
        @Min(0)
        private Integer gear;
        @DecimalMin("0") @DecimalMax("100")
        private Double loadPct;
        private Double coolantTempC;
        @DecimalMin("0")
        private Double oilPressureKpa;
        @DecimalMin("0")
        private Double hours;
        @Schema(description = "Power cut by the engine to protect itself")
        private Boolean derated;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Fuel {
        @NotNull @DecimalMin("0") @DecimalMax("100")
        private Double levelPct;
        @DecimalMin("0")
        private Double levelL;
        @Schema(description = "Current consumption, litres per hour")
        @DecimalMin("0")
        private Double rateLph;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Electrical {
        @DecimalMin("0")
        private Double batteryV;
        private Boolean charging;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Tyre {
        @Schema(description = "The unit's own wheel label; axle layouts differ between buses")
        @NotNull @Pattern(regexp = "^[A-Z0-9]{1,6}$")
        private String position;
        @DecimalMin("0")
        private Double pressureKpa;
        private Double tempC;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Cabin {
        private Boolean doorsOpen;
        @Schema(description = "Head count. A number, never identities")
        @Min(0) @Max(Integer.MAX_VALUE)
        private Integer passengers;
    }
}
