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

    /**
     * Each {@code route_fare_section} row records where a fare zone ENDS, not where it starts -
     * "Colombo Fort - Kadawatha" is stored at distance 12 (Kadawatha), covering the whole 0-12km
     * span including Colombo Fort itself at 0km. A boarding point therefore belongs to the same
     * zone as an alighting point at the same distance would: the nearest zone boundary at or
     * beyond it, never the one before it.
     *
     * <p>This used to search for the boundary <em>below</em> the distance instead, which has no
     * answer at all for a stop at or near a route's own origin (0km, below every recorded
     * boundary) - exactly the case that went uncaught, since every route this was tested against
     * happened to be boarded at a stop that was itself an exact section boundary.
     */
    private int findSectionForBoardingPoint(String routeId, double distance) {
        // Check for exact match first
        Optional<RouteFare> exactMatch = routeFareRepo.findByRouteIdAndDistanceFromStart(routeId, distance);
        if (exactMatch.isPresent()) {
            return exactMatch.get().getSectionId();
        }

        Optional<RouteFare> zoneBoundary = routeFareRepo.findLatestHigherDistance(routeId, distance);
        if (zoneBoundary.isPresent()) {
            return zoneBoundary.get().getSectionId();
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