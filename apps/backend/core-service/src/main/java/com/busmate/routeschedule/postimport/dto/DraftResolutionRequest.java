package com.busmate.routeschedule.postimport.dto;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Staff's review of a draft: every row's decision, the source label and date to credit, and which
 * unaccounted-for lines they've looked at and are content to leave out. Saving this never loads anything —
 * that's a separate, explicit approve step.
 */
public record DraftResolutionRequest(
        @NotBlank @Size(max = 255) String sourceLabel,
        @NotNull LocalDate observedOn,
        @NotNull List<ResolvedRow> rows,
        List<String> acknowledgedUnaccountedLines) {
}
