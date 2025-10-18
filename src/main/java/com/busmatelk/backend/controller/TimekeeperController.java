package com.busmatelk.backend.controller;


import com.busmatelk.backend.dto.TimekeeperDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.busmatelk.backend.service.TimekeeperService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/timekeeper")
@CrossOrigin
public class TimekeeperController {

    @Autowired
    private TimekeeperService timekeeperService;

    @PostMapping("/register")
    public ResponseEntity<?> signup(@RequestBody TimekeeperDTO signupDTO) {
        try {
            timekeeperService.createtimekeeper(signupDTO);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Signup successful");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/profile/{userId}")
    public ResponseEntity<?> getTimekeeperById(@PathVariable UUID userId) {
        try {
            TimekeeperDTO timekeeper = timekeeperService.getTimekeeperById(userId);
            return ResponseEntity.ok(timekeeper);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/all")
    public ResponseEntity<List<TimekeeperDTO>> getAllTimekeepers() {
        try {
            List<TimekeeperDTO> timekeepers = timekeeperService.getAllTimekeepers();
            return ResponseEntity.ok(timekeepers);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
