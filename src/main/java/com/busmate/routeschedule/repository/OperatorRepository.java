package com.busmate.routeschedule.repository;

import com.busmate.routeschedule.entity.Operator;
import com.busmate.routeschedule.enums.OperatorTypeEnum;
import com.busmate.routeschedule.enums.StatusEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface OperatorRepository extends JpaRepository<Operator, UUID> {
    boolean existsByName(String name);
    
    @Query(value = "SELECT * FROM operator o WHERE " +
           "(:searchText IS NULL OR :searchText = '' OR " +
           "LOWER(o.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(o.region) LIKE LOWER(CONCAT('%', :searchText, '%'))) " +
           "AND (:operatorType IS NULL OR o.operator_type = :operatorType) " +
           "AND (:status IS NULL OR o.status = :status)",
           nativeQuery = true)
    Page<Operator> findAllWithFilters(
        @Param("searchText") String searchText,
        @Param("operatorType") String operatorType,
        @Param("status") String status,
        Pageable pageable
    );
    
    @Query("SELECT o FROM Operator o WHERE " +
           "(:operatorType IS NULL OR o.operatorType = :operatorType) " +
           "AND (:status IS NULL OR o.status = :status)")
    Page<Operator> findAllByFilters(
        @Param("operatorType") OperatorTypeEnum operatorType,
        @Param("status") StatusEnum status,
        Pageable pageable
    );
}
