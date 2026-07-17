package com.busmatelk.telemetry.ingest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Mirrors {@code libs/iot-schemas/schemas/location.v1.json} — a single GPS fix. Kept in sync by
 * hand (Bean Validation here, JSON Schema there); both express the same constraints.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationPayload {

    @Schema(description = "Latitude in decimal degrees (WGS84)", example = "6.9271")
    @NotNull
    @DecimalMin("-90")
    @DecimalMax("90")
    private Double lat;

    @Schema(description = "Longitude in decimal degrees (WGS84)", example = "79.8612")
    @NotNull
    @DecimalMin("-180")
    @DecimalMax("180")
    private Double lng;

    @Schema(description = "Ground speed in km/h, if reported")
    @DecimalMin("0")
    private Double speedKmh;

    @Schema(description = "Heading in degrees clockwise from true north [0, 360)")
    @DecimalMin("0")
    @DecimalMax("359.999999")
    private Double headingDeg;

    @Schema(description = "Horizontal accuracy radius in metres, if reported")
    @DecimalMin("0")
    private Double accuracyM;
}
