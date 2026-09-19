package com.busmatelk.telemetry.vehiclestate.repository;

import com.busmatelk.telemetry.vehiclestate.entity.BusActiveAlert;
import com.busmatelk.telemetry.vehiclestate.entity.BusActiveAlertId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BusActiveAlertRepository extends JpaRepository<BusActiveAlert, BusActiveAlertId> {
    List<BusActiveAlert> findByBusId(UUID busId);
}
