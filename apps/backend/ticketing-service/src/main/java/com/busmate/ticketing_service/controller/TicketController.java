package com.busmate.ticketing_service.controller;

import com.busmate.ticketing_service.dto.request.BookingRequestDTO;
import com.busmate.ticketing_service.dto.request.PaymentRequestDTO;
import com.busmate.ticketing_service.dto.request.TicketCancelRequestDTO;
import com.busmate.ticketing_service.dto.request.TicketValidationRequestDTO;
import com.busmate.ticketing_service.dto.response.BookingResponseDTO;
import com.busmate.ticketing_service.dto.response.ConductorLogTicketDTO;
import com.busmate.ticketing_service.dto.response.PaymentConfirmResponseDTO;
import com.busmate.ticketing_service.dto.response.TripSummaryDTO;
import com.busmate.ticketing_service.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/tickets")
@CrossOrigin("*")
@RequiredArgsConstructor
public class TicketController {

    private final PaymentService conductorLogService;

    @PostMapping("/conductor/issue")
    public ResponseEntity<ConductorLogTicketDTO> createTicket(@RequestBody PaymentRequestDTO request) {
        ConductorLogTicketDTO ticketDetails = conductorLogService.issueTicket(request);
        return ResponseEntity.ok(ticketDetails);
    }

    // ============================================================================
    // PASSENGER SELF-SERVICE BOOKING
    // ============================================================================

    @PostMapping("/book")
    public ResponseEntity<BookingResponseDTO> bookTicket(@RequestBody BookingRequestDTO request) {
        BookingResponseDTO response = conductorLogService.bookTicket(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/payment/{ticketId}/confirm")
    public ResponseEntity<PaymentConfirmResponseDTO> confirmPayment(@PathVariable Long ticketId) {
        return ResponseEntity.ok(conductorLogService.confirmPayment(ticketId));
    }

    @PostMapping("/{ticketId}/cancel")
    public ResponseEntity<ConductorLogTicketDTO> cancelTicket(
            @PathVariable Long ticketId,
            @RequestBody TicketCancelRequestDTO request) {
        return ResponseEntity.ok(conductorLogService.cancelTicket(ticketId, request));
    }

    // ============================================================================
    // ADMIN (OPERATOR / MOT) LISTING - paginated, filterable
    // ============================================================================

    @GetMapping
    public ResponseEntity<Page<ConductorLogTicketDTO>> getAllTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "issuedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) List<String> busIds,
            @RequestParam(required = false) String tripId,
            @RequestParam(required = false) String conductorId,
            @RequestParam(required = false) String passengerId,
            @RequestParam(required = false) String issueMethod,
            @RequestParam(required = false) String validationStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String search) {

        if (page < 0) page = 0;
        if (size <= 0) size = 10;
        if (size > 200) size = 200;

        List<String> allowedSort = List.of("issuedAt", "fareAmount", "ticketId");
        String sortField = allowedSort.contains(sortBy) ? sortBy : "issuedAt";
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortField).ascending() : Sort.by(sortField).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<ConductorLogTicketDTO> result = conductorLogService.getAllTicketsWithFilters(
                busIds, tripId, conductorId, passengerId, issueMethod, validationStatus,
                dateFrom, dateTo, search, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/conductor/{conductorId}/logs")
    public List<ConductorLogTicketDTO> getConductorLogs(@PathVariable String conductorId) {
        return conductorLogService.getConductorLogDetails(conductorId);
    }

    @GetMapping("/bus/{busId}")
    public List<ConductorLogTicketDTO> getTicketsByBusId(@PathVariable String busId) {
        return conductorLogService.getTicketDetailsByBusId(busId);
    }

    @GetMapping("/trip/{tripId}")
    public List<ConductorLogTicketDTO> getTicketsByTripId(@PathVariable String tripId) {
        return conductorLogService.getTicketDetailsByTripId(tripId);
    }

    @GetMapping("/trip/{tripId}/summary")
    public TripSummaryDTO getTripSummary(@PathVariable String tripId) {
        return conductorLogService.getTripSummary(tripId);
    }

    @GetMapping("/passenger/{passengerId}")
    public List<ConductorLogTicketDTO> getTicketsByPassengerId(@PathVariable String passengerId) {
        return conductorLogService.getTicketDetailsByPassengerId(passengerId);
    }

    @GetMapping("/{ticketId}")
    public ConductorLogTicketDTO getTicketById(@PathVariable Long ticketId) {
        return conductorLogService.getTicketDetailsById(ticketId);
    }

    @PostMapping("/validate")
    public ResponseEntity<String> validateTicket(@RequestBody TicketValidationRequestDTO requestDTO) {
        String result = conductorLogService.validateTicket(requestDTO);
        return ResponseEntity.ok(result);
    }

}
