package com.busmatelk.backend.controller;

import com.busmatelk.backend.dto.ConductorDTO;
import com.busmatelk.backend.service.ConductorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/conductor")
@CrossOrigin
public class ConductorController {

    @Autowired
    private ConductorService conductorService;

    @PostMapping(path = "/register")
    public String createConductor(@RequestBody ConductorDTO conductorDTO) {
        System.out.println(conductorDTO);
        conductorService.createConductor(conductorDTO);
        return "success";
    }

    @GetMapping(path="/profile")
    public ConductorDTO getConductorsById( @RequestParam UUID userId) {
//        System.out.println(conductorService.getconductorsById(userId));
        return conductorService.getconductorsById(userId);

    }


    @PutMapping(path = "/update")
    public ConductorDTO updateConductor(@RequestBody ConductorDTO conductorDTO, @RequestParam UUID userId) {
        return conductorService.updateconductor(conductorDTO,userId);
    }

    @GetMapping(path = "/all")
    public List<ConductorDTO> getAllConductors() {
        try {
            return conductorService.getAllConductors();
        } catch (Exception e) {
            // Handle exceptions appropriately, e.g., log the error or return an error response
            e.printStackTrace();
            throw new RuntimeException("Failed to retrieve conductors: " + e.getMessage());
        }
    }

    @DeleteMapping(path = "/delete/{userId}")
    public String deleteConductor(@PathVariable UUID userId) {
        try {
            conductorService.deleteConductor(userId);
            return "Conductor deleted successfully";
        } catch (Exception e) {
            // Handle exceptions appropriately, e.g., log the error or return an error response
            e.printStackTrace();
            return "Failed to delete conductor: " + e.getMessage();
        }
    }
}
