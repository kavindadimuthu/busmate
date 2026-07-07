package com.busmate.ticketing_service.controller;

import com.busmate.ticketing_service.dto.BaseFareDTO;
import com.busmate.ticketing_service.entity.BaseFare;
import com.busmate.ticketing_service.service.BaseFareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/baseFare")
@CrossOrigin
public class BaseFareController {

    @Autowired
    private BaseFareService baseFareService;

    @GetMapping(path = "/get-fare-by-sectionAnd-type", params = "section")
    public String getBaseFareBySectionAndType(String section, String type) {
        return baseFareService.getBaseFareBySection(section, type);
    }


    @PostMapping(path = "/save-section")
    public String saveBaseFare(@RequestBody BaseFareDTO baseFareDTO) {
     baseFareService.saveSection(baseFareDTO);
        return "Base fare saved successfully";
    }


}