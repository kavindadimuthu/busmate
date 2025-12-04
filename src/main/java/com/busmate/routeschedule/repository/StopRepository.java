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
    
    // Check for duplicates across all language variants
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM Stop s WHERE " +
           "((s.name = :name OR s.nameSinhala = :name OR s.nameTamil = :name OR " +
           "s.name = :nameSinhala OR s.nameSinhala = :nameSinhala OR s.nameTamil = :nameSinhala OR " +
           "s.name = :nameTamil OR s.nameSinhala = :nameTamil OR s.nameTamil = :nameTamil) " +
           "AND (s.location.city = :city OR s.location.citySinhala = :city OR s.location.cityTamil = :city))")
    boolean existsByAnyNameVariantAndAnyCity(@Param("name") String name, 
                                           @Param("nameSinhala") String nameSinhala, 
                                           @Param("nameTamil") String nameTamil, 
                                           @Param("city") String city);
    
    @Query(value = "SELECT * FROM stop s WHERE " +
           "(:searchText IS NULL OR :searchText = '' OR " +
           "LOWER(s.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(s.name_sinhala) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(s.name_tamil) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(s.address) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(s.address_sinhala) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(s.address_tamil) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(s.city) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(s.city_sinhala) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(s.city_tamil) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(s.state) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(s.state_sinhala) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(s.state_tamil) LIKE LOWER(CONCAT('%', :searchText, '%')))",
           nativeQuery = true)
    Page<Stop> findAllWithSearch(@Param("searchText") String searchText, Pageable pageable);
    
    @Query("SELECT DISTINCT s.location.state FROM Stop s WHERE s.location.state IS NOT NULL ORDER BY s.location.state")
    List<String> findDistinctStates();
    
    @Query("SELECT DISTINCT s.location.city FROM Stop s WHERE s.location.city IS NOT NULL ORDER BY s.location.city")
    List<String> findDistinctCities();
    
    @Query("SELECT DISTINCT s.location.country FROM Stop s WHERE s.location.country IS NOT NULL ORDER BY s.location.country")
    List<String> findDistinctCountries();
    
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
    
    // Flexible export query methods
    @Query("SELECT s FROM Stop s WHERE " +
           "(:stopIds IS NULL OR s.id IN :stopIds) AND " +
           "(:cities IS NULL OR s.location.city IN :cities OR s.location.citySinhala IN :cities OR s.location.cityTamil IN :cities) AND " +
           "(:states IS NULL OR s.location.state IN :states OR s.location.stateSinhala IN :states OR s.location.stateTamil IN :states) AND " +
           "(:countries IS NULL OR s.location.country IN :countries OR s.location.countrySinhala IN :countries OR s.location.countryTamil IN :countries) AND " +
           "(:isAccessible IS NULL OR s.isAccessible = :isAccessible) AND " +
           "(:searchText IS NULL OR :searchText = '' OR " +
           "LOWER(s.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(s.nameSinhala) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(s.nameTamil) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(s.location.address) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(s.location.addressSinhala) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(s.location.addressTamil) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(s.location.city) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(s.location.citySinhala) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(s.location.cityTamil) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(s.location.state) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(s.location.stateSinhala) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(s.location.stateTamil) LIKE LOWER(CONCAT('%', :searchText, '%'))) " +
           "ORDER BY s.name")
    List<Stop> findStopsForExport(@Param("stopIds") List<UUID> stopIds,
                                 @Param("cities") List<String> cities,
                                 @Param("states") List<String> states,
                                 @Param("countries") List<String> countries,
                                 @Param("isAccessible") Boolean isAccessible,
                                 @Param("searchText") String searchText);
}

