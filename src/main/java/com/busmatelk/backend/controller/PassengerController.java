package com.busmatelk.backend.controller;


import com.busmatelk.backend.dto.PassengerDTO;
import com.busmatelk.backend.dto.request.PassengerUpdateDTO;
import com.busmatelk.backend.service.PassengerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/passenger")
@CrossOrigin
public class PassengerController {

    @Autowired
    private PassengerService passengerService;

    @PostMapping(path = "/register")
    public String addPassenger(@RequestBody PassengerDTO passengerDTO) {
        //System.out.println(passengerDTO);
        passengerService.createPassenger(passengerDTO);
        return "success";
    }

    @GetMapping(path = "/profile")
    public PassengerDTO getPassengerById(@RequestParam UUID userId) {
        return  passengerService.getPassengerById(userId);
    }

    @PutMapping(path = "/update/{userId}")
    public ResponseEntity<PassengerDTO> updatePassenger(
            @PathVariable UUID userId,
            @RequestBody PassengerUpdateDTO updateDTO) {
        try {
            PassengerDTO updatedPassenger = passengerService.updatePassenger(userId, updateDTO);
            return ResponseEntity.ok(updatedPassenger);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping(path = "/all")
    public ResponseEntity<List<PassengerDTO>> getAllPassengers() {
        try {
            List<PassengerDTO> passengers = passengerService.getAllPassengers();
            return ResponseEntity.ok(passengers);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
