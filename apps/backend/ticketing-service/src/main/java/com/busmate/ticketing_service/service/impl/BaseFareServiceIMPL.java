package com.busmate.ticketing_service.service.impl;

import com.busmate.ticketing_service.dto.BaseFareDTO;
import com.busmate.ticketing_service.entity.BaseFare;
import com.busmate.ticketing_service.exception.BadRequestException;
import com.busmate.ticketing_service.exception.NotFoundException;
import com.busmate.ticketing_service.fare.ServiceClass;
import com.busmate.ticketing_service.repository.BaseFareRepo;
import com.busmate.ticketing_service.service.BaseFareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

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

        Optional<ServiceClass> serviceClass = ServiceClass.resolve(type);
        if (serviceClass.isEmpty()) {
            return "Invalid type";
        }

        // Kept returning prose on failure for the existing public endpoint's callers; new callers
        // should use fareFor(), which cannot be mistaken for a price.
        try {
            return String.format("%.2f", fareFor(sectionId, serviceClass.get()));
        } catch (NotFoundException e) {
            return "Section not found";
        } catch (BadRequestException e) {
            return "Fare not available for the specified type";
        }
    }

    @Override
    public BigDecimal fareFor(int sectionDifference, ServiceClass serviceClass) {
        BaseFare baseFare = baseFareRepo.findById(sectionDifference)
                .orElseThrow(() -> new NotFoundException(
                        "No fare is published for a journey of " + sectionDifference + " fare sections"));

        Double fareValue = switch (serviceClass) {
            case NORMAL -> baseFare.getNormalFare();
            case SEMI_LUXURY -> baseFare.getSemiLuxuryFare();
            case LUXURY -> baseFare.getLuxuryFare();
            case SUPER_LUXURY -> baseFare.getSuperLuxuryFare();
            case EXPRESSWAY_SUPER_LUXURY -> baseFare.getExpresswaySuperLuxuryFare();
        };

        if (fareValue == null) {
            throw new BadRequestException(
                    "No " + serviceClass.name() + " fare is published for this journey length");
        }
        return BigDecimal.valueOf(fareValue).setScale(2, RoundingMode.HALF_UP);
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
