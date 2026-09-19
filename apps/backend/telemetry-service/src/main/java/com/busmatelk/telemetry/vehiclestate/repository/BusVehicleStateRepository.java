package com.busmatelk.telemetry.vehiclestate.repository;

import com.busmatelk.telemetry.vehiclestate.entity.BusVehicleState;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BusVehicleStateRepository extends JpaRepository<BusVehicleState, UUID> {
}
