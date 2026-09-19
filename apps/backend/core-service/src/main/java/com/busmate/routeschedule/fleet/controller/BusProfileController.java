package com.busmate.routeschedule.fleet.controller;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.busmate.routeschedule.fleet.dto.request.BusAvailabilityRequest;
import com.busmate.routeschedule.fleet.dto.request.BusMediaUpdateRequest;
import com.busmate.routeschedule.fleet.dto.response.BusMediaResponse;
import com.busmate.routeschedule.fleet.dto.response.BusResponse;
import com.busmate.routeschedule.fleet.entity.Bus;
import com.busmate.routeschedule.fleet.enums.BusMediaKindEnum;
import com.busmate.routeschedule.fleet.service.BusProfileService;
import com.busmate.routeschedule.licensing.dto.request.StatusReasonRequest;
import com.busmate.routeschedule.licensing.dto.response.BusPassengerServicePermitAssignmentResponse;
import com.busmate.routeschedule.shared.security.CallerContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * A bus's profile beyond its core record (INC-018): availability, retirement and suspension,
 * permit links, and its photos and documents. The owning operator and MOT/admin use the same
 * endpoints; {@link BusProfileService#requireManageable} decides who may act on which bus.
 */
@RestController
@PreAuthorize("hasAnyRole('ADMIN', 'MOT', 'OPERATOR')")
@RequestMapping("/api/buses/{busId}")
@RequiredArgsConstructor
@Tag(name = "Bus Profile", description = "Availability, status, photos and documents of a bus")
public class BusProfileController {

    private final BusProfileService busProfileService;
    private final CallerContext callerContext;

    @PutMapping("/availability")
    @Operation(summary = "Mark a bus available, or out of use for a period", operationId = "setBusAvailability")
    public ResponseEntity<BusResponse> setAvailability(@PathVariable UUID busId, @Valid @RequestBody BusAvailabilityRequest request) {
        Bus bus = busProfileService.requireManageable(busId);
        return ResponseEntity.ok(busProfileService.setAvailability(bus, request, callerContext.require()));
    }

    @GetMapping("/availability/impact")
    @Operation(summary = "How many pending trips a bus is assigned to within a date window",
            description = "Shown before marking a bus unavailable so the operator knows which trips need another bus.",
            operationId = "getBusAvailabilityImpact")
    public ResponseEntity<Map<String, Long>> availabilityImpact(
            @PathVariable UUID busId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate until) {
        busProfileService.requireManageable(busId);
        return ResponseEntity.ok(Map.of(
                "pendingTrips", busProfileService.pendingTripsBetween(busId, from, until),
                "upcomingTrips", busProfileService.upcomingTrips(busId)));
    }

    @PostMapping("/retire")
    @Operation(summary = "Retire a bus that no longer runs; ends its permit links", operationId = "retireBus")
    public ResponseEntity<BusResponse> retire(@PathVariable UUID busId, @Valid @RequestBody StatusReasonRequest request) {
        Bus bus = busProfileService.requireManageable(busId);
        return ResponseEntity.ok(busProfileService.retire(bus, request.getReason(), callerContext.require()));
    }

    @PostMapping("/suspend")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @Operation(summary = "Suspend a bus from service (MOT)", operationId = "suspendBus")
    public ResponseEntity<BusResponse> suspend(@PathVariable UUID busId, @Valid @RequestBody StatusReasonRequest request) {
        Bus bus = busProfileService.requireManageable(busId);
        return ResponseEntity.ok(busProfileService.suspend(bus, request.getReason(), callerContext.require()));
    }

    @PostMapping("/reinstate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @Operation(summary = "Return a suspended or retired bus to service (MOT)", operationId = "reinstateBus")
    public ResponseEntity<BusResponse> reinstate(@PathVariable UUID busId) {
        Bus bus = busProfileService.requireManageable(busId);
        return ResponseEntity.ok(busProfileService.reinstate(bus, callerContext.require()));
    }

    @PutMapping("/default-conductor")
    @Operation(summary = "Set or clear the conductor who usually works this bus",
            description = "Pre-fills trip assignments only; the trip's own conductor is the record. Body: {\"conductorId\": uuid|null}.",
            operationId = "setBusDefaultConductor")
    public ResponseEntity<BusResponse> setDefaultConductor(@PathVariable UUID busId, @RequestBody Map<String, UUID> body) {
        Bus bus = busProfileService.requireManageable(busId);
        return ResponseEntity.ok(busProfileService.setDefaultConductor(bus, body.get("conductorId"), callerContext.require()));
    }

    @GetMapping("/permit-links")
    @Operation(summary = "The permits this bus is (and was) authorised under", operationId = "getBusPermitLinks")
    public ResponseEntity<List<BusPassengerServicePermitAssignmentResponse>> permitLinks(@PathVariable UUID busId) {
        return ResponseEntity.ok(busProfileService.permitLinks(busProfileService.requireManageable(busId)));
    }

    @GetMapping("/media")
    @Operation(summary = "A bus's photos and documents (metadata)", operationId = "listBusMedia")
    public ResponseEntity<List<BusMediaResponse>> listMedia(@PathVariable UUID busId) {
        return ResponseEntity.ok(busProfileService.listMedia(busProfileService.requireManageable(busId)));
    }

    @PostMapping(value = "/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Add a photo or document to a bus",
            description = "kind = PHOTO (JPEG/PNG; re-encoded, metadata stripped) or DOCUMENT (PDF or image). "
                    + "Documents need a documentType and may carry an expiry date.",
            operationId = "uploadBusMedia")
    public ResponseEntity<BusMediaResponse> upload(
            @PathVariable UUID busId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("kind") String kind,
            @RequestParam(value = "documentType", required = false) String documentType,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "expiryDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate expiryDate)
            throws IOException {
        Bus bus = busProfileService.requireManageable(busId);
        return new ResponseEntity<>(busProfileService.upload(bus, kind, documentType, title, expiryDate,
                file.getBytes(), callerContext.require()), HttpStatus.CREATED);
    }

    @PatchMapping("/media/{mediaId}")
    @Operation(summary = "Edit a photo's or document's details, or make a photo the cover", operationId = "updateBusMedia")
    public ResponseEntity<BusMediaResponse> updateMedia(@PathVariable UUID busId, @PathVariable UUID mediaId,
                                                        @Valid @RequestBody BusMediaUpdateRequest request) {
        Bus bus = busProfileService.requireManageable(busId);
        return ResponseEntity.ok(busProfileService.updateMedia(bus, mediaId, request, callerContext.require()));
    }

    @DeleteMapping("/media/{mediaId}")
    @Operation(summary = "Delete a photo or document", operationId = "deleteBusMedia")
    public ResponseEntity<Void> deleteMedia(@PathVariable UUID busId, @PathVariable UUID mediaId) {
        busProfileService.deleteMedia(busProfileService.requireManageable(busId), mediaId);
        return ResponseEntity.noContent().build();
    }

    /**
     * The bytes. A document is always an attachment and sandboxed: a stored PDF is served as
     * uploaded, so it must never be rendered as active content by this origin.
     */
    @GetMapping(value = "/media/{mediaId}/content",
            produces = { MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE, MediaType.APPLICATION_PDF_VALUE })
    @Operation(summary = "Download a photo or document", operationId = "getBusMediaContent")
    public ResponseEntity<byte[]> content(@PathVariable UUID busId, @PathVariable UUID mediaId) {
        BusProfileService.MediaContent content = busProfileService.content(busProfileService.requireManageable(busId), mediaId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(content.media().getContentType()));
        headers.set("X-Content-Type-Options", "nosniff");
        headers.setCacheControl(CacheControl.noCache().cachePrivate());
        if (content.media().getKind() == BusMediaKindEnum.DOCUMENT) {
            headers.set("Content-Security-Policy", "sandbox");
            String extension = "application/pdf".equals(content.media().getContentType()) ? ".pdf"
                    : "image/png".equals(content.media().getContentType()) ? ".png" : ".jpg";
            headers.setContentDisposition(ContentDisposition.attachment()
                    .filename(content.media().getDocumentType().name().toLowerCase() + extension).build());
        }
        return new ResponseEntity<>(content.bytes(), headers, HttpStatus.OK);
    }
}
