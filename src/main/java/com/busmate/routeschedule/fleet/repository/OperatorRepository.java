package com.busmate.routeschedule.fleet.repository;

import com.busmate.routeschedule.fleet.entity.Operator;
import com.busmate.routeschedule.fleet.enums.OperatorTypeEnum;
import com.busmate.routeschedule.shared.enums.StatusEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OperatorRepository extends JpaRepository<Operator, UUID> {
    boolean existsByName(String name);
    Optional<Operator> findByNameIgnoreCase(String name);
    
    @Query(value = "SELECT * FROM operator o WHERE " +
           "(:searchText IS NULL OR :searchText = '' OR " +
           "LOWER(o.name) LIKE LOWER(CONCAT('%', CAST(:searchText AS text), '%')) OR " +
           "LOWER(o.region) LIKE LOWER(CONCAT('%', CAST(:searchText AS text), '%'))) " +
           "AND (:operatorType IS NULL OR o.operator_type = CAST(:operatorType AS text)) " +
           "AND (:status IS NULL OR o.status = CAST(:status AS text))",
           nativeQuery = true)
    Page<Operator> findAllWithFilters(
        @Param("searchText") String searchText,
        @Param("operatorType") String operatorType,
        @Param("status") String status,
        Pageable pageable
    );
    
    // Statistics queries
    @Query("SELECT COUNT(o) FROM Operator o WHERE o.status = :status")
    Long countByStatus(@Param("status") StatusEnum status);
    
    @Query("SELECT COUNT(o) FROM Operator o WHERE o.operatorType = :operatorType")
    Long countByOperatorType(@Param("operatorType") OperatorTypeEnum operatorType);
    
    @Query("SELECT o.region, COUNT(o) FROM Operator o WHERE o.region IS NOT NULL GROUP BY o.region")
    List<Object[]> countByRegion();
    
    @Query("SELECT o.operatorType, COUNT(o) FROM Operator o GROUP BY o.operatorType")
    List<Object[]> countByOperatorType();
    
    @Query("SELECT o.status, COUNT(o) FROM Operator o GROUP BY o.status")
    List<Object[]> countByStatus();
    
    @Query("SELECT DISTINCT o.region FROM Operator o WHERE o.region IS NOT NULL ORDER BY o.region")
    List<String> findDistinctRegions();
    
    @Query("SELECT o.region, COUNT(o) as count FROM Operator o WHERE o.region IS NOT NULL AND o.status = 'active' GROUP BY o.region ORDER BY count DESC")
    List<Object[]> findActiveOperatorsByRegion();
}
