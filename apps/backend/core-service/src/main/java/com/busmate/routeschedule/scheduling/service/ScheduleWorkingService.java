package com.busmate.routeschedule.scheduling.service;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.busmate.routeschedule.fleet.entity.Bus;
import com.busmate.routeschedule.fleet.entity.Operator;
import com.busmate.routeschedule.fleet.repository.BusRepository;
import com.busmate.routeschedule.fleet.repository.OperatorRepository;
import com.busmate.routeschedule.scheduling.dto.request.CorrectWorkingRequest;
import com.busmate.routeschedule.scheduling.dto.request.ScheduleWorkingRequest;
import com.busmate.routeschedule.scheduling.dto.response.ScheduleWorkingResponse;
import com.busmate.routeschedule.scheduling.entity.Schedule;
import com.busmate.routeschedule.scheduling.entity.ScheduleWorking;
import com.busmate.routeschedule.scheduling.entity.ScheduleWorkingVehicle;
import com.busmate.routeschedule.scheduling.repository.ScheduleRepository;
import com.busmate.routeschedule.scheduling.repository.ScheduleWorkingRepository;
import com.busmate.routeschedule.shared.exception.BadRequestException;
import com.busmate.routeschedule.shared.exception.ConflictException;
import com.busmate.routeschedule.shared.exception.ResourceNotFoundException;
import com.busmate.routeschedule.shared.provenance.ProvenanceStamper;
import com.busmate.routeschedule.shared.provenance.TrustLabels;

import lombok.RequiredArgsConstructor;

/**
 * Who normally works a departure (ADR-024). Staff record it, link what was only seen to a real operator or
 * bus, close it, or remove a mistake. It is display-only: nothing here reads or writes a trip.
 */
@Service
@RequiredArgsConstructor
public class ScheduleWorkingService {

    private final ScheduleWorkingRepository workings;
    private final ScheduleRepository schedules;
    private final OperatorRepository operators;
    private final BusRepository buses;
    private final ProvenanceStamper provenanceStamper;

    @Transactional(readOnly = true)
    public List<ScheduleWorkingResponse> list(UUID scheduleId) {
        requireSchedule(scheduleId);
        return workings.findAllForSchedule(scheduleId).stream().map(this::toResponse).toList();
    }

    /** One working, for building a review snapshot (INC-058) as well as any future direct read. */
    @Transactional(readOnly = true)
    public ScheduleWorkingResponse get(UUID workingId) {
        return toResponse(requireWorking(workingId));
    }

    @Transactional
    public ScheduleWorkingResponse create(UUID scheduleId, ScheduleWorkingRequest request, String auditId) {
        Schedule schedule = requireSchedule(scheduleId);

        String observedName = blankToNull(request.operatorNameObserved());
        boolean hasVehicles = request.vehicles() != null && !request.vehicles().isEmpty();
        if (request.operatorId() == null && observedName == null && request.serviceClass() == null && !hasVehicles) {
            throw new BadRequestException("Say something about who works it: an operator, a service class or a vehicle");
        }

        ScheduleWorking working = new ScheduleWorking();
        working.setSchedule(schedule);
        working.setEffectiveStartDate(request.effectiveStartDate() != null ? request.effectiveStartDate() : LocalDate.now());
        working.setEffectiveEndDate(request.effectiveEndDate());
        if (working.getEffectiveEndDate() != null && working.getEffectiveEndDate().isBefore(working.getEffectiveStartDate())) {
            throw new BadRequestException("It cannot end before it starts");
        }
        working.setOperatorNameObserved(observedName);
        working.setServiceClass(request.serviceClass());
        if (request.operatorId() != null) {
            working.setOperator(requireOperator(request.operatorId()));
        }
        working.setCreatedBy(auditId);
        working.setUpdatedBy(auditId);
        provenanceStamper.stampCreate(working, request.sourceTier(), request.attributionLabel(), request.observedOn());

        if (hasVehicles) {
            Set<String> seen = new HashSet<>();
            for (ScheduleWorkingRequest.VehicleClaim claim : request.vehicles()) {
                ScheduleWorkingVehicle vehicle = vehicleFrom(claim, working, request, auditId);
                if (!seen.add(vehicleKey(vehicle))) {
                    throw new BadRequestException("The same vehicle is listed twice");
                }
                working.getVehicles().add(vehicle);
            }
        }

        requireNoOverlap(schedule.getId(), working.operatorKey(), working.getEffectiveStartDate(),
                working.getEffectiveEndDate(), null);
        return toResponse(workings.save(working));
    }

    /**
     * Corrects what was observed about a working — the operator name, the plates, the service class, an end
     * date — keeping anything the request leaves out (INC-058, ADR-027). Never a registered operator or bus:
     * those are staff-only through {@link #resolveOperator} and {@link #resolveBus}.
     */
    @Transactional
    public ScheduleWorkingResponse correct(UUID workingId, CorrectWorkingRequest request, String auditId) {
        ScheduleWorking working = requireWorking(workingId);
        if (request.operatorNameObserved() != null) {
            working.setOperatorNameObserved(blankToNull(request.operatorNameObserved()));
        }
        if (request.serviceClass() != null) {
            working.setServiceClass(request.serviceClass());
        }
        if (request.effectiveEndDate() != null) {
            if (request.effectiveEndDate().isBefore(working.getEffectiveStartDate())) {
                throw new BadRequestException("It cannot end before it starts");
            }
            working.setEffectiveEndDate(request.effectiveEndDate());
        }
        if (request.platesObserved() != null) {
            working.getVehicles().clear();
            // Flushed before the new rows are added: clear + re-add in one flush would issue the insert of a
            // same-plated replacement before the delete of what it replaces, and collide with the unique index
            // that exists precisely to stop the same vehicle appearing twice.
            workings.saveAndFlush(working);
            Set<String> seen = new HashSet<>();
            for (String plate : request.platesObserved()) {
                ScheduleWorkingVehicle vehicle = new ScheduleWorkingVehicle();
                vehicle.setWorking(working);
                vehicle.setPlateObserved(normalisePlate(plate));
                vehicle.setCreatedBy(auditId);
                vehicle.setUpdatedBy(auditId);
                provenanceStamper.stampCreate(vehicle, null, null, null);
                if (!seen.add(vehicleKey(vehicle))) {
                    throw new BadRequestException("The same vehicle is listed twice");
                }
                working.getVehicles().add(vehicle);
            }
        }
        working.setUpdatedBy(auditId);
        requireNoOverlap(working.getSchedule().getId(), working.operatorKey(),
                working.getEffectiveStartDate(), working.getEffectiveEndDate(), working.getId());
        return toResponse(workings.save(working));
    }

    /** Sets the last day a working applied. Anything later than that day is no longer claimed. */
    @Transactional
    public ScheduleWorkingResponse end(UUID workingId, LocalDate endDate, String auditId) {
        ScheduleWorking working = requireWorking(workingId);
        if (endDate.isBefore(working.getEffectiveStartDate())) {
            throw new BadRequestException("It cannot end before it starts");
        }
        working.setEffectiveEndDate(endDate);
        working.setUpdatedBy(auditId);
        return toResponse(workings.save(working));
    }

    /** Links a working whose operator was only a name to a registered operator. The name seen is kept. */
    @Transactional
    public ScheduleWorkingResponse resolveOperator(UUID workingId, UUID operatorId, String auditId) {
        ScheduleWorking working = requireWorking(workingId);
        Operator operator = requireOperator(operatorId);
        for (ScheduleWorkingVehicle v : working.getVehicles()) {
            requireBusBelongsTo(v.getBus(), operator);
        }
        // Checked before the change, not after: the check queries, which would flush the change and let the
        // database's unique index refuse it first, as a 500 instead of an explanation.
        requireNoOverlap(working.getSchedule().getId(), "id:" + operator.getId(),
                working.getEffectiveStartDate(), working.getEffectiveEndDate(), working.getId());
        working.setOperator(operator);
        working.setUpdatedBy(auditId);
        return toResponse(workings.save(working));
    }

    /** Links a plate that was only seen to a registered bus. Only staff do this: a contributor's guess never
     * becomes a fleet-registry reference on their say-so. */
    @Transactional
    public ScheduleWorkingResponse resolveBus(UUID vehicleId, UUID busId, String auditId) {
        ScheduleWorking working = workings.findByVehicleId(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + vehicleId));
        ScheduleWorkingVehicle vehicle = working.getVehicles().stream()
                .filter(v -> v.getId().equals(vehicleId)).findFirst().orElseThrow();
        Bus bus = buses.findById(busId)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + busId));
        requireBusBelongsTo(bus, working.getOperator());
        vehicle.setBus(bus);
        vehicle.setUpdatedBy(auditId);
        working.setUpdatedBy(auditId);
        return toResponse(workings.save(working));
    }

    @Transactional
    public void delete(UUID workingId) {
        workings.delete(requireWorking(workingId));
    }

    // ───────────────────────────── rules ─────────────────────────────

    private ScheduleWorkingVehicle vehicleFrom(ScheduleWorkingRequest.VehicleClaim claim, ScheduleWorking working,
                                               ScheduleWorkingRequest request, String auditId) {
        String plate = normalisePlate(claim.plateObserved());
        if (claim.busId() == null && plate == null) {
            throw new BadRequestException("A vehicle needs a plate as seen or a registered bus");
        }
        ScheduleWorkingVehicle vehicle = new ScheduleWorkingVehicle();
        vehicle.setWorking(working);
        vehicle.setPlateObserved(plate);
        if (claim.busId() != null) {
            Bus bus = buses.findById(claim.busId())
                    .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + claim.busId()));
            requireBusBelongsTo(bus, working.getOperator());
            vehicle.setBus(bus);
        }
        vehicle.setCreatedBy(auditId);
        vehicle.setUpdatedBy(auditId);
        provenanceStamper.stampCreate(vehicle, request.sourceTier(), request.attributionLabel(), request.observedOn());
        return vehicle;
    }

    /** A bus registered to one operator cannot be the vehicle of another operator's working. */
    private void requireBusBelongsTo(Bus bus, Operator operator) {
        if (bus != null && operator != null && bus.getOperator() != null
                && !bus.getOperator().getId().equals(operator.getId())) {
            throw new ConflictException("Bus " + bus.getPlateNumber() + " is registered to a different operator than this working");
        }
    }

    /** No two workings for one schedule may overlap in date if they name the same operator (ADR-024). */
    private void requireNoOverlap(UUID scheduleId, String operatorKey, LocalDate start, LocalDate end, UUID excludingId) {
        for (ScheduleWorking other : workings.findAllForSchedule(scheduleId)) {
            if (other.getId().equals(excludingId) || !other.operatorKey().equals(operatorKey)) {
                continue;
            }
            if (other.overlaps(start, end)) {
                throw new ConflictException("This overlaps another working by the same operator ("
                        + other.getEffectiveStartDate() + " to "
                        + (other.getEffectiveEndDate() != null ? other.getEffectiveEndDate() : "now")
                        + "); end that one first, or give this one different dates");
            }
        }
    }

    private static String vehicleKey(ScheduleWorkingVehicle v) {
        return v.getBus() != null ? "bus:" + v.getBus().getId() : "plate:" + v.getPlateObserved();
    }

    /** Trimmed and upper-cased, so "nd-1712 " and "ND-1712" are one plate. */
    static String normalisePlate(String plate) {
        String p = blankToNull(plate);
        return p == null ? null : p.toUpperCase();
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.strip();
    }

    private Schedule requireSchedule(UUID id) {
        return schedules.findById(id).orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + id));
    }

    private ScheduleWorking requireWorking(UUID id) {
        return workings.findById(id).orElseThrow(() -> new ResourceNotFoundException("Working not found with id: " + id));
    }

    private Operator requireOperator(UUID id) {
        return operators.findById(id).orElseThrow(() -> new ResourceNotFoundException("Operator not found with id: " + id));
    }

    private ScheduleWorkingResponse toResponse(ScheduleWorking w) {
        List<ScheduleWorkingResponse.Vehicle> vehicles = w.getVehicles().stream()
                .map(v -> new ScheduleWorkingResponse.Vehicle(v.getId(),
                        v.getBus() != null ? v.getBus().getId() : null,
                        v.getBus() != null ? v.getBus().getPlateNumber() : v.getPlateObserved(),
                        v.getBus() != null, v.getPlateObserved(),
                        TrustLabels.recordTrust(v.getProvenance())))
                .toList();
        return new ScheduleWorkingResponse(w.getId(), w.getSchedule().getId(), w.getEffectiveStartDate(),
                w.getEffectiveEndDate(),
                w.getOperator() != null ? w.getOperator().getId() : null,
                w.getOperator() != null ? w.getOperator().getName() : w.getOperatorNameObserved(),
                w.getOperator() != null, w.getOperatorNameObserved(), w.getServiceClass(),
                TrustLabels.recordTrust(w.getProvenance()), vehicles);
    }
}
