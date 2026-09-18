package com.busmate.ticketing_service.service.impl;

import com.busmate.ticketing_service.dto.RouteFareDTO;
import com.busmate.ticketing_service.dto.request.FareCalculationRequestDTO;
import com.busmate.ticketing_service.entity.RouteFare;
import com.busmate.ticketing_service.repository.RouteFareRepo;
import com.busmate.ticketing_service.service.RouteFareService;
import com.busmate.ticketing_service.service.BaseFareService;
import com.busmate.ticketing_service.exception.BadRequestException;
import com.busmate.ticketing_service.fare.ServiceClass;

import java.math.BigDecimal;
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
        // Public endpoint contract, unchanged: failures are prose in the success channel. New
        // callers use priceJourney() instead - see BaseFareService.fareFor().
        try {
            ServiceClass serviceClass = ServiceClass.resolve(requestDTO.getBusType())
                    .orElseThrow(() -> new BadRequestException("Invalid type"));
            BigDecimal fare = priceJourney(
                    requestDTO.getRouteId(),
                    requestDTO.getDistanceFromStartToBoardingPoint(),
                    requestDTO.getDistanceFromStartToAlightingPoint(),
                    serviceClass);
            return String.format("%.2f", fare);
        } catch (BadRequestException e) {
            return e.getMessage();
        } catch (Exception e) {
            return "Error calculating fare: " + e.getMessage();
        }
    }

    @Override
    public BigDecimal priceJourney(String routeId, double boardingDistanceKm,
            double alightingDistanceKm, ServiceClass serviceClass) {
        if (routeId == null || routeId.isBlank()) {
            throw new BadRequestException("A route is required to price a journey");
        }

        int boardingSectionId = findSectionForBoardingPoint(routeId, boardingDistanceKm);
        int alightingSectionId = findSectionForAlightingPoint(routeId, alightingDistanceKm);

        int sectionDifference = alightingSectionId - boardingSectionId;
        if (sectionDifference <= 0) {
            throw new BadRequestException("Invalid journey: Alighting point must be after boarding point");
        }

        return baseFareService.fareFor(sectionDifference, serviceClass);
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

        throw new BadRequestException("This route has no published fare section covering the boarding stop");
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

        throw new BadRequestException("This route has no published fare section covering the alighting stop");
    }
}