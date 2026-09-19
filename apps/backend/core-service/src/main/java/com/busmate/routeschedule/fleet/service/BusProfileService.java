package com.busmate.routeschedule.fleet.service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.busmate.routeschedule.fleet.dto.request.BusAvailabilityRequest;
import com.busmate.routeschedule.fleet.dto.request.BusMediaUpdateRequest;
import com.busmate.routeschedule.fleet.dto.request.OperatorBusRequest;
import com.busmate.routeschedule.fleet.dto.response.BusMediaResponse;
import com.busmate.routeschedule.fleet.dto.response.BusResponse;
import com.busmate.routeschedule.fleet.entity.Bus;
import com.busmate.routeschedule.fleet.entity.BusMedia;
import com.busmate.routeschedule.fleet.enums.BusAvailabilityEnum;
import com.busmate.routeschedule.fleet.enums.BusDocumentTypeEnum;
import com.busmate.routeschedule.fleet.enums.BusMediaKindEnum;
import com.busmate.routeschedule.fleet.repository.BusMediaRepository;
import com.busmate.routeschedule.fleet.repository.BusRepository;
import com.busmate.routeschedule.fleet.security.OperatorAccess;
import com.busmate.routeschedule.licensing.dto.response.BusPassengerServicePermitAssignmentResponse;
import com.busmate.routeschedule.licensing.repository.BusPassengerServicePermitAssignmentRepository;
import com.busmate.routeschedule.licensing.service.PermitBusLinks;
import com.busmate.routeschedule.operations.repository.TripRepository;
import com.busmate.routeschedule.shared.enums.StatusEnum;
import com.busmate.routeschedule.shared.exception.BadRequestException;
import com.busmate.routeschedule.shared.exception.ConflictException;
import com.busmate.routeschedule.shared.exception.ResourceNotFoundException;
import com.busmate.routeschedule.shared.media.DocumentSanitizer;
import com.busmate.routeschedule.shared.media.ImageSanitizer;
import com.busmate.routeschedule.shared.media.MediaStorageService;
import com.busmate.routeschedule.shared.security.Caller;

import lombok.RequiredArgsConstructor;

/**
 * An operator keeping a bus's profile current, and MOT overseeing it (INC-018): registration
 * details, day-to-day availability, retirement, suspension, and the bus's photos and documents.
 *
 * <p>Every method that takes a bus first establishes that the caller may act on it — staff on any
 * bus, an operator only on their own — through {@link #requireManageable}.
 */
@Service
@RequiredArgsConstructor
public class BusProfileService {

    static final int MAX_PHOTOS = 12;
    static final int MAX_DOCUMENTS = 30;

    private final BusService busService;
    private final BusRepository busRepository;
    private final BusMediaRepository mediaRepository;
    private final BusPassengerServicePermitAssignmentRepository linkRepository;
    private final PermitBusLinks permitBusLinks;
    private final TripRepository tripRepository;
    private final OperatorAccess operatorAccess;
    private final MediaStorageService storage;
    private final ImageSanitizer imageSanitizer;
    private final DocumentSanitizer documentSanitizer;
    private final com.busmate.routeschedule.shared.client.ConductorDirectory conductorDirectory;

    @org.springframework.beans.factory.annotation.Value("${media.max-upload-bytes}")
    private long maxUploadBytes;

    // ------------------------------------------------------------------ access

    /** The bus, if the caller may act on it: staff on any, an operator on their own. */
    public Bus requireManageable(UUID busId) {
        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + busId));
        operatorAccess.requireAccess(bus.getOperator().getId());
        return bus;
    }

    // ------------------------------------------------------------------ operator register / edit

    @Transactional
    public BusResponse createForOperator(UUID operatorId, OperatorBusRequest request, Caller caller) {
        return busService.createBus(request.toBusRequest(operatorId, StatusEnum.active.name()), caller.auditId());
    }

    @Transactional
    public BusResponse updateForOperator(UUID operatorId, UUID busId, OperatorBusRequest request, Caller caller) {
        Bus bus = busRepository.findById(busId)
                .filter(b -> b.getOperator().getId().equals(operatorId))
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + busId));
        if (bus.getStatus() == StatusEnum.cancelled) {
            throw new ConflictException("A retired bus cannot be edited");
        }
        if (!bus.getServiceClass().name().equals(request.getServiceClass()) && linkRepository.findActiveByBusId(busId).size() > 0) {
            throw new ConflictException("End this bus's permit links before changing its service class; "
                    + "the permits were matched to the current class");
        }
        // Status is not the operator's to change here; keep whatever it is.
        return busService.updateBus(busId, request.toBusRequest(operatorId, bus.getStatus().name()), caller.auditId());
    }

    // ------------------------------------------------------------------ availability & status

    @Transactional
    public BusResponse setAvailability(Bus bus, BusAvailabilityRequest request, Caller caller) {
        BusAvailabilityEnum availability;
        try {
            availability = BusAvailabilityEnum.valueOf(request.getAvailability());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Availability must be AVAILABLE, UNDER_MAINTENANCE or OFF_ROAD");
        }
        if (availability == BusAvailabilityEnum.AVAILABLE) {
            bus.setAvailabilityFrom(null);
            bus.setAvailabilityUntil(null);
            bus.setAvailabilityNote(null);
        } else {
            LocalDate from = request.getFrom() != null ? request.getFrom() : LocalDate.now();
            if (request.getUntil() != null && request.getUntil().isBefore(from)) {
                throw new BadRequestException("The last unavailable day cannot be before the first");
            }
            bus.setAvailabilityFrom(from);
            bus.setAvailabilityUntil(request.getUntil());
            bus.setAvailabilityNote(request.getNote() != null && !request.getNote().isBlank() ? request.getNote().trim() : null);
        }
        bus.setAvailability(availability);
        bus.setUpdatedBy(caller.auditId());
        busRepository.save(bus);
        return busService.getBusById(bus.getId());
    }

    /** Pending trips the bus is assigned to inside [from, until] — what an availability change affects. */
    public long pendingTripsBetween(UUID busId, LocalDate from, LocalDate until) {
        return tripRepository.countPendingForBusBetween(busId, from != null ? from : LocalDate.now(), until);
    }

    public long upcomingTrips(UUID busId) {
        return tripRepository.countUpcomingByBusId(busId);
    }

    /**
     * Retire a bus the operator no longer runs. It keeps its history (trips, tickets, links) but
     * leaves every permit and can no longer be assigned or edited.
     */
    @Transactional
    public BusResponse retire(Bus bus, String reason, Caller caller) {
        if (bus.getStatus() == StatusEnum.cancelled) {
            throw new ConflictException("This bus is already retired");
        }
        linkRepository.findActiveByBusId(bus.getId()).forEach(link -> permitBusLinks.end(link, caller.auditId()));
        return setStatus(bus, StatusEnum.cancelled, reason, caller);
    }

    @Transactional
    public BusResponse suspend(Bus bus, String reason, Caller caller) {
        if (bus.getStatus() != StatusEnum.active) {
            throw new ConflictException("Only an active bus can be suspended (this one is " + bus.getStatus() + ")");
        }
        return setStatus(bus, StatusEnum.inactive, reason, caller);
    }

    @Transactional
    public BusResponse reinstate(Bus bus, Caller caller) {
        if (bus.getStatus() == StatusEnum.active) {
            throw new ConflictException("This bus is already active");
        }
        return setStatus(bus, StatusEnum.active, null, caller);
    }

    private BusResponse setStatus(Bus bus, StatusEnum status, String reason, Caller caller) {
        bus.setStatus(status);
        bus.setStatusReason(reason != null ? reason.trim() : null);
        bus.setUpdatedBy(caller.auditId());
        busRepository.save(bus);
        return busService.getBusById(bus.getId());
    }

    /**
     * Sets or clears the conductor who usually works the bus (design R5). The conductor must be an
     * active account working for the bus's own operator.
     */
    @Transactional
    public BusResponse setDefaultConductor(Bus bus, UUID conductorId, Caller caller) {
        if (bus.getStatus() == StatusEnum.cancelled) {
            throw new ConflictException("A retired bus cannot have a default conductor");
        }
        if (conductorId != null) {
            var conductor = conductorDirectory.find(conductorId)
                    .orElseThrow(() -> new BadRequestException("No conductor account with id " + conductorId));
            if (!conductor.worksFor(bus.getOperator().getId())) {
                throw new ConflictException("The conductor does not work for this bus's operator");
            }
            if (!conductor.isActive()) {
                throw new ConflictException("The conductor's account is not active");
            }
        }
        bus.setDefaultConductorId(conductorId);
        bus.setUpdatedBy(caller.auditId());
        busRepository.save(bus);
        return busService.getBusById(bus.getId());
    }

    public List<BusPassengerServicePermitAssignmentResponse> permitLinks(Bus bus) {
        return permitBusLinks.forBus(bus.getId());
    }

    // ------------------------------------------------------------------ media

    public List<BusMediaResponse> listMedia(Bus bus) {
        return mediaRepository.findByBusIdOrderByCreatedAtAsc(bus.getId()).stream().map(BusProfileService::toResponse).toList();
    }

    @Transactional
    public BusMediaResponse upload(Bus bus, String kindValue, String documentTypeValue, String title,
                                   LocalDate expiryDate, byte[] bytes, Caller caller) {
        BusMediaKindEnum kind = parseKind(kindValue);
        if (bus.getStatus() == StatusEnum.cancelled) {
            throw new ConflictException("A retired bus's media cannot be changed");
        }
        if (bytes == null || bytes.length == 0) {
            throw new BadRequestException("No file was uploaded.");
        }
        if (bytes.length > maxUploadBytes) {
            throw new BadRequestException("The file is too large: " + bytes.length + " bytes, and the limit is "
                    + maxUploadBytes + " bytes.");
        }
        long existing = mediaRepository.countByBusIdAndKind(bus.getId(), kind);
        int limit = kind == BusMediaKindEnum.PHOTO ? MAX_PHOTOS : MAX_DOCUMENTS;
        if (existing >= limit) {
            throw new ConflictException("A bus can have at most " + limit + " " + kind.name().toLowerCase() + "s");
        }

        BusDocumentTypeEnum documentType = null;
        if (kind == BusMediaKindEnum.DOCUMENT) {
            documentType = parseDocumentType(documentTypeValue);
        }
        // Sanitise before storing, so a rejected upload leaves nothing behind.
        ImageSanitizer.SanitizedImage clean = kind == BusMediaKindEnum.PHOTO
                ? imageSanitizer.sanitize(bytes)
                : documentSanitizer.sanitize(bytes);

        BusMedia media = new BusMedia();
        media.setId(UUID.randomUUID());
        media.setBus(bus);
        media.setKind(kind);
        media.setDocumentType(documentType);
        media.setTitle(title != null && !title.isBlank() ? title.trim() : null);
        media.setExpiryDate(kind == BusMediaKindEnum.DOCUMENT ? expiryDate : null);
        media.setContentType(clean.contentType());
        media.setSizeBytes((long) clean.bytes().length);
        media.setStorageKey("buses/" + bus.getId() + "/" + (kind == BusMediaKindEnum.PHOTO ? "photos/" : "documents/") + media.getId());
        // The first photo becomes the cover, so a bus with photos always shows one.
        media.setCover(kind == BusMediaKindEnum.PHOTO && mediaRepository.findFirstByBusIdAndCoverTrue(bus.getId()).isEmpty());
        media.setCreatedBy(caller.auditId());
        media.setUpdatedBy(caller.auditId());

        storage.put(media.getStorageKey(), clean.bytes(), clean.contentType());
        return toResponse(mediaRepository.save(media));
    }

    @Transactional
    public BusMediaResponse updateMedia(Bus bus, UUID mediaId, BusMediaUpdateRequest request, Caller caller) {
        BusMedia media = requireMedia(bus, mediaId);
        if (request.getTitle() != null) {
            media.setTitle(request.getTitle().isBlank() ? null : request.getTitle().trim());
        }
        if (media.getKind() == BusMediaKindEnum.DOCUMENT) {
            if (request.getDocumentType() != null) {
                media.setDocumentType(parseDocumentType(request.getDocumentType()));
            }
            if (Boolean.TRUE.equals(request.getClearExpiryDate())) {
                media.setExpiryDate(null);
            } else if (request.getExpiryDate() != null) {
                media.setExpiryDate(request.getExpiryDate());
            }
        }
        if (Boolean.TRUE.equals(request.getCover())) {
            if (media.getKind() != BusMediaKindEnum.PHOTO) {
                throw new BadRequestException("Only a photo can be the cover");
            }
            mediaRepository.clearCover(bus.getId());
            // The clear detached everything; work on a fresh copy.
            media = requireMedia(bus, mediaId);
            media.setCover(true);
        }
        media.setUpdatedBy(caller.auditId());
        return toResponse(mediaRepository.save(media));
    }

    @Transactional
    public void deleteMedia(Bus bus, UUID mediaId) {
        BusMedia media = requireMedia(bus, mediaId);
        boolean wasCover = media.isCover();
        mediaRepository.delete(media);
        mediaRepository.flush();
        if (wasCover) {
            mediaRepository.findFirstByBusIdAndKindOrderByCreatedAtAsc(bus.getId(), BusMediaKindEnum.PHOTO)
                    .ifPresent(next -> {
                        next.setCover(true);
                        mediaRepository.save(next);
                    });
        }
        // Remove the bytes last: if this fails the row is already gone and the object is merely
        // orphaned, never the other way round (a row pointing at nothing).
        storage.delete(media.getStorageKey());
    }

    public record MediaContent(BusMedia media, byte[] bytes) {}

    public MediaContent content(Bus bus, UUID mediaId) {
        BusMedia media = requireMedia(bus, mediaId);
        byte[] bytes = storage.get(media.getStorageKey())
                .orElseThrow(() -> new ResourceNotFoundException("The file for this item is missing from storage"))
                .bytes();
        return new MediaContent(media, bytes);
    }

    private BusMedia requireMedia(Bus bus, UUID mediaId) {
        return mediaRepository.findById(mediaId)
                .filter(m -> m.getBus().getId().equals(bus.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Media not found with id: " + mediaId));
    }

    private static BusMediaKindEnum parseKind(String value) {
        try {
            return BusMediaKindEnum.valueOf(value);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new BadRequestException("kind must be PHOTO or DOCUMENT");
        }
    }

    private static BusDocumentTypeEnum parseDocumentType(String value) {
        try {
            return BusDocumentTypeEnum.valueOf(value);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new BadRequestException("documentType must be one of " + java.util.Arrays.toString(BusDocumentTypeEnum.values()));
        }
    }

    static BusMediaResponse toResponse(BusMedia media) {
        BusMediaResponse r = new BusMediaResponse();
        r.setId(media.getId());
        r.setBusId(media.getBus().getId());
        r.setKind(media.getKind().name());
        r.setDocumentType(media.getDocumentType() != null ? media.getDocumentType().name() : null);
        r.setTitle(media.getTitle());
        r.setContentType(media.getContentType());
        r.setSizeBytes(media.getSizeBytes());
        r.setCover(media.isCover());
        r.setExpiryDate(media.getExpiryDate());
        r.setExpired(media.getExpiryDate() != null && media.getExpiryDate().isBefore(LocalDate.now()));
        r.setCreatedAt(media.getCreatedAt());
        r.setCreatedBy(media.getCreatedBy());
        return r;
    }
}
