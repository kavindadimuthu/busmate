package com.busmate.routeschedule.repository;

import com.busmate.routeschedule.entity.Bus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BusRepository extends JpaRepository<Bus, UUID> {
    boolean existsByNtcRegistrationNumber(String ntcRegistrationNumber);
    boolean existsByPlateNumber(String plateNumber);
    
    @Query(value = "SELECT b.* FROM bus b " +
           "LEFT JOIN operator o ON b.operator_id = o.id " +
           "WHERE " +
           "(:searchText IS NULL OR :searchText = '' OR " +
           "LOWER(b.ntc_registration_number) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(b.plate_number) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(b.model) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(o.name) LIKE LOWER(CONCAT('%', :searchText, '%'))) " +
           "AND (:operatorId IS NULL OR b.operator_id = :operatorId) " +
           "AND (:status IS NULL OR b.status = :status) " +
           "AND (:minCapacity IS NULL OR b.capacity >= :minCapacity) " +
           "AND (:maxCapacity IS NULL OR b.capacity <= :maxCapacity)",
           countQuery = "SELECT COUNT(b.id) FROM bus b " +
           "LEFT JOIN operator o ON b.operator_id = o.id " +
           "WHERE " +
           "(:searchText IS NULL OR :searchText = '' OR " +
           "LOWER(b.ntc_registration_number) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(b.plate_number) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(b.model) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(o.name) LIKE LOWER(CONCAT('%', :searchText, '%'))) " +
           "AND (:operatorId IS NULL OR b.operator_id = :operatorId) " +
           "AND (:status IS NULL OR b.status = :status) " +
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
}
