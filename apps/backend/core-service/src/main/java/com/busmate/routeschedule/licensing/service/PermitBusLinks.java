package com.busmate.routeschedule.licensing.service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.busmate.routeschedule.fleet.entity.Bus;
import com.busmate.routeschedule.fleet.enums.ServiceClassEnum;
import com.busmate.routeschedule.fleet.repository.BusRepository;
import com.busmate.routeschedule.licensing.dto.response.BusPassengerServicePermitAssignmentResponse;
import com.busmate.routeschedule.licensing.entity.BusPassengerServicePermitAssignment;
import com.busmate.routeschedule.licensing.entity.PassengerServicePermit;
import com.busmate.routeschedule.licensing.enums.PassengerServicePermitTypeEnum;
import com.busmate.routeschedule.licensing.enums.RequestStatusEnum;
import com.busmate.routeschedule.licensing.repository.BusPassengerServicePermitAssignmentRepository;
import com.busmate.routeschedule.shared.enums.StatusEnum;
import com.busmate.routeschedule.shared.exception.ConflictException;
import com.busmate.routeschedule.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Which buses a permit authorises (INC-017, design R4).
 *
 * <p>A link needs no MOT approval: the permit's {@code maximumBusAssigned} is the regulatory cap,
 * so an operator may link their own buses to their own permit up to that cap and the link is in
 * force immediately. MOT sees every link and can end one.
 */
@Service
@RequiredArgsConstructor
public class PermitBusLinks {

    private final BusPassengerServicePermitAssignmentRepository linkRepository;
    private final BusRepository busRepository;

    public List<BusPassengerServicePermitAssignmentResponse> forPermit(UUID permitId) {
        return linkRepository.findByPassengerServicePermitIdOrderByStartDateDesc(permitId).stream()
                .map(PermitBusLinks::toResponse).toList();
    }

    public List<BusPassengerServicePermitAssignmentResponse> forBus(UUID busId) {
        return linkRepository.findByBusIdOrderByStartDateDesc(busId).stream()
                .map(PermitBusLinks::toResponse).toList();
    }

    public long activeCount(UUID permitId) {
        return linkRepository.countActiveAssignmentsByPermitId(permitId);
    }

    @Transactional
    public BusPassengerServicePermitAssignmentResponse link(PassengerServicePermit permit, UUID busId,
                                                            LocalDate startDate, LocalDate endDate, String userId) {
        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + busId));
        LocalDate start = startDate != null ? startDate : LocalDate.now();

        if (!bus.getOperator().getId().equals(permit.getOperator().getId())) {
            throw new ConflictException("The bus and the permit belong to different operators");
        }
        if (permit.getStatus() != StatusEnum.active) {
            throw new ConflictException("Only an active permit can authorise buses (this one is " + permit.getStatus() + ")");
        }
        if (permit.getExpiryDate() != null && permit.getExpiryDate().isBefore(LocalDate.now())) {
            throw new ConflictException("Permit " + permit.getPermitNumber() + " expired on " + permit.getExpiryDate());
        }
        if (bus.getStatus() != StatusEnum.active) {
            throw new ConflictException("Bus " + bus.getPlateNumber() + " is not active");
        }
        ServiceClassEnum required = serviceClassFor(permit.getPermitType());
        if (bus.getServiceClass() != required) {
            throw new ConflictException("A " + permit.getPermitType() + " permit needs a " + required
                    + " bus; " + bus.getPlateNumber() + " is " + bus.getServiceClass());
        }
        if (endDate != null && endDate.isBefore(start)) {
            throw new ConflictException("End date cannot be before start date");
        }
        if (permit.getExpiryDate() != null && start.isAfter(permit.getExpiryDate())) {
            throw new ConflictException("The link cannot start after the permit expires");
        }
        if (linkRepository.existsActiveLink(bus.getId(), permit.getId())) {
            throw new ConflictException(bus.getPlateNumber() + " is already linked to this permit");
        }
        long inForce = linkRepository.countActiveAssignmentsByPermitId(permit.getId());
        if (inForce >= permit.getMaximumBusAssigned()) {
            throw new ConflictException("Permit " + permit.getPermitNumber() + " already authorises its maximum of "
                    + permit.getMaximumBusAssigned() + " bus(es)");
        }

        BusPassengerServicePermitAssignment link = new BusPassengerServicePermitAssignment();
        link.setBus(bus);
        link.setPassengerServicePermit(permit);
        link.setStartDate(start);
        link.setEndDate(endDate);
        link.setRequestStatus(RequestStatusEnum.ACCEPTED);
        link.setStatus(StatusEnum.active);
        link.setCreatedBy(userId);
        link.setUpdatedBy(userId);
        return toResponse(linkRepository.save(link));
    }

    /**
     * Ends a link. One that never took effect (starts in the future) is removed outright; one
     * that did is closed today so the history of which bus ran under which permit survives.
     */
    @Transactional
    public void end(BusPassengerServicePermitAssignment link, String userId) {
        LocalDate today = LocalDate.now();
        if (link.getStartDate().isAfter(today)) {
            linkRepository.delete(link);
            return;
        }
        link.setStatus(StatusEnum.inactive);
        link.setEndDate(today);
        link.setUpdatedBy(userId);
        linkRepository.save(link);
    }

    /** Ends every link in force on a permit, e.g. when it is withdrawn. */
    @Transactional
    public int endAllFor(UUID permitId, String userId) {
        List<BusPassengerServicePermitAssignment> active = linkRepository.findActiveByPermitId(permitId);
        active.forEach(link -> end(link, userId));
        return active.size();
    }

    public BusPassengerServicePermitAssignment require(UUID linkId) {
        return linkRepository.findById(linkId)
                .orElseThrow(() -> new ResourceNotFoundException("Permit link not found with id: " + linkId));
    }

    /**
     * The bus class a permit type requires. The two enums name the same five tiers differently
     * (licensing vs fares), which is why the mapping is explicit.
     */
    public static ServiceClassEnum serviceClassFor(PassengerServicePermitTypeEnum permitType) {
        return switch (permitType) {
            case NORMAL -> ServiceClassEnum.NORMAL;
            case SEMI_LUXURY -> ServiceClassEnum.SEMI_LUXURY;
            case LUXURY -> ServiceClassEnum.LUXURY;
            case EXTRA_LUXURY_NORMALWAY -> ServiceClassEnum.SUPER_LUXURY;
            case EXTRA_LUXURY_HIGHWAY -> ServiceClassEnum.EXPRESSWAY_SUPER_LUXURY;
        };
    }

    public static BusPassengerServicePermitAssignmentResponse toResponse(BusPassengerServicePermitAssignment link) {
        BusPassengerServicePermitAssignmentResponse r = new BusPassengerServicePermitAssignmentResponse();
        r.setId(link.getId());
        r.setBusId(link.getBus().getId());
        r.setBusPlateNumber(link.getBus().getPlateNumber());
        r.setBusModel(link.getBus().getModel());
        r.setBusServiceClass(link.getBus().getServiceClass() != null ? link.getBus().getServiceClass().name() : null);
        r.setPassengerServicePermitId(link.getPassengerServicePermit().getId());
        r.setPermitNumber(link.getPassengerServicePermit().getPermitNumber());
        r.setStartDate(link.getStartDate());
        r.setEndDate(link.getEndDate());
        r.setRequestStatus(link.getRequestStatus() != null ? link.getRequestStatus().name() : null);
        r.setStatus(link.getStatus() != null ? link.getStatus().name() : null);
        r.setInForce(link.getStatus() == StatusEnum.active
                && (link.getEndDate() == null || !link.getEndDate().isBefore(LocalDate.now())));
        r.setCreatedAt(link.getCreatedAt());
        r.setUpdatedAt(link.getUpdatedAt());
        r.setCreatedBy(link.getCreatedBy());
        r.setUpdatedBy(link.getUpdatedBy());
        return r;
    }
}
