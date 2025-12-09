package com.busmate.routeschedule.dto.response;

import lombok.Data;
import com.busmate.routeschedule.dto.common.LocationDto;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class StopResponse {
    private UUID id;
    private String name; // English name (primary)
    private String nameSinhala;
    private String nameTamil;
    private String description;
    private LocationDto location;
    private Boolean isAccessible;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}