package com.busmate.routeschedule.passengerinfo.client;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Tuning for the live-GPS ETA computation (IoT Platform Layer plan, Phase 3). A plain
 * {@code @Value}-injected bean rather than fields directly on {@link
 * com.busmate.routeschedule.passengerinfo.service.impl.PassengerQueryServiceImpl}, since that class
 * uses Lombok's {@code @RequiredArgsConstructor} and mixing raw {@code @Value} fields into it would
 * require per-field {@code @Value} on constructor parameters, which Lombok doesn't propagate.
 */
@Component
@Getter
public class LiveEtaProperties {

    private final long maxStalenessSeconds;
    private final double fallbackSpeedKmh;

    public LiveEtaProperties(
            @Value("${telemetry.live-eta.max-staleness-seconds}") long maxStalenessSeconds,
            @Value("${telemetry.live-eta.fallback-speed-kmh}") double fallbackSpeedKmh) {
        this.maxStalenessSeconds = maxStalenessSeconds;
        this.fallbackSpeedKmh = fallbackSpeedKmh;
    }
}
