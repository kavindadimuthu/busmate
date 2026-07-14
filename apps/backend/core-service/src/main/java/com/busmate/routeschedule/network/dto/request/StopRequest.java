package com.busmate.routeschedule.network.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import com.busmate.routeschedule.shared.dto.LocationDto;

@Data
public class StopRequest {
    @NotBlank(message = "Name is mandatory")
    private String name; // English name (mandatory)
    
    private String nameSinhala;
    private String nameTamil;

    private String description;

    @NotNull(message = "Location is mandatory")
    private LocationDto location;

    private Boolean isAccessible;
}