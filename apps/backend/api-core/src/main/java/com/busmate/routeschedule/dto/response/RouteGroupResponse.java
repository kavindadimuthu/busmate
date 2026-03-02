package com.busmate.routeschedule.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class RouteGroupResponse {
    private UUID id;
    private String name; // English name (primary)
    private String nameSinhala;
    private String nameTamil;
    private String description;
    private List<RouteResponse> routes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}