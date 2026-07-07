package com.busmate.ticketing_service.service.impl;

import com.busmate.ticketing_service.dto.RouteFareDTO;
import com.busmate.ticketing_service.dto.request.FareCalculationRequestDTO;
import com.busmate.ticketing_service.entity.RouteFare;
import com.busmate.ticketing_service.repository.RouteFareRepo;
import com.busmate.ticketing_service.service.RouteFareService;
import com.busmate.ticketing_service.service.BaseFareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;
@Service
public class RouteFareServiceIMPL implements RouteFareService {

    @Autowired
    private RouteFareRepo routeFareRepo;

    @Autowired
    private BaseFareService baseFareService;

    @Override
    public boolean saveRouteFare(RouteFareDTO routeFareDTO) {

        // Check if route fare already exists for same section ID and section name
        if (!routeFareRepo.existsBySectionIdAndSectionName(
                routeFareDTO.getSectionId(),
                routeFareDTO.getSectionName())) {

            RouteFare routeFare = new RouteFare();
            routeFare.setRouteId(routeFareDTO.getRouteId());
            routeFare.setSectionId(routeFareDTO.getSectionId());
            routeFare.setSectionName(routeFareDTO.getSectionName());
            routeFare.setDistanceFromStart(routeFareDTO.getDistanceFromStart());

            routeFareRepo.save(routeFare);
            return true;


        } else {
            return false;
        }
    }

    @Override
    public String calculateFare(FareCalculationRequestDTO requestDTO) {
        try {
            // Step 1: Find boarding point section
            int boardingSectionId = findSectionForBoardingPoint(
                    requestDTO.getRouteId(),
                    requestDTO.getDistanceFromStartToBoardingPoint()
            );

            // Step 2: Find alighting point section
            int alightingSectionId = findSectionForAlightingPoint(
                    requestDTO.getRouteId(),
                    requestDTO.getDistanceFromStartToAlightingPoint()
            );

            // Step 3: Calculate section difference
            int sectionDifference = alightingSectionId - boardingSectionId;

            if (sectionDifference <= 0) {
                return "Invalid journey: Alighting point must be after boarding point";
            }
            // Step 4: Get fare from BaseFare table using existing API
            String fare = baseFareService.getBaseFareBySection(
                    String.valueOf(sectionDifference),
                    requestDTO.getBusType()
            );

            return fare;


        } catch (Exception e) {
            return "Error calculating fare: " + e.getMessage();
        }
    }

    private int findSectionForBoardingPoint(String routeId, double distance) {
        // Check for exact match first
        Optional<RouteFare> exactMatch = routeFareRepo.findByRouteIdAndDistanceFromStart(routeId, distance);
        if (exactMatch.isPresent()) {
            return exactMatch.get().getSectionId();
        }

        //  first find latest lower distance (33, 32 if looking for 34)
        Optional<RouteFare> lowerDistance = routeFareRepo.findLatestLowerDistance(routeId, distance);
        if (lowerDistance.isPresent()) {
            return lowerDistance.get().getSectionId();
        }

        throw new RuntimeException("No boarding section found for distance: " + distance);
    }

    private int findSectionForAlightingPoint(String routeId, double distance) {
        // Check for exact match first
        Optional<RouteFare> exactMatch = routeFareRepo.findByRouteIdAndDistanceFromStart(routeId, distance);
        if (exactMatch.isPresent()) {
            return exactMatch.get().getSectionId();
        }

        // Find latest higher distance (35, 36 if looking for 34)
        Optional<RouteFare> higherDistance = routeFareRepo.findLatestHigherDistance(routeId, distance);
        if (higherDistance.isPresent()) {
            return higherDistance.get().getSectionId();
        }

        throw new RuntimeException("No alighting section found for distance: " + distance);
    }
}