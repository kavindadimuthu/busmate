package com.busmate.routeschedule.repository;

import com.busmate.routeschedule.entity.RouteGroup;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface RouteGroupRepository extends JpaRepository<RouteGroup, UUID> {
    boolean existsByName(String name);
    
    @Query(value = "SELECT * FROM route_group rg WHERE " +
           "(:searchText IS NULL OR :searchText = '' OR " +
           "LOWER(rg.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(rg.description) LIKE LOWER(CONCAT('%', :searchText, '%')))",
           nativeQuery = true)
    Page<RouteGroup> findAllWithSearch(@Param("searchText") String searchText, Pageable pageable);
}