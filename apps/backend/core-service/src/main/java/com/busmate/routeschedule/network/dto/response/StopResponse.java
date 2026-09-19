package com.busmate.routeschedule.network.dto.response;

import com.busmate.routeschedule.shared.provenance.ProvenanceResponse;

import lombok.Data;
import com.busmate.routeschedule.shared.dto.LocationDto;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class StopResponse {
    private ProvenanceResponse provenance;

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