package com.busmate.routeschedule.passengerinfo.dto.response;

import java.util.List;

import com.busmate.routeschedule.shared.provenance.TrustInfo;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Who normally works a departure, as a passenger is shown it (ADR-024). It is a pattern, not a promise for
 * today's bus: the app words it "usually", and {@code trust} says where the claim came from. It carries no
 * identity of whoever contributed it, and no internal ids — display credit only, like every public record.
 */
@Schema(description = "Who usually works this departure. Never a guarantee about a particular day.")
public record UsualWorking(
        @Schema(description = "The operator's name: the registered one if linked, else as seen") String operatorName,
        @Schema(description = "NORMAL, SEMI_LUXURY, LUXURY, SUPER_LUXURY or EXPRESSWAY_SUPER_LUXURY; absent if not stated")
        String serviceClass,
        @Schema(description = "Plates, as registered or as seen. More than one means the operator alternates among them")
        List<String> plates,
        TrustInfo trust) {
}
