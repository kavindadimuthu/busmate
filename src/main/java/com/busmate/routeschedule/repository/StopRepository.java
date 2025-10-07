package com.busmate.routeschedule.repository;

import com.busmate.routeschedule.entity.Stop;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StopRepository extends JpaRepository<Stop, UUID> {
    boolean existsByNameAndLocation_City(String name, String city);
    
    @Query(value = "SELECT * FROM stop s WHERE " +
           "(:searchText IS NULL OR :searchText = '' OR " +
           "LOWER(s.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(s.address) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(s.city) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(s.state) LIKE LOWER(CONCAT('%', :searchText, '%')))",
           nativeQuery = true)
    Page<Stop> findAllWithSearch(@Param("searchText") String searchText, Pageable pageable);
    
    @Query("SELECT DISTINCT s.location.state FROM Stop s WHERE s.location.state IS NOT NULL ORDER BY s.location.state")
    List<String> findDistinctStates();
    
    @Query("SELECT DISTINCT s.isAccessible FROM Stop s WHERE s.isAccessible IS NOT NULL ORDER BY s.isAccessible DESC")
    List<Boolean> findDistinctAccessibilityStatuses();
    
    // Statistics methods
    @Query("SELECT COUNT(s) FROM Stop s WHERE s.isAccessible = true")
    Long countAccessibleStops();
    
    @Query("SELECT COUNT(s) FROM Stop s WHERE s.isAccessible = false")
    Long countNonAccessibleStops();
    
    @Query("SELECT COUNT(s) FROM Stop s WHERE s.description IS NOT NULL AND s.description != ''")
    Long countStopsWithDescription();
    
    @Query("SELECT COUNT(s) FROM Stop s WHERE s.description IS NULL OR s.description = ''")
    Long countStopsWithoutDescription();
    
    @Query("SELECT s.location.state, COUNT(s) FROM Stop s WHERE s.location.state IS NOT NULL GROUP BY s.location.state ORDER BY s.location.state")
    List<Object[]> countStopsByState();
    
    @Query("SELECT s.location.city, COUNT(s) FROM Stop s WHERE s.location.city IS NOT NULL GROUP BY s.location.city ORDER BY s.location.city")
    List<Object[]> countStopsByCity();
    
    @Query("SELECT s.isAccessible, COUNT(s) FROM Stop s WHERE s.isAccessible IS NOT NULL GROUP BY s.isAccessible ORDER BY s.isAccessible DESC")
    List<Object[]> countStopsByAccessibility();
    
    @Query("SELECT COUNT(DISTINCT s.location.state) FROM Stop s WHERE s.location.state IS NOT NULL")
    Long countDistinctStates();
    
    @Query("SELECT COUNT(DISTINCT s.location.city) FROM Stop s WHERE s.location.city IS NOT NULL")
    Long countDistinctCities();
}

