package com.busmatelk.telemetry.device.repository;

import com.busmatelk.telemetry.device.entity.DeviceAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeviceAssignmentRepository extends JpaRepository<DeviceAssignment, UUID> {

    Optional<DeviceAssignment> findByDeviceIdAndUnassignedAtIsNull(UUID deviceId);

    Optional<DeviceAssignment> findByBusIdAndUnassignedAtIsNull(UUID busId);

    List<DeviceAssignment> findByDeviceIdOrderByAssignedAtDesc(UUID deviceId);
}
