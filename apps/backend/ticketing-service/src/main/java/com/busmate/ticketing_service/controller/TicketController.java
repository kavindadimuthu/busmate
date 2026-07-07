package com.busmate.ticketing_service.controller;

import com.busmate.ticketing_service.dto.request.PaymentRequestDTO;
import com.busmate.ticketing_service.dto.request.TicketValidationRequestDTO;
import com.busmate.ticketing_service.dto.response.ConductorLogTicketDTO;
import com.busmate.ticketing_service.dto.response.TripSummaryDTO;
import com.busmate.ticketing_service.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tickets")
@CrossOrigin("*")
public class TicketController {

    @Autowired
    private PaymentService conductorLogService;

    @PostMapping("/conductor/issue")
    public ResponseEntity<ConductorLogTicketDTO> createTicket(@RequestBody PaymentRequestDTO request) {
        ConductorLogTicketDTO ticketDetails = conductorLogService.issueTicket(request);
        return ResponseEntity.ok(ticketDetails);
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
