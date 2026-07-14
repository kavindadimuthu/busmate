package com.busmate.routeschedule.network.repository;

import com.busmate.routeschedule.network.entity.RouteGroup;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RouteGroupRepository extends JpaRepository<RouteGroup, UUID> {
    boolean existsByName(String name);
    Optional<RouteGroup> findByNameIgnoreCase(String name);
    
    @Query("SELECT CASE WHEN COUNT(rg) > 0 THEN true ELSE false END FROM RouteGroup rg " +
           "WHERE rg.name = :name AND rg.id <> :excludeId")
    boolean existsByNameAndIdNot(@Param("name") String name, @Param("excludeId") UUID excludeId);
    
    @Query(value = "SELECT * FROM route_group rg WHERE " +
           "(:searchText IS NULL OR :searchText = '' OR " +
           "LOWER(rg.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(rg.name_sinhala) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(rg.name_tamil) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(rg.description) LIKE LOWER(CONCAT('%', :searchText, '%')))",
           nativeQuery = true)
    Page<RouteGroup> findAllWithSearch(@Param("searchText") String searchText, Pageable pageable);
}