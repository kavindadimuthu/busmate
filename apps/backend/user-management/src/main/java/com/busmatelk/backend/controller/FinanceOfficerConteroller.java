package com.busmatelk.backend.controller;

import com.busmatelk.backend.dto.FinanceOfficerDTO;
import com.busmatelk.backend.service.FinanceOfficerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/finance-officer")
@CrossOrigin
public class FinanceOfficerConteroller {

    @Autowired
    private FinanceOfficerService FinanceOfficerService;
    @PostMapping(path = "/register")
    public String addfinanceoffice(@RequestBody FinanceOfficerDTO financeOfficerDTO) {
        try{
            FinanceOfficerService.createFinanceOfficer(financeOfficerDTO);
            return "Finance officer created successfully";
        }catch(Exception e){

//            e.printStackTrace();
            return "Failed to create finance officer: " + e.getMessage();
        }

    }
}
