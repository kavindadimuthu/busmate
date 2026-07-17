package com.busmatelk.telemetry.device.repository;

import com.busmatelk.telemetry.device.entity.DeviceType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeviceTypeRepository extends JpaRepository<DeviceType, String> {
}
