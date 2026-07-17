package com.busmatelk.telemetry.livestate.repository;

import com.busmatelk.telemetry.livestate.entity.BusLiveState;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BusLiveStateRepository extends JpaRepository<BusLiveState, UUID> {
}
