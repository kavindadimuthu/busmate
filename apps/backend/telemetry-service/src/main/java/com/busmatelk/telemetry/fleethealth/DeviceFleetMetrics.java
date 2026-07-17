package com.busmatelk.telemetry.fleethealth;

import com.busmatelk.telemetry.device.entity.DeviceStatus;
import com.busmatelk.telemetry.device.repository.DeviceRepository;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Registers a per-{@link DeviceStatus} gauge (IoT Platform Layer plan, Phase 4 observability) —
 * feeds the Grafana IoT dashboard's "fleet online/offline" panel. Micrometer gauges are pull-based
 * (the supplied function runs at scrape time), so this stays cheap and always current without a
 * scheduled job of its own — unlike {@link FleetHealthMonitorJob}, which mutates state and must run
 * on a timer, this only reads.
 */
@Component
@RequiredArgsConstructor
public class DeviceFleetMetrics {

    private final DeviceRepository deviceRepository;
    private final MeterRegistry meterRegistry;

    @PostConstruct
    void registerGauges() {
        for (DeviceStatus status : DeviceStatus.values()) {
            Gauge.builder("telemetry.devices.by_status", () -> deviceRepository.countByStatus(status))
                    .description("Number of registered devices in each lifecycle status")
                    .tag("status", status.name())
                    .register(meterRegistry);
        }
        Gauge.builder("telemetry.devices.silent", deviceRepository::countBySilenceFlaggedAtIsNotNull)
                .description("Number of ACTIVE devices currently flagged silent by FleetHealthMonitorJob")
                .register(meterRegistry);
    }
}
