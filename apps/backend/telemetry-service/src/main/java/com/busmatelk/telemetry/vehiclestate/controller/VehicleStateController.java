package com.busmatelk.telemetry.vehiclestate.controller;

import com.busmatelk.telemetry.shared.exception.NotFoundException;
import com.busmatelk.telemetry.vehiclestate.access.VehicleAccess;
import com.busmatelk.telemetry.vehiclestate.dto.VehicleStateResponse;
import com.busmatelk.telemetry.vehiclestate.service.VehicleStateReadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Staff and operator read of vehicle health (INC-024). Unlike {@code /api/live/**}, which is open
 * and carries position only, this is authorised from the gateway-verified identity and scoped by the
 * database: an operator sees their own buses, MOT and admin see every bus, anyone else is refused.
 */
@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
@Tag(name = "Vehicle health", description = "Latest engine, fuel, tyre and alert state per bus — staff and the owning operator only")
public class VehicleStateController {

    private final VehicleAccess vehicleAccess;
    private final VehicleStateReadService readService;

    @Operation(summary = "Latest vehicle health for every bus the caller may see")
    @GetMapping("/state")
    public List<VehicleStateResponse> list(
            @RequestHeader(value = "x-user-id", required = false) String userId,
            @RequestHeader(value = "x-user-type", required = false) String userType) {
        return readService.findAll(vehicleAccess.resolve(userId, userType));
    }

    @Operation(summary = "Latest vehicle health for one bus")
    @GetMapping("/{busId}/state")
    public VehicleStateResponse get(
            @PathVariable UUID busId,
            @RequestHeader(value = "x-user-id", required = false) String userId,
            @RequestHeader(value = "x-user-type", required = false) String userType) {
        return readService.find(busId, vehicleAccess.resolve(userId, userType))
                // Another operator's bus and a bus with no state answer the same, so this cannot be
                // used to discover which buses exist.
                .orElseThrow(() -> new NotFoundException("No vehicle state for bus: " + busId));
    }
}
