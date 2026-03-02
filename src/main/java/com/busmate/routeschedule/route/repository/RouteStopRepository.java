package com.busmate.routeschedule.route.repository;

import com.busmate.routeschedule.route.entity.RouteStop;
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
    
    /**
     * Find all RouteStop entries for a given stop ID with route details
     */
    @Query("SELECT rs FROM RouteStop rs " +
           "JOIN FETCH rs.route r " +
           "JOIN FETCH rs.stop s " +
           "LEFT JOIN FETCH r.routeGroup rg " +
           "WHERE rs.stop.id = :stopId")
    List<RouteStop> findByStopIdWithRouteDetails(@Param("stopId") UUID stopId);
    
    /**
     * Find RouteStop entry for specific route and stop combination
     */
    @Query("SELECT rs FROM RouteStop rs " +
           "JOIN FETCH rs.route r " +
           "JOIN FETCH rs.stop s " +
           "WHERE rs.route.id = :routeId AND rs.stop.id = :stopId")
    Optional<RouteStop> findByRouteIdAndStopId(@Param("routeId") UUID routeId, @Param("stopId") UUID stopId);
    
    /**
     * Find all RouteStop entries for a given route group ID with route and stop details
     */
    @Query("SELECT rs FROM RouteStop rs " +
           "JOIN FETCH rs.route r " +
           "JOIN FETCH rs.stop s " +
           "WHERE r.routeGroup.id = :routeGroupId " +
           "ORDER BY r.name ASC, rs.stopOrder ASC")
    List<RouteStop> findByRouteGroupIdOrderByRouteAndStopOrder(@Param("routeGroupId") UUID routeGroupId);
}