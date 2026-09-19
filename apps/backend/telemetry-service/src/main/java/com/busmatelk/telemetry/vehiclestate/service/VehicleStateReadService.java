package com.busmatelk.telemetry.vehiclestate.service;

import com.busmatelk.telemetry.tenancy.TenantContext;
import com.busmatelk.telemetry.vehiclestate.access.VehicleCaller;
import com.busmatelk.telemetry.vehiclestate.dto.VehicleStateResponse;
import com.busmatelk.telemetry.vehiclestate.entity.BusActiveAlert;
import com.busmatelk.telemetry.vehiclestate.entity.BusVehicleState;
import com.busmatelk.telemetry.vehiclestate.repository.BusActiveAlertRepository;
import com.busmatelk.telemetry.vehiclestate.repository.BusVehicleStateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * The read side of vehicle health (INC-024). There is deliberately no operator filter anywhere in
 * these queries: they ask for everything, and the database's row-level security decides what the
 * declared caller may see. A query that forgot to scope, or scoped wrongly, still returns only what
 * the caller is entitled to — which is the point of enforcing isolation there and not here.
 */
@Service
@RequiredArgsConstructor
public class VehicleStateReadService {

    /** A hard ceiling so a fleet-wide read cannot grow without bound. */
    static final int MAX_BUSES = 500;

    private final BusVehicleStateRepository stateRepository;
    private final BusActiveAlertRepository alertRepository;
    private final TenantContext tenantContext;

    /** Empty both when the bus has no state and when the caller may not see it — deliberately indistinguishable. */
    @Transactional(readOnly = true)
    public Optional<VehicleStateResponse> find(UUID busId, VehicleCaller caller) {
        declare(caller);
        return stateRepository.findById(busId)
                .map(state -> VehicleStateResponse.of(state, alertRepository.findByBusId(busId)));
    }

    @Transactional(readOnly = true)
    public List<VehicleStateResponse> findAll(VehicleCaller caller) {
        declare(caller);
        List<BusVehicleState> states = stateRepository.findAll(PageRequest.of(0, MAX_BUSES)).getContent();
        Map<UUID, List<BusActiveAlert>> alertsByBus = alertRepository.findAll().stream()
                .collect(Collectors.groupingBy(BusActiveAlert::getBusId));
        return states.stream()
                .map(state -> VehicleStateResponse.of(state, alertsByBus.getOrDefault(state.getBusId(), List.of())))
                .toList();
    }

    private void declare(VehicleCaller caller) {
        switch (caller.kind()) {
            case STAFF -> tenantContext.asStaff();
            case OPERATOR -> tenantContext.asOperator(caller.operatorId());
        }
    }
}
