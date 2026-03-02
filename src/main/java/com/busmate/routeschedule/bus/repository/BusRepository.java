package com.busmate.routeschedule.bus.repository;

import com.busmate.routeschedule.bus.entity.Bus;
import com.busmate.routeschedule.common.enums.StatusEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BusRepository extends JpaRepository<Bus, UUID> {
    boolean existsByNtcRegistrationNumber(String ntcRegistrationNumber);
    boolean existsByPlateNumber(String plateNumber);
    
    @Query(value = "SELECT b.* FROM bus b " +
           "LEFT JOIN operator o ON b.operator_id = o.id " +
           "WHERE " +
           "(:searchText IS NULL OR :searchText = '' OR " +
           "LOWER(b.ntc_registration_number) LIKE LOWER(CONCAT('%', CAST(:searchText AS text), '%')) OR " +
           "LOWER(b.plate_number) LIKE LOWER(CONCAT('%', CAST(:searchText AS text), '%')) OR " +
           "LOWER(b.model) LIKE LOWER(CONCAT('%', CAST(:searchText AS text), '%')) OR " +
           "LOWER(o.name) LIKE LOWER(CONCAT('%', CAST(:searchText AS text), '%'))) " +
           "AND (:operatorId IS NULL OR b.operator_id = CAST(:operatorId AS uuid)) " +
           "AND (:status IS NULL OR b.status = CAST(:status AS text)) " +
           "AND (:minCapacity IS NULL OR b.capacity >= :minCapacity) " +
           "AND (:maxCapacity IS NULL OR b.capacity <= :maxCapacity) " +
           "ORDER BY b.created_at DESC",
           countQuery = "SELECT COUNT(b.id) FROM bus b " +
           "LEFT JOIN operator o ON b.operator_id = o.id " +
           "WHERE " +
           "(:searchText IS NULL OR :searchText = '' OR " +
           "LOWER(b.ntc_registration_number) LIKE LOWER(CONCAT('%', CAST(:searchText AS text), '%')) OR " +
           "LOWER(b.plate_number) LIKE LOWER(CONCAT('%', CAST(:searchText AS text), '%')) OR " +
           "LOWER(b.model) LIKE LOWER(CONCAT('%', CAST(:searchText AS text), '%')) OR " +
           "LOWER(o.name) LIKE LOWER(CONCAT('%', CAST(:searchText AS text), '%'))) " +
           "AND (:operatorId IS NULL OR b.operator_id = CAST(:operatorId AS uuid)) " +
           "AND (:status IS NULL OR b.status = CAST(:status AS text)) " +
           "AND (:minCapacity IS NULL OR b.capacity >= :minCapacity) " +
           "AND (:maxCapacity IS NULL OR b.capacity <= :maxCapacity)",
           nativeQuery = true)
    Page<Bus> findAllWithFilters(
        @Param("searchText") String searchText,
        @Param("operatorId") UUID operatorId,
        @Param("status") String status,
        @Param("minCapacity") Integer minCapacity,
        @Param("maxCapacity") Integer maxCapacity,
        Pageable pageable
    );
    
    // Statistics queries
    @Query("SELECT COUNT(b) FROM Bus b WHERE b.status = :status")
    Long countByStatus(@Param("status") StatusEnum status);
    
    @Query("SELECT b.operator.operatorType, COUNT(b) FROM Bus b GROUP BY b.operator.operatorType")
    List<Object[]> countByOperatorType();
    
    @Query("SELECT b.status, COUNT(b) FROM Bus b GROUP BY b.status")
    List<Object[]> countByStatus();
    
    @Query("SELECT b.model, COUNT(b) FROM Bus b WHERE b.model IS NOT NULL GROUP BY b.model ORDER BY COUNT(b) DESC")
    List<Object[]> countByModel();
    
    @Query("SELECT b.operator.name, COUNT(b) FROM Bus b GROUP BY b.operator.name ORDER BY COUNT(b) DESC")
    List<Object[]> countByOperator();
    
    @Query("SELECT DISTINCT b.model FROM Bus b WHERE b.model IS NOT NULL ORDER BY b.model")
    List<String> findDistinctModels();
    
    @Query("SELECT DISTINCT b.operator.id, b.operator.name, b.operator.operatorType FROM Bus b ORDER BY b.operator.name")
    List<Object[]> findDistinctOperators();
    
    @Query("SELECT AVG(CAST(b.capacity AS double)) FROM Bus b WHERE b.capacity IS NOT NULL")
    Double findAverageCapacity();
    
    @Query("SELECT SUM(b.capacity) FROM Bus b WHERE b.capacity IS NOT NULL")
    Long findTotalCapacity();
    
    @Query("SELECT MIN(b.capacity) FROM Bus b WHERE b.capacity IS NOT NULL")
    Integer findMinCapacity();
    
    @Query("SELECT MAX(b.capacity) FROM Bus b WHERE b.capacity IS NOT NULL")
    Integer findMaxCapacity();
    
    @Query(value = "SELECT " +
           "CASE " +
           "WHEN capacity BETWEEN 1 AND 25 THEN '1-25' " +
           "WHEN capacity BETWEEN 26 AND 35 THEN '26-35' " +
           "WHEN capacity BETWEEN 36 AND 45 THEN '36-45' " +
           "WHEN capacity BETWEEN 46 AND 55 THEN '46-55' " +
           "ELSE '55+' " +
           "END as capacity_range, " +
           "COUNT(*) as count " +
           "FROM bus " +
           "WHERE capacity IS NOT NULL " +
           "GROUP BY capacity_range " +
           "ORDER BY MIN(capacity)", nativeQuery = true)
    List<Object[]> countByCapacityRange();
}
