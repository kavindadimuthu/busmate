package com.busmate.routeschedule.network.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.busmate.routeschedule.network.entity.Route;
import com.busmate.routeschedule.network.enums.DirectionEnum;
import com.busmate.routeschedule.network.repository.projection.DirectionCount;
import com.busmate.routeschedule.network.repository.projection.DistanceRange;
import com.busmate.routeschedule.network.repository.projection.DistanceStatistics;
import com.busmate.routeschedule.network.repository.projection.DurationRange;
import com.busmate.routeschedule.network.repository.projection.DurationStatistics;
import com.busmate.routeschedule.network.repository.projection.RouteGroupCount;
import com.busmate.routeschedule.network.repository.projection.RouteGroupSummary;
import com.busmate.routeschedule.network.repository.projection.RouteStatisticsProjection;

@Repository
public interface RouteRepository extends JpaRepository<Route, UUID> {
    boolean existsByNameAndRouteGroup_Id(String name, UUID routeGroupId);
    Optional<Route> findByNameAndRouteGroup_Id(String name, UUID routeGroupId);
    
    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM Route r " +
           "WHERE r.name = :name AND r.routeGroup.id = :routeGroupId AND r.id <> :excludeId")
    boolean existsByNameAndRouteGroup_IdAndIdNot(@Param("name") String name, 
                                                   @Param("routeGroupId") UUID routeGroupId,
                                                   @Param("excludeId") UUID excludeId);
    
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
            @Param("roadType") com.busmate.routeschedule.network.enums.RoadTypeEnum roadType,
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
            @Param("roadType") com.busmate.routeschedule.network.enums.RoadTypeEnum roadType,
            @Param("minDistance") Double minDistance,
            @Param("maxDistance") Double maxDistance,
            @Param("minDuration") Integer minDuration,
            @Param("maxDuration") Integer maxDuration,
            Pageable pageable);
    
    @Query("SELECT DISTINCT r.direction FROM Route r WHERE r.direction IS NOT NULL ORDER BY r.direction")
    List<DirectionEnum> findDistinctDirections();
    
    @Query("SELECT DISTINCT r.roadType FROM Route r WHERE r.roadType IS NOT NULL ORDER BY r.roadType")
    List<com.busmate.routeschedule.network.enums.RoadTypeEnum> findDistinctRoadTypes();
    
    @Query("SELECT DISTINCT rg.id as id, rg.name as name FROM Route r JOIN r.routeGroup rg ORDER BY rg.name")
    List<RouteGroupSummary> findDistinctRouteGroups();
    
    @Query("SELECT MIN(r.distanceKm) as min, MAX(r.distanceKm) as max FROM Route r WHERE r.distanceKm IS NOT NULL")
    DistanceRange findDistanceRange();
    
    @Query("SELECT MIN(r.estimatedDurationMinutes) as min, MAX(r.estimatedDurationMinutes) as max FROM Route r WHERE r.estimatedDurationMinutes IS NOT NULL")
    DurationRange findDurationRange();
    
    // Statistics methods
    @Query("SELECT COUNT(r) FROM Route r WHERE r.direction = :direction")
    Long countByDirection(@Param("direction") DirectionEnum direction);
    
    @Query("SELECT COUNT(r) FROM Route r WHERE r.routeStops IS NOT EMPTY")
    Long countRoutesWithStops();
    
    @Query("SELECT COUNT(r) FROM Route r WHERE r.routeStops IS EMPTY")
    Long countRoutesWithoutStops();
    
    @Query("SELECT rg.name as routeGroupName, COUNT(r) as count FROM Route r JOIN r.routeGroup rg GROUP BY rg.name ORDER BY rg.name")
    List<RouteGroupCount> countRoutesByRouteGroup();
    
    @Query("SELECT r.direction as direction, COUNT(r) as count FROM Route r GROUP BY r.direction ORDER BY r.direction")
    List<DirectionCount> countRoutesByDirection();
    
    @Query("SELECT AVG(r.distanceKm) as avg, MIN(r.distanceKm) as min, MAX(r.distanceKm) as max, SUM(r.distanceKm) as sum FROM Route r WHERE r.distanceKm IS NOT NULL")
    DistanceStatistics getDistanceStatistics();
    
    @Query("SELECT AVG(r.estimatedDurationMinutes) as avg, MIN(r.estimatedDurationMinutes) as min, MAX(r.estimatedDurationMinutes) as max, SUM(r.estimatedDurationMinutes) as sum FROM Route r WHERE r.estimatedDurationMinutes IS NOT NULL")
    DurationStatistics getDurationStatistics();
    
    @Query("SELECT COUNT(DISTINCT r.routeGroup) FROM Route r")
    Long countDistinctRouteGroups();
    
    @Query("SELECT r.name FROM Route r WHERE r.distanceKm = (SELECT MAX(r2.distanceKm) FROM Route r2)")
    List<String> findLongestRouteNames();
    
    @Query("SELECT r.name FROM Route r WHERE r.distanceKm = (SELECT MIN(r2.distanceKm) FROM Route r2 WHERE r2.distanceKm IS NOT NULL)")
    List<String> findShortestRouteNames();

    // ─────────────── Consolidated Statistics Query (Phase 3 – Task 3.3) ───────────────

    /**
     * Single native SQL query that computes all primary route statistics in one database
     * round-trip, reducing the original 12+ individual queries to a single call.
     *
     * <p>The per-group and per-direction breakdowns (which return multiple rows) and the
     * longest/shortest route name lookups are still handled by separate queries, but the bulk of
     * the numeric aggregates are now fetched here.</p>
     */
    @Query(nativeQuery = true, value =
            "SELECT " +
            "  COUNT(*) AS totalRoutes, " +
            "  SUM(CASE WHEN direction = 'OUTBOUND' THEN 1 ELSE 0 END) AS outboundCount, " +
            "  SUM(CASE WHEN direction = 'INBOUND'  THEN 1 ELSE 0 END) AS inboundCount, " +
            "  (SELECT COUNT(DISTINCT rs.route_id) FROM route_stop rs) AS routesWithStops, " +
            "  ((SELECT COUNT(*) FROM route) - (SELECT COUNT(DISTINCT rs.route_id) FROM route_stop rs)) AS routesWithoutStops, " +
            "  (SELECT COUNT(DISTINCT route_group_id) FROM route WHERE route_group_id IS NOT NULL) AS totalRouteGroups, " +
            "  AVG(distance_km)                        AS avgDistance, " +
            "  MIN(distance_km)                        AS minDistance, " +
            "  MAX(distance_km)                        AS maxDistance, " +
            "  SUM(distance_km)                        AS sumDistance, " +
            "  AVG(estimated_duration_minutes)         AS avgDuration, " +
            "  MIN(estimated_duration_minutes)         AS minDuration, " +
            "  MAX(estimated_duration_minutes)         AS maxDuration, " +
            "  SUM(CAST(estimated_duration_minutes AS BIGINT)) AS sumDuration " +
            "FROM route")
    RouteStatisticsProjection getRouteStatisticsConsolidated();
    
    @Query("SELECT r.name FROM Route r WHERE r.estimatedDurationMinutes = (SELECT MAX(r2.estimatedDurationMinutes) FROM Route r2)")
    List<String> findLongestDurationRouteNames();
    
    @Query("SELECT r.name FROM Route r WHERE r.estimatedDurationMinutes = (SELECT MIN(r2.estimatedDurationMinutes) FROM Route r2 WHERE r2.estimatedDurationMinutes IS NOT NULL)")
    List<String> findShortestDurationRouteNames();

    // ─────────────── Performance: JOIN FETCH to eliminate N+1 ───────────────

    /**
     * Returns a page of routes with {@code startStop} and {@code endStop} eagerly loaded
     * via {@code LEFT JOIN FETCH}.  Using {@code @ManyToOne} fetches with pagination is safe
     * because there is at most one join row per route; Hibernate applies the LIMIT at the DB level.
     *
     * <p>This is the single consolidated query for Task 2.3 (N+1 fix) and Task 2.6
     * (repository consolidation). It replaces the three separate methods
     * ({@code findAllWithSearch}, {@code findAllWithFilters}, {@code findAllWithSearchAndFilters})
     * by accepting all optional filter/search parameters and ignoring {@code null} values via the
     * {@code (:param IS NULL OR …)} JPQL pattern.
     */
    @Query(value = "SELECT DISTINCT r FROM Route r " +
            "LEFT JOIN FETCH r.startStop ss " +
            "LEFT JOIN FETCH r.endStop es " +
            "LEFT JOIN r.routeGroup rg " +
            "WHERE (:searchText IS NULL OR :searchText = '' OR " +
            "LOWER(r.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(r.nameSinhala) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(r.nameTamil) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(r.routeNumber) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(r.description) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(r.routeThrough) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(r.routeThroughSinhala) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(r.routeThroughTamil) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(rg.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(rg.nameSinhala) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(rg.nameTamil) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(ss.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(es.name) LIKE LOWER(CONCAT('%', :searchText, '%'))) AND " +
            "(:routeGroupId IS NULL OR r.routeGroup.id = :routeGroupId) AND " +
            "(:direction IS NULL OR r.direction = :direction) AND " +
            "(:roadType IS NULL OR r.roadType = :roadType) AND " +
            "(:minDistance IS NULL OR r.distanceKm >= :minDistance) AND " +
            "(:maxDistance IS NULL OR r.distanceKm <= :maxDistance) AND " +
            "(:minDuration IS NULL OR r.estimatedDurationMinutes >= :minDuration) AND " +
            "(:maxDuration IS NULL OR r.estimatedDurationMinutes <= :maxDuration)",
            countQuery = "SELECT COUNT(DISTINCT r) FROM Route r " +
            "LEFT JOIN r.routeGroup rg " +
            "LEFT JOIN r.startStop ss " +
            "LEFT JOIN r.endStop es " +
            "WHERE (:searchText IS NULL OR :searchText = '' OR " +
            "LOWER(r.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(r.nameSinhala) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(r.nameTamil) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(r.routeNumber) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(r.description) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(r.routeThrough) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(r.routeThroughSinhala) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(r.routeThroughTamil) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(rg.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(rg.nameSinhala) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(rg.nameTamil) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(ss.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(es.name) LIKE LOWER(CONCAT('%', :searchText, '%'))) AND " +
            "(:routeGroupId IS NULL OR r.routeGroup.id = :routeGroupId) AND " +
            "(:direction IS NULL OR r.direction = :direction) AND " +
            "(:roadType IS NULL OR r.roadType = :roadType) AND " +
            "(:minDistance IS NULL OR r.distanceKm >= :minDistance) AND " +
            "(:maxDistance IS NULL OR r.distanceKm <= :maxDistance) AND " +
            "(:minDuration IS NULL OR r.estimatedDurationMinutes >= :minDuration) AND " +
            "(:maxDuration IS NULL OR r.estimatedDurationMinutes <= :maxDuration)")
    Page<Route> findAllFiltered(
            @Param("searchText") String searchText,
            @Param("routeGroupId") UUID routeGroupId,
            @Param("direction") DirectionEnum direction,
            @Param("roadType") com.busmate.routeschedule.network.enums.RoadTypeEnum roadType,
            @Param("minDistance") Double minDistance,
            @Param("maxDistance") Double maxDistance,
            @Param("minDuration") Integer minDuration,
            @Param("maxDuration") Integer maxDuration,
            Pageable pageable);

    /**
     * Fetches a single {@link Route} by ID with {@code startStop} and {@code endStop}
     * eagerly loaded.  Used by {@code getRouteById} to avoid lazy-load round-trips.
     */
    @Query("SELECT r FROM Route r " +
           "LEFT JOIN FETCH r.startStop " +
           "LEFT JOIN FETCH r.endStop " +
           "WHERE r.id = :id")
    Optional<Route> findByIdWithStops(@Param("id") UUID id);

    @Query(value = "SELECT DISTINCT r.* FROM route r " +
           "LEFT JOIN route_group rg ON r.route_group_id = rg.id " +
           "LEFT JOIN route_stop rs ON r.id = rs.route_id " +
           "LEFT JOIN stop start_stop ON r.start_stop_id = start_stop.id " +
           "LEFT JOIN stop end_stop ON r.end_stop_id = end_stop.id " +
           "WHERE (:routeIds IS NULL OR r.id IN (:routeIds)) AND " +
           "(:routeGroupIds IS NULL OR r.route_group_id IN (:routeGroupIds)) AND " +
           "(:travelsThroughStopIds IS NULL OR rs.stop_id IN (:travelsThroughStopIds)) AND " +
           "(:startStopIds IS NULL OR r.start_stop_id IN (:startStopIds)) AND " +
           "(:endStopIds IS NULL OR r.end_stop_id IN (:endStopIds)) AND " +
           "(:directions IS NULL OR r.direction IN (:directions)) AND " +
           "(:roadTypes IS NULL OR r.road_type IN (:roadTypes)) AND " +
           "(:minDistance IS NULL OR r.distance_km >= :minDistance) AND " +
           "(:maxDistance IS NULL OR r.distance_km <= :maxDistance) AND " +
           "(:minDuration IS NULL OR r.estimated_duration_minutes >= :minDuration) AND " +
           "(:maxDuration IS NULL OR r.estimated_duration_minutes <= :maxDuration) AND " +
           "(:searchText IS NULL OR :searchText = '' OR " +
           "LOWER(r.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.name_sinhala) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.name_tamil) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.route_number) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.description) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.route_through) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(rg.name) LIKE LOWER(CONCAT('%', :searchText, '%')))",
           nativeQuery = true)
    List<Route> findAllWithFiltersForExport(
            @Param("routeIds") List<UUID> routeIds,
            @Param("routeGroupIds") List<UUID> routeGroupIds,
            @Param("travelsThroughStopIds") List<UUID> travelsThroughStopIds,
            @Param("startStopIds") List<UUID> startStopIds,
            @Param("endStopIds") List<UUID> endStopIds,
            @Param("directions") List<String> directions,
            @Param("roadTypes") List<String> roadTypes,
            @Param("minDistance") Double minDistance,
            @Param("maxDistance") Double maxDistance,
            @Param("minDuration") Integer minDuration,
            @Param("maxDuration") Integer maxDuration,
            @Param("searchText") String searchText);
}