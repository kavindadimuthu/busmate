package com.busmate.routeschedule.repository;

import com.busmate.routeschedule.entity.Route;
import com.busmate.routeschedule.enums.DirectionEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface RouteRepository extends JpaRepository<Route, UUID> {
    boolean existsByNameAndRouteGroup_Id(String name, UUID routeGroupId);
    
    @Query(value = "SELECT r.* FROM route r " +
           "LEFT JOIN route_group rg ON r.route_group_id = rg.id " +
           "LEFT JOIN stop start_stop ON r.start_stop_id = start_stop.id " +
           "LEFT JOIN stop end_stop ON r.end_stop_id = end_stop.id " +
           "WHERE (:searchText IS NULL OR :searchText = '' OR " +
           "LOWER(r.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.name_sinhala) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.name_tamil) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.route_number) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.description) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.route_through) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.route_through_sinhala) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.route_through_tamil) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(rg.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(rg.name_sinhala) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(rg.name_tamil) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(start_stop.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(end_stop.name) LIKE LOWER(CONCAT('%', :searchText, '%')))",
           nativeQuery = true)
    Page<Route> findAllWithSearch(@Param("searchText") String searchText, Pageable pageable);
    
    @Query("SELECT r FROM Route r WHERE " +
           "(:routeGroupId IS NULL OR r.routeGroup.id = :routeGroupId) AND " +
           "(:direction IS NULL OR r.direction = :direction) AND " +
           "(:roadType IS NULL OR r.roadType = :roadType) AND " +
           "(:minDistance IS NULL OR r.distanceKm >= :minDistance) AND " +
           "(:maxDistance IS NULL OR r.distanceKm <= :maxDistance) AND " +
           "(:minDuration IS NULL OR r.estimatedDurationMinutes >= :minDuration) AND " +
           "(:maxDuration IS NULL OR r.estimatedDurationMinutes <= :maxDuration)")
    Page<Route> findAllWithFilters(
            @Param("routeGroupId") UUID routeGroupId,
            @Param("direction") DirectionEnum direction,
            @Param("roadType") com.busmate.routeschedule.enums.RoadTypeEnum roadType,
            @Param("minDistance") Double minDistance,
            @Param("maxDistance") Double maxDistance,
            @Param("minDuration") Integer minDuration,
            @Param("maxDuration") Integer maxDuration,
            Pageable pageable);
    
    @Query("SELECT r FROM Route r WHERE " +
           "(:searchText IS NULL OR :searchText = '' OR " +
           "LOWER(r.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.nameSinhala) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.nameTamil) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.routeNumber) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.description) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.routeThrough) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.routeThroughSinhala) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.routeThroughTamil) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.routeGroup.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.routeGroup.nameSinhala) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.routeGroup.nameTamil) LIKE LOWER(CONCAT('%', :searchText, '%'))) AND " +
           "(:routeGroupId IS NULL OR r.routeGroup.id = :routeGroupId) AND " +
           "(:direction IS NULL OR r.direction = :direction) AND " +
           "(:roadType IS NULL OR r.roadType = :roadType) AND " +
           "(:minDistance IS NULL OR r.distanceKm >= :minDistance) AND " +
           "(:maxDistance IS NULL OR r.distanceKm <= :maxDistance) AND " +
           "(:minDuration IS NULL OR r.estimatedDurationMinutes >= :minDuration) AND " +
           "(:maxDuration IS NULL OR r.estimatedDurationMinutes <= :maxDuration)")
    Page<Route> findAllWithSearchAndFilters(
            @Param("searchText") String searchText,
            @Param("routeGroupId") UUID routeGroupId,
            @Param("direction") DirectionEnum direction,
            @Param("roadType") com.busmate.routeschedule.enums.RoadTypeEnum roadType,
            @Param("minDistance") Double minDistance,
            @Param("maxDistance") Double maxDistance,
            @Param("minDuration") Integer minDuration,
            @Param("maxDuration") Integer maxDuration,
            Pageable pageable);
    
    @Query("SELECT DISTINCT r.direction FROM Route r WHERE r.direction IS NOT NULL ORDER BY r.direction")
    List<DirectionEnum> findDistinctDirections();
    
    @Query("SELECT DISTINCT r.roadType FROM Route r WHERE r.roadType IS NOT NULL ORDER BY r.roadType")
    List<com.busmate.routeschedule.enums.RoadTypeEnum> findDistinctRoadTypes();
    
    @Query("SELECT DISTINCT rg.id, rg.name FROM Route r JOIN r.routeGroup rg ORDER BY rg.name")
    List<Object[]> findDistinctRouteGroups();
    
    @Query("SELECT MIN(r.distanceKm), MAX(r.distanceKm) FROM Route r WHERE r.distanceKm IS NOT NULL")
    List<Object[]> findDistanceRange();
    
    @Query("SELECT MIN(r.estimatedDurationMinutes), MAX(r.estimatedDurationMinutes) FROM Route r WHERE r.estimatedDurationMinutes IS NOT NULL")
    List<Object[]> findDurationRange();
    
    List<Route> findByRouteGroup_Id(UUID routeGroupId);
    
    // Statistics methods
    @Query("SELECT COUNT(r) FROM Route r WHERE r.direction = :direction")
    Long countByDirection(@Param("direction") DirectionEnum direction);
    
    @Query("SELECT COUNT(r) FROM Route r WHERE r.routeStops IS NOT EMPTY")
    Long countRoutesWithStops();
    
    @Query("SELECT COUNT(r) FROM Route r WHERE r.routeStops IS EMPTY")
    Long countRoutesWithoutStops();
    
    @Query("SELECT rg.name, COUNT(r) FROM Route r JOIN r.routeGroup rg GROUP BY rg.name ORDER BY rg.name")
    List<Object[]> countRoutesByRouteGroup();
    
    @Query("SELECT r.direction, COUNT(r) FROM Route r GROUP BY r.direction ORDER BY r.direction")
    List<Object[]> countRoutesByDirection();
    
    @Query("SELECT AVG(r.distanceKm), SUM(r.distanceKm) FROM Route r WHERE r.distanceKm IS NOT NULL")
    List<Object[]> getDistanceStatistics();
    
    @Query("SELECT AVG(r.estimatedDurationMinutes), SUM(r.estimatedDurationMinutes) FROM Route r WHERE r.estimatedDurationMinutes IS NOT NULL")
    List<Object[]> getDurationStatistics();
    
    @Query("SELECT COUNT(DISTINCT r.routeGroup) FROM Route r")
    Long countDistinctRouteGroups();
    
    @Query("SELECT r.name FROM Route r WHERE r.distanceKm = (SELECT MAX(r2.distanceKm) FROM Route r2)")
    List<String> findLongestRouteNames();
    
    @Query("SELECT r.name FROM Route r WHERE r.distanceKm = (SELECT MIN(r2.distanceKm) FROM Route r2 WHERE r2.distanceKm IS NOT NULL)")
    List<String> findShortestRouteNames();
    
    @Query("SELECT r.name FROM Route r WHERE r.estimatedDurationMinutes = (SELECT MAX(r2.estimatedDurationMinutes) FROM Route r2)")
    List<String> findLongestDurationRouteNames();
    
    @Query("SELECT r.name FROM Route r WHERE r.estimatedDurationMinutes = (SELECT MIN(r2.estimatedDurationMinutes) FROM Route r2 WHERE r2.estimatedDurationMinutes IS NOT NULL)")
    List<String> findShortestDurationRouteNames();
}