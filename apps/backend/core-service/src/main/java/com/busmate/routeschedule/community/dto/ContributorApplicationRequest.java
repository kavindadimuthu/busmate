package com.busmate.routeschedule.community.dto;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import com.busmate.routeschedule.community.entity.Affiliation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.ToString;

/** A passenger's application to contribute. Personal data: excluded from toString so it is never logged. */
@Data
public class ContributorApplicationRequest {

    @ToString.Exclude
    @NotBlank(message = "Tell us why you want to contribute")
    @Size(max = 1000, message = "Keep it under 1000 characters")
    private String motivation;

    @ToString.Exclude
    @Size(max = 100)
    private String homeDistrict;

    @ToString.Exclude
    @Size(max = 20, message = "Choose at most 20 corridors")
    private Set<UUID> corridorRouteGroupIds = new HashSet<>();

    @NotNull(message = "Say whether you have any link to a bus operator")
    private Affiliation affiliation;

    @ToString.Exclude
    @Size(max = 500)
    private String affiliationDetail;

    /** The agreement version the applicant read; refused if it is no longer the one in force. */
    @NotBlank(message = "Accept the contributor agreement")
    private String agreementVersion;
}
