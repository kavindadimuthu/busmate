package com.busmate.routeschedule.community.service;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.busmate.routeschedule.community.dto.PassengerReportRequest;
import com.busmate.routeschedule.community.dto.PassengerReportResponse;
import com.busmate.routeschedule.community.entity.PassengerReport;
import com.busmate.routeschedule.community.entity.ReportStatus;
import com.busmate.routeschedule.community.entity.ReportedEntityType;
import com.busmate.routeschedule.community.repository.PassengerReportRepository;
import com.busmate.routeschedule.scheduling.repository.ScheduleRepository;
import com.busmate.routeschedule.scheduling.repository.ScheduleWorkingRepository;
import com.busmate.routeschedule.shared.exception.BadRequestException;
import com.busmate.routeschedule.shared.exception.ConflictException;
import com.busmate.routeschedule.shared.exception.ResourceNotFoundException;
import com.busmate.routeschedule.shared.security.Caller;

import lombok.RequiredArgsConstructor;

/**
 * A passenger reporting something wrong about a departure or who works it (INC-056). Open to anyone signed
 * in — never gated behind contributor status, unlike a proposal — and writes nothing to canonical data:
 * staff read it and go fix the actual record, then mark it resolved.
 */
@Service
@RequiredArgsConstructor
public class PassengerReportService {

    private final PassengerReportRepository reports;
    private final ScheduleRepository schedules;
    private final ScheduleWorkingRepository workings;

    @Transactional
    public PassengerReportResponse report(Caller caller, PassengerReportRequest request) {
        if (!request.reason().appliesTo(request.entityType())) {
            throw new BadRequestException("That reason doesn't apply to what you're reporting");
        }
        requireTargetExists(request.entityType(), request.targetId());
        reports.findByReporterUserIdAndEntityTypeAndTargetIdAndStatus(
                        caller.userId(), request.entityType(), request.targetId(), ReportStatus.OPEN)
                .ifPresent(existing -> {
                    throw new ConflictException("You've already reported this — a staff member hasn't looked at it yet");
                });

        PassengerReport r = new PassengerReport();
        r.setEntityType(request.entityType());
        r.setTargetId(request.targetId());
        r.setReason(request.reason());
        r.setNote(blankToNull(request.note()));
        r.setReporterUserId(caller.userId());
        r.setStatus(ReportStatus.OPEN);
        r.setCreatedAt(Instant.now());
        return toResponse(reports.save(r));
    }

    @Transactional(readOnly = true)
    public Page<PassengerReportResponse> queue(ReportStatus status, ReportedEntityType entityType, Pageable pageable) {
        return reports.findQueue(status, entityType, pageable).map(this::toResponse);
    }

    @Transactional
    public PassengerReportResponse resolve(Caller staff, UUID reportId, String note) {
        PassengerReport r = reports.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("No report " + reportId));
        if (r.getStatus() == ReportStatus.RESOLVED) {
            throw new ConflictException("This report is already resolved");
        }
        r.setStatus(ReportStatus.RESOLVED);
        r.setResolvedBy(staff.userId());
        r.setResolvedAt(Instant.now());
        r.setResolutionNote(blankToNull(note));
        return toResponse(reports.save(r));
    }

    private void requireTargetExists(ReportedEntityType type, UUID targetId) {
        boolean exists = type == ReportedEntityType.SCHEDULE
                ? schedules.existsById(targetId)
                : workings.existsById(targetId);
        if (!exists) {
            throw new ResourceNotFoundException("Nothing found to report there");
        }
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.strip();
    }

    private PassengerReportResponse toResponse(PassengerReport r) {
        return new PassengerReportResponse(r.getId(), r.getEntityType(), r.getTargetId(), r.getReason(),
                r.getNote(), r.getStatus(), r.getCreatedAt(), r.getResolvedAt(), r.getResolutionNote());
    }
}
