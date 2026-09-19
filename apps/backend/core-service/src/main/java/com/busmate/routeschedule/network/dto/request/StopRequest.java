package com.busmate.routeschedule.network.dto.request;

import com.busmate.routeschedule.shared.provenance.SourceTier;
import jakarta.validation.constraints.Size;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import com.busmate.routeschedule.shared.dto.LocationDto;

@Data
public class StopRequest {
    /** Optional source of this record; defaults to field observation by BusMate. SRC_1 is MOT only. */
    private SourceTier sourceTier;

    @Size(max = 255)
    private String attributionLabel;

    @NotBlank(message = "Name is mandatory")
    private String name; // English name (mandatory)
    
    private String nameSinhala;
    private String nameTamil;

    private String description;

    @NotNull(message = "Location is mandatory")
    private LocationDto location;

    private Boolean isAccessible;
}