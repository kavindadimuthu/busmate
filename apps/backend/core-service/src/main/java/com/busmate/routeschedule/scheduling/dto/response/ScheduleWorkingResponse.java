package com.busmate.routeschedule.scheduling.dto.response;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.busmate.routeschedule.fleet.enums.ServiceClassEnum;
import com.busmate.routeschedule.shared.provenance.TrustInfo;

/**
 * A working as staff and, later, passengers see it. It never carries who contributed it: display credit
 * only, like every public network record. {@code operatorResolved} false means the name is what someone saw,
 * not a registered operator — still valid, and shown as reported.
 */
public record ScheduleWorkingResponse(
        UUID id,
        UUID scheduleId,
        LocalDate effectiveStartDate,
        LocalDate effectiveEndDate,
        UUID operatorId,
        String operatorName,
        boolean operatorResolved,
        String operatorNameObserved,
        ServiceClassEnum serviceClass,
        TrustInfo trust,
        List<Vehicle> vehicles) {

    public record Vehicle(
            UUID id,
            UUID busId,
            String plate,
            boolean resolved,
            String plateObserved,
            TrustInfo trust) {
    }
}
