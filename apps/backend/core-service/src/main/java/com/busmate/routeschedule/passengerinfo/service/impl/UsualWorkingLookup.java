package com.busmate.routeschedule.passengerinfo.service.impl;

import java.time.LocalDate;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.busmate.routeschedule.passengerinfo.dto.response.UsualWorking;
import com.busmate.routeschedule.scheduling.entity.ScheduleWorking;
import com.busmate.routeschedule.scheduling.repository.ScheduleWorkingRepository;
import com.busmate.routeschedule.shared.provenance.TrustLabels;

import lombok.RequiredArgsConstructor;

/**
 * The workings a passenger sees for a set of departures on a date (ADR-024, INC-046). One query for the whole
 * set, so a search does not add a lookup per bus. Display-only: nothing here reads or writes a trip.
 */
@Component
@RequiredArgsConstructor
public class UsualWorkingLookup {

    private final ScheduleWorkingRepository workings;

    @Transactional(readOnly = true)
    public Map<UUID, List<UsualWorking>> forSchedules(Collection<UUID> scheduleIds, LocalDate date) {
        Map<UUID, List<UsualWorking>> bySchedule = new HashMap<>();
        if (scheduleIds == null || scheduleIds.isEmpty()) {
            return bySchedule;
        }
        for (ScheduleWorking w : workings.findActiveOn(scheduleIds, date)) {
            bySchedule.computeIfAbsent(w.getSchedule().getId(), id -> new java.util.ArrayList<>()).add(toView(w));
        }
        return bySchedule;
    }

    private UsualWorking toView(ScheduleWorking w) {
        String operator = w.getOperator() != null ? w.getOperator().getName() : w.getOperatorNameObserved();
        List<String> plates = w.getVehicles().stream()
                .map(v -> v.getBus() != null ? v.getBus().getPlateNumber() : v.getPlateObserved())
                .toList();
        return new UsualWorking(w.getId(), operator, w.getServiceClass() != null ? w.getServiceClass().name() : null, plates,
                TrustLabels.recordTrust(w.getProvenance()));
    }
}
