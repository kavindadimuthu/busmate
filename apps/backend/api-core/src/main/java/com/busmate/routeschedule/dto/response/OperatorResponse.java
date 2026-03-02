package com.busmate.routeschedule.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class OperatorResponse {
    private UUID id;
    private String name;
    private String operatorType;
    private String region;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
