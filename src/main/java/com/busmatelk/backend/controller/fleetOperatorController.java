package com.busmatelk.backend.controller;

import com.busmatelk.backend.dto.fleetOperatorDTO;
import com.busmatelk.backend.kafka.OperatorProducer;
import com.busmatelk.backend.service.fleetOperatorProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.persistence.EntityNotFoundException;
import java.util.UUID;


@RestController
@RequestMapping("/api/fleetoperator")
@CrossOrigin
public class fleetOperatorController {

    @Autowired
    private fleetOperatorProfileService fleetOperatorProfileService;

    @Autowired
    private OperatorProducer operatorProducer;



    @PostMapping("/register")
    public ResponseEntity<?> registerFleetOperator(@RequestBody fleetOperatorDTO fleetOperatorDTO) {
        try {
            fleetOperatorProfileService.addfleetOperatorProfile(fleetOperatorDTO);
            // Optionally, you can publish an event to Kafka here if needed

            operatorProducer.publishOperatorCreated(fleetOperatorDTO.toJson());
            return ResponseEntity.status(HttpStatus.CREATED).body("Fleet operator registered successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error occurred: " + e.getMessage());
        }

    }

    @GetMapping(path = "/profile")
    public fleetOperatorDTO getFleetOperatorProfile(@RequestParam UUID userId){
       return fleetOperatorProfileService.getFleetoperatorById(userId);
    }

    @PutMapping(path = "/update")
    public ResponseEntity<?> updateFleetOperatorProfile(
            @RequestParam UUID userId,
            @RequestBody fleetOperatorDTO fleetOperatorDTO) {
        try {
            fleetOperatorProfileService.updateFleetOperatorProfile(userId, fleetOperatorDTO, null);
            return ResponseEntity.ok("Fleet operator profile updated successfully.");
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Error: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error occurred: " + e.getMessage());
        }
    }
    @DeleteMapping(path = "/delete/{userId}")
    public ResponseEntity<?> deleteFleetOperator(@PathVariable UUID userId) {
        try {
            fleetOperatorProfileService.deleteFleetOperator(userId);
            return ResponseEntity.ok("Fleet operator deleted successfully.");
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error occurred: " + e.getMessage());
        }
    }

}
