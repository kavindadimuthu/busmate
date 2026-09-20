package com.busmate.routeschedule.community.dto;

import java.time.LocalDate;
import java.util.UUID;

import com.busmate.routeschedule.community.entity.ObservationMethod;
import com.busmate.routeschedule.shared.dto.LocationDto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * A contributor's proposal for one stop — a new one, or a correction to {@code targetStopId}.
 * Shaped like {@link com.busmate.routeschedule.network.dto.request.StopRequest} for the fields
 * staff can set, plus what the contributor observed.
 */
@Data
public class StopProposalRequest {

    /** Present only when correcting an existing stop; absent means a brand new stop. */
    private UUID targetStopId;

    @NotBlank(message = "Name is mandatory")
    private String name;

    private String nameSinhala;
    private String nameTamil;

    private String description;

    @NotNull(message = "Location is mandatory")
    @Valid
    private LocationDto location;

    private Boolean isAccessible;

    @NotNull(message = "Say when you observed this")
    @PastOrPresent(message = "The observed date can't be in the future")
    private LocalDate observedOn;

    @NotNull(message = "Say how you know this")
    private ObservationMethod observationMethod;

    @Size(max = 500)
    private String note;

    /**
     * True once the contributor has seen the duplicate warning and wants to submit anyway.
     * Ignored for a correction (there is no "duplicate of itself").
     */
    private boolean confirmDuplicate;

    // Sri Lanka's approximate bounding box, generous enough not to reject a real coastal or
    // territorial-waters stop while still catching an obviously wrong point (INC-030 acceptance
    // criteria: "position outside Sri Lanka" is refused).
    public static final double MIN_LATITUDE = 5.7;
    public static final double MAX_LATITUDE = 10.0;
    public static final double MIN_LONGITUDE = 79.3;
    public static final double MAX_LONGITUDE = 82.0;
}
