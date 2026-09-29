package com.busmate.routeschedule.postimport.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "A staff member's paste of a community post to be read by AI and checked by code (ADR-028)")
public record CreatePostImportRequest(
        @NotBlank
        @Size(max = 20000, message = "That's a lot longer than a timetable post — check what was pasted.")
        String pastedText) {
}
