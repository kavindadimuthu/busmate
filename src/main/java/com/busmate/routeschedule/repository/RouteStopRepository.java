package com.busmate.routeschedule.repository;

import com.busmate.routeschedule.entity.RouteStop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RouteStopRepository extends JpaRepository<RouteStop, UUID> {
    Optional<RouteStop> findByRouteIdAndStopIdAndStopOrder(UUID routeId, UUID stopId, Integer stopOrder);
    
    @Query("SELECT rs FROM RouteStop rs " +
           "JOIN FETCH rs.stop s " +
           "WHERE rs.route.id = :routeId " +
           "ORDER BY rs.stopOrder ASC")
    List<RouteStop> findByRouteIdOrderByStopOrder(@Param("routeId") UUID routeId);
}