package com.busmate.ticketing_service.service.impl;

import com.busmate.ticketing_service.dto.BaseFareDTO;
import com.busmate.ticketing_service.entity.BaseFare;
import com.busmate.ticketing_service.repository.BaseFareRepo;
import com.busmate.ticketing_service.service.BaseFareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BaseFareServiceIMPL implements BaseFareService {

    @Autowired
    private BaseFareRepo baseFareRepo;


    @Override
    public String getBaseFareBySection(String section, String type) {
        int sectionId;
        try {
            sectionId = Integer.parseInt(section);
        } catch (NumberFormatException e) {
            return "Invalid section";
        }

        BaseFare baseFare = baseFareRepo.findById(sectionId).orElse(null);
        if (baseFare == null) {
            return "Section not found";
        }

        Double fareValue;
        switch (type.toLowerCase()) {
            case "normal":
                fareValue = baseFare.getNormalFare();
                break;
            case "semiluxury":
                fareValue = baseFare.getSemiLuxuryFare();
                break;
            case "luxury":
                fareValue = baseFare.getLuxuryFare();
                break;
            case "superluxury":
                fareValue = baseFare.getSuperLuxuryFare();
                break;
            case "expresswaysuperluxury":
                fareValue = baseFare.getExpresswaySuperLuxuryFare();
                break;
            default:
                return "Invalid type";
        }
        if (fareValue == null)
            return "Fare not available for the specified type";
        return String.format("%.2f", fareValue);
    }

@Override
    public void saveSection(BaseFareDTO baseFareDTO) {
        BaseFare baseFare = new BaseFare(
                baseFareDTO.getSection(),
                baseFareDTO.getNormalFare(),
                baseFareDTO.getSemiLuxuryFare(),
                baseFareDTO.getLuxuryFare(),
                baseFareDTO.getSuperLuxuryFare(),
                baseFareDTO.getExpresswaySuperLuxuryFare()


        );
        if(!baseFareRepo.existsById(baseFare.getSection())) {
            baseFareRepo.save(baseFare);
        } else {
            throw new IllegalArgumentException("Section already exists");
        }
    }
}
