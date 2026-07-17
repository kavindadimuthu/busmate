package com.busmatelk.telemetry.device.controller;

import com.busmatelk.telemetry.device.entity.DeviceType;
import com.busmatelk.telemetry.device.repository.DeviceTypeRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/device-types")
@RequiredArgsConstructor
@Tag(name = "Device Types", description = "Reference data: the canonical device kinds")
public class DeviceTypeController {

    private final DeviceTypeRepository deviceTypeRepository;

    @Operation(summary = "List device types")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @GetMapping
    public List<DeviceType> list() {
        return deviceTypeRepository.findAll();
    }
}
