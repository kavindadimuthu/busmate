package com.busmate.ticketing_service.repository;


import com.busmate.ticketing_service.entity.RouteFare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@EnableJpaRepositories
@Repository
public interface RouteFareRepo extends JpaRepository<RouteFare, UUID> {

    boolean existsBySectionIdAndSectionName(int sectionId, String sectionName);


    // Find exact distance match
    Optional<RouteFare> findByRouteIdAndDistanceFromStart(String routeId, double distanceFromStart);

    // Find latest lower distance
    @Query("SELECT rf FROM RouteFare rf WHERE rf.routeId = :routeId AND rf.distanceFromStart <= :distance ORDER BY rf.distanceFromStart DESC LIMIT 1")
    Optional<RouteFare> findLatestLowerDistance(@Param("routeId") String routeId, @Param("distance") double distance);

    // Find latest higher distance
    @Query("SELECT rf FROM RouteFare rf WHERE rf.routeId = :routeId AND rf.distanceFromStart >= :distance ORDER BY rf.distanceFromStart ASC LIMIT 1")
    Optional<RouteFare> findLatestHigherDistance(@Param("routeId") String routeId, @Param("distance") double distance);



}
