package com.busmatelk.telemetry.livestate.dto;

import com.busmatelk.telemetry.livestate.entity.BusLiveState;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusLiveStateResponse {

    private UUID busId;
    private UUID deviceId;
    private UUID tripId;
    private Double lat;
    private Double lng;
    private Double speedKmh;
    private Double headingDeg;
    private Instant deviceTimestamp;
    private Instant ingestedAt;
    private Instant updatedAt;

    public static BusLiveStateResponse of(BusLiveState state) {
        return BusLiveStateResponse.builder()
                .busId(state.getBusId())
                .deviceId(state.getDeviceId())
                .tripId(state.getTripId())
                .lat(state.getLat())
                .lng(state.getLng())
                .speedKmh(state.getSpeedKmh())
                .headingDeg(state.getHeadingDeg())
                .deviceTimestamp(state.getDeviceTimestamp())
                .ingestedAt(state.getIngestedAt())
                .updatedAt(state.getUpdatedAt())
                .build();
    }
}
