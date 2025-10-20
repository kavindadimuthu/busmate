package com.busmatelk.backend.controller;

import com.busmatelk.backend.dto.ConductorDTO;
import com.busmatelk.backend.dto.MotDTO;
import com.busmatelk.backend.service.MotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/mot")
@CrossOrigin
public class MotController {

    @Autowired
    private MotService motService;

    @PostMapping(path = "/register")
    public String addMotUser(@RequestBody MotDTO motDTO) {
        // System.out.println(conductorDTO);
        motService.createMotUser(motDTO);
        return "success";
    }

    @GetMapping(path = "/profile")
    public MotDTO getMotById(@RequestParam String userId) {
        // System.out.println(conductorService.getconductorsById(userId));
        return motService.getMotById(userId);
    }

    @PutMapping(path = "/update")
    public MotDTO updateMotUser(@RequestParam String userId, @RequestParam String fullName, @RequestParam String phoneNumber) {
        return motService.updateMotUser(userId, fullName, phoneNumber);
    }


}
