package com.busmate.ticketing_service.controller;
import com.busmate.ticketing_service.dto.RouteFareDTO;
import com.busmate.ticketing_service.dto.request.FareCalculationRequestDTO;
import com.busmate.ticketing_service.service.RouteFareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/routeFare")
@CrossOrigin
public class RouteFareController {

    @Autowired
    private RouteFareService routeFareService;


    @PostMapping(path = "/save-route-fare-section")
    public ResponseEntity<String> saveRouteFare(@RequestBody RouteFareDTO routeFareDTO) {

      boolean saved=  routeFareService.saveRouteFare(routeFareDTO);
        if(saved){
            return ResponseEntity.ok("Route fare saved successfully");
        } else {
            return ResponseEntity.badRequest().body("Route fare already exists for this section");
        }
    }


    @PostMapping(path = "/calculate-fare")
    public ResponseEntity<String> calculateFare(@RequestBody FareCalculationRequestDTO requestDTO) {
        try {
            String fare = routeFareService.calculateFare(requestDTO);
            if (fare.startsWith("Error") || fare.startsWith("Invalid")) {
                return ResponseEntity.badRequest().body(fare);
            }
            return ResponseEntity.ok(fare);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error calculating fare: " + e.getMessage());
        }
    }

}
