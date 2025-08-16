package com.busmate.routeschedule.repository;

import com.busmate.routeschedule.entity.RouteStop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RouteStopRepository extends JpaRepository<RouteStop, UUID> {
    Optional<RouteStop> findByRouteIdAndStopIdAndStopOrder(UUID routeId, UUID stopId, Integer stopOrder);
}