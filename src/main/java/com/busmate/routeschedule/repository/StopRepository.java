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
}

