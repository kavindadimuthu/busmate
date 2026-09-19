package com.busmatelk.telemetry.vehiclestate.service;

import com.busmatelk.telemetry.vehiclestate.entity.BusActiveAlert;
import com.busmatelk.telemetry.vehiclestate.entity.BusActiveAlertId;
import com.busmatelk.telemetry.vehiclestate.entity.BusVehicleState;
import com.busmatelk.telemetry.vehiclestate.repository.BusActiveAlertRepository;
import com.busmatelk.telemetry.vehiclestate.repository.BusVehicleStateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Keeps the latest vehicle snapshot per bus and the alerts a device currently holds raised
 * (INC-023). Write side only: nothing reads these tables until INC-024 puts database-enforced
 * isolation under a read path.
 *
 * <p>Late data follows the same rule as {@code bus_live_state}: an event whose device timestamp is
 * older than what is already stored never overwrites it. For alerts that also means a stale
 * {@code cleared} cannot remove an alert the device raised again afterwards.
 *
 * <p>{@code operatorId} is stamped on every row and may be null when core-service could not say who
 * owns the bus; such a row is kept rather than the event dropped.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleStateService {

    private final BusVehicleStateRepository stateRepository;
    private final BusActiveAlertRepository alertRepository;

    @Transactional
    public void applySnapshot(UUID busId, UUID deviceId, UUID tripId, UUID operatorId,
                              Map<String, Object> snapshot, Instant deviceTimestamp, Instant ingestedAt) {
        BusVehicleState state = stateRepository.findById(busId)
                .orElseGet(() -> BusVehicleState.builder().busId(busId).build());
        if (state.getDeviceTimestamp() != null && deviceTimestamp.isBefore(state.getDeviceTimestamp())) {
            log.debug("Ignoring stale vehicle snapshot for bus {}: {} is older than {}",
                    busId, deviceTimestamp, state.getDeviceTimestamp());
            return;
        }
        state.setOperatorId(operatorId);
        state.setDeviceId(deviceId);
        state.setTripId(tripId);
        state.setSnapshot(snapshot);
        state.setDeviceTimestamp(deviceTimestamp);
        state.setIngestedAt(ingestedAt);
        stateRepository.save(state);
    }

    @Transactional
    public void raiseAlert(UUID busId, UUID deviceId, UUID operatorId, String code, String component,
                           String severity, String message, Instant deviceTimestamp) {
        String comp = componentKey(component);
        BusActiveAlert alert = alertRepository.findById(new BusActiveAlertId(busId, code, comp)).orElse(null);
        if (alert != null && deviceTimestamp.isBefore(alert.getDeviceTimestamp())) {
            return;
        }
        if (alert == null) {
            alert = BusActiveAlert.builder().busId(busId).code(code).component(comp).raisedAt(deviceTimestamp).build();
        }
        // A repeat of an alert that is already raised keeps its original raisedAt: it is the same
        // condition continuing, not a new one.
        alert.setOperatorId(operatorId);
        alert.setDeviceId(deviceId);
        alert.setSeverity(severity);
        alert.setMessage(message);
        alert.setDeviceTimestamp(deviceTimestamp);
        alertRepository.save(alert);
    }

    @Transactional
    public void clearAlert(UUID busId, String code, String component, Instant deviceTimestamp) {
        alertRepository.findById(new BusActiveAlertId(busId, code, componentKey(component)))
                .filter(alert -> !deviceTimestamp.isBefore(alert.getDeviceTimestamp()))
                .ifPresent(alertRepository::delete);
    }

    private static String componentKey(String component) {
        return component == null ? "" : component;
    }
}
