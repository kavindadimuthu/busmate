package com.busmate.routeschedule.community.dto;

import java.util.UUID;

import com.busmate.routeschedule.community.entity.ReportReason;
import com.busmate.routeschedule.community.entity.ReportedEntityType;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "A passenger saying something is wrong about a departure or who works it")
public record PassengerReportRequest(
        @NotNull ReportedEntityType entityType,
        @NotNull UUID targetId,
        @NotNull ReportReason reason,
        @Size(max = 500) String note) {
}
