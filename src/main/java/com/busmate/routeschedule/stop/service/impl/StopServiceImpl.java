package com.busmate.routeschedule.stop.service.impl;

import com.busmate.routeschedule.common.dto.LocationDto;
import com.busmate.routeschedule.stop.dto.request.StopRequest;
import com.busmate.routeschedule.stop.dto.request.StopExportRequest;
import com.busmate.routeschedule.route.dto.response.RouteStopDetailResponse;
import com.busmate.routeschedule.route.dto.response.RouteGroupStopDetailResponse;
import com.busmate.routeschedule.schedule.dto.response.ScheduleStopDetailResponse;
import com.busmate.routeschedule.stop.dto.response.StopExistsResponse;
import com.busmate.routeschedule.stop.dto.response.StopResponse;
import com.busmate.routeschedule.stop.dto.response.StopFilterOptionsResponse;
import com.busmate.routeschedule.stop.dto.response.StopStatisticsResponse;
import com.busmate.routeschedule.stop.dto.response.StopImportResponse;
import com.busmate.routeschedule.stop.dto.response.StopExportResponse;
import com.busmate.routeschedule.stop.dto.response.StopBulkUpdateResponse;

import com.busmate.routeschedule.stop.dto.request.StopBulkUpdateRequest;

import com.busmate.routeschedule.route.entity.RouteStop;
import com.busmate.routeschedule.route.entity.Route;
import com.busmate.routeschedule.route.entity.RouteGroup;
import com.busmate.routeschedule.schedule.entity.ScheduleStop;
import com.busmate.routeschedule.stop.entity.Stop;
import com.busmate.routeschedule.schedule.entity.Schedule;
import com.busmate.routeschedule.route.repository.RouteStopRepository;
import com.busmate.routeschedule.route.repository.RouteRepository;
import com.busmate.routeschedule.route.repository.RouteGroupRepository;
import com.busmate.routeschedule.schedule.repository.ScheduleRepository;
import com.busmate.routeschedule.schedule.repository.ScheduleStopRepository;
import com.busmate.routeschedule.stop.repository.StopRepository;
import com.busmate.routeschedule.stop.service.StopService;
import com.busmate.routeschedule.common.exception.ResourceNotFoundException;
import com.busmate.routeschedule.common.exception.ConflictException;
import com.busmate.routeschedule.common.util.MapperUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StopServiceImpl implements StopService {
    private final StopRepository stopRepository;
    private final RouteStopRepository routeStopRepository;
    private final RouteRepository routeRepository;
    private final RouteGroupRepository routeGroupRepository;
    private final ScheduleRepository scheduleRepository;
    private final ScheduleStopRepository scheduleStopRepository;
    private final MapperUtils mapperUtils;

    @Override
    public StopResponse createStop(StopRequest request, String userId) {
        // Check for duplicates across all language variants
        String cityToCheck = request.getLocation().getCity() != null ? request.getLocation().getCity() : 
                           request.getLocation().getCitySinhala() != null ? request.getLocation().getCitySinhala() : 
                           request.getLocation().getCityTamil();
                           
        if (stopRepository.existsByAnyNameVariantAndAnyCity(
                request.getName(), 
                request.getNameSinhala(), 
                request.getNameTamil(), 
                cityToCheck)) {
            throw new ConflictException("Stop with similar name already exists in the same city");
        }

        Stop stop = mapperUtils.map(request, Stop.class);
        stop.setCreatedBy(userId);
        stop.setUpdatedBy(userId);
        Stop savedStop = stopRepository.save(stop);
        return mapperUtils.map(savedStop, StopResponse.class);
    }

    @Override
    public StopResponse getStopById(UUID id) {
        Stop stop = stopRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stop not found with id: " + id));
        return mapperUtils.map(stop, StopResponse.class);
    }

    @Override
    @Transactional(readOnly = true)
    public StopExistsResponse checkStopExists(String id, String name) {
        // Priority: ID takes precedence over name
        if (id != null && !id.trim().isEmpty()) {
            try {
                UUID uuid = UUID.fromString(id.trim());
                return stopRepository.findById(uuid)
                        .map(stop -> StopExistsResponse.found(
                                mapperUtils.map(stop, StopResponse.class),
                                "id",
                                id
                        ))
                        .orElse(StopExistsResponse.notFound("id", id));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid UUID format provided: {}", id);
                return StopExistsResponse.notFound("id", id);
            }
        }
        
        // Search by name if ID is not provided
        if (name != null && !name.trim().isEmpty()) {
            return stopRepository.findByAnyNameVariant(name.trim())
                    .map(stop -> StopExistsResponse.found(
                            mapperUtils.map(stop, StopResponse.class),
                            "name",
                            name
                    ))
                    .orElse(StopExistsResponse.notFound("name", name));
        }
        
        // Neither ID nor name provided
        return StopExistsResponse.notFound("none", "No search criteria provided");
    }

    @Override
    public List<StopResponse> getAllStops() {
        return stopRepository.findAll().stream()
                .map(stop -> mapperUtils.map(stop, StopResponse.class))
                .collect(Collectors.toList());
    }

    @Override
    public Page<StopResponse> getAllStops(Pageable pageable) {
        Page<Stop> stops = stopRepository.findAll(pageable);
        return stops.map(stop -> mapperUtils.map(stop, StopResponse.class));
    }

    @Override
    public Page<StopResponse> getAllStopsWithSearch(String searchText, Pageable pageable) {
        Page<Stop> stops = stopRepository.findAllWithSearch(searchText, pageable);
        return stops.map(stop -> mapperUtils.map(stop, StopResponse.class));
    }

    @Override
    public StopResponse updateStop(UUID id, StopRequest request, String userId) {
        Stop stop = stopRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stop not found with id: " + id));

        // Check if any name has changed and if so, verify no duplicates across all language variants
        boolean nameChanged = !stop.getName().equals(request.getName()) || 
                            !java.util.Objects.equals(stop.getNameSinhala(), request.getNameSinhala()) || 
                            !java.util.Objects.equals(stop.getNameTamil(), request.getNameTamil());
                            
        if (nameChanged) {
            String cityToCheck = request.getLocation().getCity() != null ? request.getLocation().getCity() : 
                               request.getLocation().getCitySinhala() != null ? request.getLocation().getCitySinhala() : 
                               request.getLocation().getCityTamil();
                               
            if (stopRepository.existsByAnyNameVariantAndAnyCity(
                    request.getName(), 
                    request.getNameSinhala(), 
                    request.getNameTamil(), 
                    cityToCheck)) {
                throw new ConflictException("Stop with similar name already exists in the same city");
            }
        }

        mapperUtils.map(request, stop);
        stop.setUpdatedBy(userId);
        Stop updatedStop = stopRepository.save(stop);
        return mapperUtils.map(updatedStop, StopResponse.class);
    }

    @Override
    public void deleteStop(UUID id) {
        if (!stopRepository.existsById(id)) {
            throw new ResourceNotFoundException("Stop not found with id: " + id);
        }
        stopRepository.deleteById(id);
    }

    @Override
    public StopFilterOptionsResponse getFilterOptions() {
        StopFilterOptionsResponse response = new StopFilterOptionsResponse();
        
        // Get all distinct values
        List<String> states = stopRepository.findDistinctStates();
        List<String> cities = stopRepository.findDistinctCities();
        List<String> countries = stopRepository.findDistinctCountries();
        List<Boolean> accessibilityStatuses = stopRepository.findDistinctAccessibilityStatuses();
        
        response.setStates(states);
        response.setCities(cities);
        response.setCountries(countries);
        response.setAccessibilityStatuses(accessibilityStatuses);
        
        // Create metadata for additional insights
        StopFilterOptionsResponse.FilterMetadata metadata = new StopFilterOptionsResponse.FilterMetadata();
        metadata.setTotalStates(states.size());
        metadata.setTotalCities(cities.size());
        metadata.setTotalCountries(countries.size());
        metadata.setHasAccessibleStops(accessibilityStatuses.contains(true));
        metadata.setHasNonAccessibleStops(accessibilityStatuses.contains(false));
        
        response.setMetadata(metadata);
        
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<RouteStopDetailResponse> getStopsByRoute(UUID routeId) {
        // Verify route exists
        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + routeId));
        
        List<RouteStop> routeStops = routeStopRepository.findByRouteIdOrderByStopOrder(routeId);

        return routeStops.stream()
                .map(this::mapToRouteStopDetailResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RouteGroupStopDetailResponse> getStopsByRouteGroup(UUID routeGroupId) {
        // Verify route group exists
        RouteGroup routeGroup = routeGroupRepository.findById(routeGroupId)
                .orElseThrow(() -> new ResourceNotFoundException("Route group not found with id: " + routeGroupId));
        
        List<RouteStop> routeStops = routeStopRepository.findByRouteGroupIdOrderByRouteAndStopOrder(routeGroupId);

        return routeStops.stream()
                .map(this::mapToRouteGroupStopDetailResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScheduleStopDetailResponse> getStopsWithScheduleBySchedule(UUID scheduleId) {
        // Verify schedule exists
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + scheduleId));
        
        List<ScheduleStop> scheduleStops = scheduleStopRepository.findByScheduleIdOrderByStopOrder(scheduleId);

        return scheduleStops.stream()
                .map(this::mapToScheduleStopDetailResponse)
                .collect(Collectors.toList());
    }

    private RouteStopDetailResponse mapToRouteStopDetailResponse(RouteStop routeStop) {
        RouteStopDetailResponse response = new RouteStopDetailResponse();
        Stop stop = routeStop.getStop();
        
        response.setRouteStopId(routeStop.getId());
        response.setStopId(stop.getId());
        response.setStopName(stop.getName());
        response.setStopNameSinhala(stop.getNameSinhala());
        response.setStopNameTamil(stop.getNameTamil());
        response.setStopDescription(stop.getDescription());
        response.setLocation(mapperUtils.map(stop.getLocation(), LocationDto.class));
        response.setIsAccessible(stop.getIsAccessible());
        response.setStopOrder(routeStop.getStopOrder());
        response.setDistanceFromStartKm(routeStop.getDistanceFromStartKm());
        response.setCreatedAt(stop.getCreatedAt());
        response.setUpdatedAt(stop.getUpdatedAt());
        response.setCreatedBy(stop.getCreatedBy());
        response.setUpdatedBy(stop.getUpdatedBy());
        
        return response;
    }

    private RouteGroupStopDetailResponse mapToRouteGroupStopDetailResponse(RouteStop routeStop) {
        RouteGroupStopDetailResponse response = new RouteGroupStopDetailResponse();
        Stop stop = routeStop.getStop();
        Route route = routeStop.getRoute();
        
        // Route information
        response.setRouteId(route.getId());
        response.setRouteName(route.getName());
        response.setRouteNameSinhala(route.getNameSinhala());
        response.setRouteNameTamil(route.getNameTamil());
        response.setRouteNumber(route.getRouteNumber());
        response.setDirection(route.getDirection() != null ? route.getDirection().name() : null);
        
        // RouteStop information
        response.setRouteStopId(routeStop.getId());
        response.setStopOrder(routeStop.getStopOrder());
        response.setDistanceFromStartKm(routeStop.getDistanceFromStartKm());
        
        // Stop information
        response.setStopId(stop.getId());
        response.setStopName(stop.getName());
        response.setStopNameSinhala(stop.getNameSinhala());
        response.setStopNameTamil(stop.getNameTamil());
        response.setStopDescription(stop.getDescription());
        response.setLocation(mapperUtils.map(stop.getLocation(), LocationDto.class));
        response.setIsAccessible(stop.getIsAccessible());
        response.setCreatedAt(stop.getCreatedAt());
        response.setUpdatedAt(stop.getUpdatedAt());
        response.setCreatedBy(stop.getCreatedBy());
        response.setUpdatedBy(stop.getUpdatedBy());
        
        return response;
    }

    private ScheduleStopDetailResponse mapToScheduleStopDetailResponse(ScheduleStop scheduleStop) {
        ScheduleStopDetailResponse response = new ScheduleStopDetailResponse();
        RouteStop routeStop = scheduleStop.getRouteStop();
        Stop stop = routeStop.getStop();

        response.setScheduleStopId(scheduleStop.getId());
        response.setRouteStopId(routeStop.getId());
        response.setStopId(stop.getId());
        response.setStopName(stop.getName());
        response.setStopDescription(stop.getDescription());
        response.setLocation(mapperUtils.map(stop.getLocation(), LocationDto.class));
        response.setIsAccessible(stop.getIsAccessible());
        response.setStopOrder(scheduleStop.getStopOrder());
        response.setDistanceFromStartKm(routeStop.getDistanceFromStartKm());
        response.setArrivalTime(scheduleStop.getArrivalTime());
        response.setDepartureTime(scheduleStop.getDepartureTime());

        return response;
    }

    @Override
    public StopStatisticsResponse getStatistics() {
        StopStatisticsResponse stats = new StopStatisticsResponse();
        
        // Basic counts
        stats.setTotalStops(stopRepository.count());
        stats.setAccessibleStops(stopRepository.countAccessibleStops());
        stats.setNonAccessibleStops(stopRepository.countNonAccessibleStops());
        stats.setStopsWithDescription(stopRepository.countStopsWithDescription());
        stats.setStopsWithoutDescription(stopRepository.countStopsWithoutDescription());
        stats.setTotalStates(stopRepository.countDistinctStates());
        stats.setTotalCities(stopRepository.countDistinctCities());
        
        // Stops by state
        Map<String, Long> stopsByState = new LinkedHashMap<>();
        stopRepository.countStopsByState().forEach(obj -> 
            stopsByState.put((String) obj[0], (Long) obj[1]));
        stats.setStopsByState(stopsByState);
        
        // Stops by city
        Map<String, Long> stopsByCity = new LinkedHashMap<>();
        stopRepository.countStopsByCity().forEach(obj -> 
            stopsByCity.put((String) obj[0], (Long) obj[1]));
        stats.setStopsByCity(stopsByCity);
        
        // Stops by accessibility
        Map<String, Long> stopsByAccessibility = new LinkedHashMap<>();
        stopRepository.countStopsByAccessibility().forEach(obj -> 
            stopsByAccessibility.put(obj[0] != null ? (obj[0].toString().equals("true") ? "Accessible" : "Non-Accessible") : "Unknown", (Long) obj[1]));
        stats.setStopsByAccessibility(stopsByAccessibility);
        
        // Calculate percentages
        if (stats.getTotalStops() > 0) {
            stats.setAccessibleStopsPercentage((stats.getAccessibleStops().doubleValue() / stats.getTotalStops().doubleValue()) * 100);
            stats.setNonAccessibleStopsPercentage((stats.getNonAccessibleStops().doubleValue() / stats.getTotalStops().doubleValue()) * 100);
        }
        
        // Calculate averages
        if (stats.getTotalStates() > 0) {
            stats.setAverageStopsPerState(stats.getTotalStops().doubleValue() / stats.getTotalStates().doubleValue());
        }
        
        if (stats.getTotalCities() > 0) {
            stats.setAverageStopsPerCity(stats.getTotalStops().doubleValue() / stats.getTotalCities().doubleValue());
        }
        
        // Find most and least populated state/city
        if (!stopsByState.isEmpty()) {
            String mostPopulatedState = stopsByState.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse(null);
            stats.setMostPopulatedState(mostPopulatedState);
            
            String leastPopulatedState = stopsByState.entrySet().stream()
                    .min(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse(null);
            stats.setLeastPopulatedState(leastPopulatedState);
        }
        
        if (!stopsByCity.isEmpty()) {
            String mostPopulatedCity = stopsByCity.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse(null);
            stats.setMostPopulatedCity(mostPopulatedCity);
            
            String leastPopulatedCity = stopsByCity.entrySet().stream()
                    .min(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse(null);
            stats.setLeastPopulatedCity(leastPopulatedCity);
        }
        
        return stats;
    }

    @Override
    public StopImportResponse importStops(MultipartFile file, String userId, String defaultCountry) {
        log.info("Starting dynamic stop import for user: {} with default country: {}", userId, defaultCountry);
        
        StopImportResponse response = new StopImportResponse();
        List<StopImportResponse.ImportError> errors = new ArrayList<>();
        List<StopImportResponse.ImportedStop> importedStops = new ArrayList<>();
        
        int totalRecords = 0;
        int successfulImports = 0;
        int failedImports = 0;
        
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String firstLine = reader.readLine();
            if (firstLine == null) {
                throw new IllegalArgumentException("Empty file");
            }
            
            // Parse and analyze headers dynamically
            String[] headers = firstLine.split(",");
            Map<String, Integer> fieldMapping = createFieldMapping(headers);
            
            // Validate that at least one name field is present
            if (!hasRequiredFields(fieldMapping)) {
                throw new IllegalArgumentException("CSV must contain at least one name field (name, stop_name, name_sinhala, or name_tamil)");
            }
            
            log.info("Detected CSV fields: {}", fieldMapping.keySet());
            
            String line;
            int rowNumber = 1; // We already read the header
            
            while ((line = reader.readLine()) != null) {
                rowNumber++;
                totalRecords++;
                
                if (line.trim().isEmpty()) {
                    continue; // Skip empty lines
                }
                
                String[] columns = line.split(",");
                
                try {
                    processDynamicRow(columns, fieldMapping, rowNumber, userId, defaultCountry, importedStops);
                    successfulImports++;
                    
                } catch (Exception e) {
                    failedImports++;
                    StopImportResponse.ImportError error = new StopImportResponse.ImportError();
                    error.setRowNumber(rowNumber);
                    error.setErrorMessage(e.getMessage());
                    error.setValue(line);
                    
                    // Add helpful suggestions based on the error
                    if (e.getMessage().contains("already exists")) {
                        error.setSuggestion("This stop name already exists. Consider updating the existing stop or use a different name.");
                    } else if (e.getMessage().contains("name is required")) {
                        error.setSuggestion("Ensure at least one name column is not empty.");
                    } else if (e.getMessage().contains("latitude") || e.getMessage().contains("longitude")) {
                        error.setSuggestion("Check that latitude and longitude are valid decimal numbers.");
                    } else {
                        error.setSuggestion("Check the CSV format and data validity.");
                    }
                    
                    errors.add(error);
                    log.error("Failed to import stop at row {}: {}", rowNumber, e.getMessage());
                }
            }
            
        } catch (Exception e) {
            log.error("Failed to process import file", e);
            
            StopImportResponse.ImportError error = new StopImportResponse.ImportError();
            error.setErrorMessage("Failed to process import file: " + e.getMessage());
            error.setSuggestion("Ensure the file is a valid CSV with at least a name column. Supported fields: name, name_sinhala, name_tamil, description, latitude, longitude, address, city, state, zipCode, country, isAccessible");
            errors.add(error);
        }
        
        response.setTotalRecords(totalRecords);
        response.setSuccessfulImports(successfulImports);
        response.setFailedImports(failedImports);
        response.setErrors(errors);
        response.setImportedStops(importedStops);
        response.setMessage(String.format("Import completed. %d successful, %d failed out of %d total records. %d stops imported with UUIDs.", 
                                        successfulImports, failedImports, totalRecords, importedStops.size()));
        
        log.info("Stop import completed. Success: {}, Failed: {}, Total: {}", 
                successfulImports, failedImports, totalRecords);
        
        return response;
    }
    
    /**
     * Creates a dynamic field mapping based on CSV headers
     * Maps header names to their column indices
     */
    private Map<String, Integer> createFieldMapping(String[] headers) {
        Map<String, Integer> fieldMapping = new LinkedHashMap<>();
        
        for (int i = 0; i < headers.length; i++) {
            String header = headers[i].trim().toLowerCase();
            
            // Map various possible header names to standardized field names
            if (header.equals("name") || header.equals("stop_name") || header.equals("stopname")) {
                fieldMapping.put("name", i);
            } else if (header.equals("name_sinhala") || header.equals("namesinhala") || header.equals("sinhala_name")) {
                fieldMapping.put("name_sinhala", i);
            } else if (header.equals("name_tamil") || header.equals("nametamil") || header.equals("tamil_name")) {
                fieldMapping.put("name_tamil", i);
            } else if (header.equals("description") || header.equals("desc")) {
                fieldMapping.put("description", i);
            } else if (header.equals("latitude") || header.equals("lat")) {
                fieldMapping.put("latitude", i);
            } else if (header.equals("longitude") || header.equals("lng") || header.equals("lon")) {
                fieldMapping.put("longitude", i);
            } else if (header.equals("address") || header.equals("addr")) {
                fieldMapping.put("address", i);
            } else if (header.equals("address_sinhala") || header.equals("addresssinhala") || header.equals("sinhala_address")) {
                fieldMapping.put("address_sinhala", i);
            } else if (header.equals("address_tamil") || header.equals("addresstamil") || header.equals("tamil_address")) {
                fieldMapping.put("address_tamil", i);
            } else if (header.equals("city")) {
                fieldMapping.put("city", i);
            } else if (header.equals("city_sinhala") || header.equals("citysinhala") || header.equals("sinhala_city")) {
                fieldMapping.put("city_sinhala", i);
            } else if (header.equals("city_tamil") || header.equals("citytamil") || header.equals("tamil_city")) {
                fieldMapping.put("city_tamil", i);
            } else if (header.equals("state") || header.equals("province")) {
                fieldMapping.put("state", i);
            } else if (header.equals("state_sinhala") || header.equals("statesinhala") || header.equals("sinhala_state")) {
                fieldMapping.put("state_sinhala", i);
            } else if (header.equals("state_tamil") || header.equals("statetamil") || header.equals("tamil_state")) {
                fieldMapping.put("state_tamil", i);
            } else if (header.equals("zipcode") || header.equals("zip_code") || header.equals("postal_code") || header.equals("postalcode")) {
                fieldMapping.put("zipCode", i);
            } else if (header.equals("country")) {
                fieldMapping.put("country", i);
            } else if (header.equals("country_sinhala") || header.equals("countrysinhala") || header.equals("sinhala_country")) {
                fieldMapping.put("country_sinhala", i);
            } else if (header.equals("country_tamil") || header.equals("countrytamil") || header.equals("tamil_country")) {
                fieldMapping.put("country_tamil", i);
            } else if (header.equals("isaccessible") || header.equals("is_accessible") || header.equals("accessible")) {
                fieldMapping.put("isAccessible", i);
            } else if (header.equals("stop_id") || header.equals("stopid") || header.equals("id")) {
                fieldMapping.put("original_stop_id", i);
            }
        }
        
        return fieldMapping;
    }
    
    /**
     * Validates that required fields are present
     */
    private boolean hasRequiredFields(Map<String, Integer> fieldMapping) {
        // At least one name field must be present
        return fieldMapping.containsKey("name") || 
               fieldMapping.containsKey("name_sinhala") || 
               fieldMapping.containsKey("name_tamil");
    }
    
    /**
     * Processes a row dynamically based on available fields
     */
    private void processDynamicRow(String[] columns, Map<String, Integer> fieldMapping, int rowNumber, 
                                 String userId, String defaultCountry, 
                                 List<StopImportResponse.ImportedStop> importedStops) {
        
        // Extract available data based on field mapping
        String name = getFieldValue(columns, fieldMapping, "name");
        String nameSinhala = getFieldValue(columns, fieldMapping, "name_sinhala");
        String nameTamil = getFieldValue(columns, fieldMapping, "name_tamil");
        String description = getFieldValue(columns, fieldMapping, "description");
        String originalStopId = getFieldValue(columns, fieldMapping, "original_stop_id");
        
        // Determine primary name (prefer English, fallback to other languages)
        String primaryName = null;
        if (name != null && !name.isEmpty()) {
            primaryName = name;
        } else if (nameSinhala != null && !nameSinhala.isEmpty()) {
            primaryName = nameSinhala;
        } else if (nameTamil != null && !nameTamil.isEmpty()) {
            primaryName = nameTamil;
        }
        
        // Validate that we have at least one name
        if (primaryName == null || primaryName.trim().isEmpty()) {
            throw new IllegalArgumentException("At least one name field is required");
        }
        
        // Extract location data
        String latitudeStr = getFieldValue(columns, fieldMapping, "latitude");
        String longitudeStr = getFieldValue(columns, fieldMapping, "longitude");
        String address = getFieldValue(columns, fieldMapping, "address");
        String addressSinhala = getFieldValue(columns, fieldMapping, "address_sinhala");
        String addressTamil = getFieldValue(columns, fieldMapping, "address_tamil");
        String city = getFieldValue(columns, fieldMapping, "city");
        String citySinhala = getFieldValue(columns, fieldMapping, "city_sinhala");
        String cityTamil = getFieldValue(columns, fieldMapping, "city_tamil");
        String state = getFieldValue(columns, fieldMapping, "state");
        String stateSinhala = getFieldValue(columns, fieldMapping, "state_sinhala");
        String stateTamil = getFieldValue(columns, fieldMapping, "state_tamil");
        String zipCode = getFieldValue(columns, fieldMapping, "zipCode");
        String country = getFieldValue(columns, fieldMapping, "country");
        String countrySinhala = getFieldValue(columns, fieldMapping, "country_sinhala");
        String countryTamil = getFieldValue(columns, fieldMapping, "country_tamil");
        String isAccessibleStr = getFieldValue(columns, fieldMapping, "isAccessible");
        
        // Check for duplicates using any available city field
        String cityToCheck = city != null && !city.isEmpty() ? city : 
                           citySinhala != null && !citySinhala.isEmpty() ? citySinhala :
                           cityTamil != null && !cityTamil.isEmpty() ? cityTamil : null;
                           
        if (stopRepository.existsByAnyNameVariantAndAnyCity(name, nameSinhala, nameTamil, cityToCheck)) {
            throw new IllegalArgumentException("Stop already exists: " + primaryName + 
                (cityToCheck != null ? " in " + cityToCheck : ""));
        }
        
        // Parse coordinates if available
        Double latitude = null;
        Double longitude = null;
        if (latitudeStr != null && !latitudeStr.isEmpty() && longitudeStr != null && !longitudeStr.isEmpty()) {
            try {
                latitude = Double.parseDouble(latitudeStr);
                longitude = Double.parseDouble(longitudeStr);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Invalid latitude or longitude format: " + latitudeStr + ", " + longitudeStr);
            }
        }
        
        // Parse accessibility
        Boolean isAccessible = null;
        if (isAccessibleStr != null && !isAccessibleStr.isEmpty()) {
            isAccessible = Boolean.parseBoolean(isAccessibleStr);
        } else {
            isAccessible = true; // Default to accessible
        }
        
        // Use default country if not provided
        if (country == null || country.isEmpty()) {
            country = defaultCountry;
        }
        
        // Create and save stop
        Stop stop = new Stop();
        stop.setName(name);
        stop.setNameSinhala(nameSinhala);
        stop.setNameTamil(nameTamil);
        stop.setDescription(description);
        stop.setIsAccessible(isAccessible);
        
        // Set location with available data
        Stop.Location location = new Stop.Location();
        location.setLatitude(latitude);
        location.setLongitude(longitude);
        location.setAddress(address);
        location.setAddressSinhala(addressSinhala);
        location.setAddressTamil(addressTamil);
        location.setCity(city);
        location.setCitySinhala(citySinhala);
        location.setCityTamil(cityTamil);
        location.setState(state);
        location.setStateSinhala(stateSinhala);
        location.setStateTamil(stateTamil);
        location.setZipCode(zipCode);
        location.setCountry(country);
        location.setCountrySinhala(countrySinhala);
        location.setCountryTamil(countryTamil);
        stop.setLocation(location);
        
        stop.setCreatedAt(LocalDateTime.now());
        stop.setUpdatedAt(LocalDateTime.now());
        stop.setCreatedBy(userId);
        stop.setUpdatedBy(userId);
        
        Stop savedStop = stopRepository.save(stop);
        
        // Add to imported stops list
        StopImportResponse.ImportedStop importedStop = new StopImportResponse.ImportedStop();
        importedStop.setId(savedStop.getId());
        importedStop.setName(primaryName);
        importedStop.setOriginalStopId(originalStopId);
        importedStop.setRowNumber(rowNumber);
        importedStops.add(importedStop);
        
        log.debug("Successfully imported dynamic stop: {} with ID: {}", primaryName, savedStop.getId());
    }
    
    /**
     * Safely extracts field value from columns array
     */
    private String getFieldValue(String[] columns, Map<String, Integer> fieldMapping, String fieldName) {
        Integer index = fieldMapping.get(fieldName);
        if (index == null || index >= columns.length) {
            return null;
        }
        String value = columns[index].trim();
        return value.isEmpty() ? null : value;
    }

    @Override
    public StopExportResponse exportStops(StopExportRequest request, String userId) {
        log.info("Starting stops export for user: {}, request: {}", userId, request);
        
        try {
            // Get stops based on filters
            List<Stop> stops = getFilteredStops(request);
            
            // Generate export content based on format
            StopExportResponse response = new StopExportResponse();
            
            if (request.getFormat() == StopExportRequest.ExportFormat.CSV) {
                generateCSVExport(stops, request, response, userId);
            } else {
                generateJSONExport(stops, request, response, userId);
            }
            
            log.info("Successfully exported {} stops for user: {}", stops.size(), userId);
            return response;
            
        } catch (Exception e) {
            log.error("Error exporting stops for user: {}", userId, e);
            throw new RuntimeException("Failed to export stops: " + e.getMessage(), e);
        }
    }
    
    private List<Stop> getFilteredStops(StopExportRequest request) {
        if (Boolean.TRUE.equals(request.getExportAll())) {
            return stopRepository.findAll();
        }
        
        return stopRepository.findStopsForExport(
            request.getStopIds(),
            request.getCities(),
            request.getStates(),
            request.getCountries(),
            request.getIsAccessible(),
            request.getSearchText()
        );
    }
    
    private void generateCSVExport(List<Stop> stops, StopExportRequest request, 
                                  StopExportResponse response, String userId) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8))) {
            
            // Write CSV headers
            List<String> headers = buildCSVHeaders(request);
            writer.println(String.join(",", headers));
            
            // Write data rows
            for (Stop stop : stops) {
                List<String> row = buildCSVRow(stop, request);
                writer.println(String.join(",", row.stream()
                    .map(this::escapeCsvField)
                    .collect(Collectors.toList())));
            }
            
            writer.flush();
        }
        
        // Set response properties
        response.setContent(baos.toByteArray());
        response.setContentType("text/csv");
        response.setFileName(generateFileName(request, "csv"));
        
        // Set metadata
        response.setMetadata(buildExportMetadata(stops, request, userId));
    }
    
    private void generateJSONExport(List<Stop> stops, StopExportRequest request, 
                                   StopExportResponse response, String userId) throws Exception {
        // Convert stops to response DTOs
        List<StopResponse> stopResponses = stops.stream()
            .map(stop -> mapperUtils.map(stop, StopResponse.class))
            .collect(Collectors.toList());
            
        // Convert to JSON
        String jsonContent = "[\n" + stopResponses.stream()
            .map(stop -> "  " + convertStopToJson(stop, request))
            .collect(Collectors.joining(",\n")) + "\n]";
            
        response.setContent(jsonContent.getBytes(StandardCharsets.UTF_8));
        response.setContentType("application/json");
        response.setFileName(generateFileName(request, "json"));
        response.setMetadata(buildExportMetadata(stops, request, userId));
    }
    
    private List<String> buildCSVHeaders(StopExportRequest request) {
        List<String> headers = new ArrayList<>();
        
        // Always include essential fields
        headers.add("id");
        headers.add("name");
        
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            headers.add("name_sinhala");
            headers.add("name_tamil");
        }
        
        headers.add("description");
        
        if (Boolean.TRUE.equals(request.getIncludeLocationDetails())) {
            headers.add("latitude");
            headers.add("longitude");
            headers.add("address");
            headers.add("city");
            headers.add("state");
            headers.add("zip_code");
            headers.add("country");
            
            if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
                headers.add("address_sinhala");
                headers.add("city_sinhala");
                headers.add("state_sinhala");
                headers.add("country_sinhala");
                headers.add("address_tamil");
                headers.add("city_tamil");
                headers.add("state_tamil");
                headers.add("country_tamil");
            }
        }
        
        headers.add("is_accessible");
        
        if (Boolean.TRUE.equals(request.getIncludeTimestamps())) {
            headers.add("created_at");
            headers.add("updated_at");
        }
        
        if (Boolean.TRUE.equals(request.getIncludeUserInfo())) {
            headers.add("created_by");
            headers.add("updated_by");
        }
        
        return headers;
    }
    
    private List<String> buildCSVRow(Stop stop, StopExportRequest request) {
        List<String> row = new ArrayList<>();
        
        // Essential fields
        row.add(stop.getId().toString());
        row.add(stop.getName());
        
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            row.add(stop.getNameSinhala());
            row.add(stop.getNameTamil());
        }
        
        row.add(stop.getDescription());
        
        if (Boolean.TRUE.equals(request.getIncludeLocationDetails()) && stop.getLocation() != null) {
            Stop.Location loc = stop.getLocation();
            row.add(loc.getLatitude() != null ? loc.getLatitude().toString() : "");
            row.add(loc.getLongitude() != null ? loc.getLongitude().toString() : "");
            row.add(loc.getAddress());
            row.add(loc.getCity());
            row.add(loc.getState());
            row.add(loc.getZipCode());
            row.add(loc.getCountry());
            
            if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
                row.add(loc.getAddressSinhala());
                row.add(loc.getCitySinhala());
                row.add(loc.getStateSinhala());
                row.add(loc.getCountrySinhala());
                row.add(loc.getAddressTamil());
                row.add(loc.getCityTamil());
                row.add(loc.getStateTamil());
                row.add(loc.getCountryTamil());
            }
        }
        
        row.add(stop.getIsAccessible() != null ? stop.getIsAccessible().toString() : "");
        
        if (Boolean.TRUE.equals(request.getIncludeTimestamps())) {
            row.add(stop.getCreatedAt() != null ? stop.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : "");
            row.add(stop.getUpdatedAt() != null ? stop.getUpdatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : "");
        }
        
        if (Boolean.TRUE.equals(request.getIncludeUserInfo())) {
            row.add(stop.getCreatedBy());
            row.add(stop.getUpdatedBy());
        }
        
        return row;
    }
    
    private String escapeCsvField(String field) {
        if (field == null) {
            return "";
        }
        
        // If field contains comma, newline, or quote, wrap it in quotes and escape internal quotes
        if (field.contains(",") || field.contains("\n") || field.contains("\"")) {
            return "\"" + field.replace("\"", "\"\"") + "\"";
        }
        
        return field;
    }
    
    private String convertStopToJson(StopResponse stop, StopExportRequest request) {
        StringBuilder json = new StringBuilder();
        json.append("{\n");
        
        json.append("    \"id\": \"").append(stop.getId()).append("\",\n");
        json.append("    \"name\": ").append(jsonValue(stop.getName())).append(",\n");
        
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            json.append("    \"nameSinhala\": ").append(jsonValue(stop.getNameSinhala())).append(",\n");
            json.append("    \"nameTamil\": ").append(jsonValue(stop.getNameTamil())).append(",\n");
        }
        
        json.append("    \"description\": ").append(jsonValue(stop.getDescription())).append(",\n");
        json.append("    \"isAccessible\": ").append(stop.getIsAccessible()).append(",\n");
        
        if (Boolean.TRUE.equals(request.getIncludeLocationDetails()) && stop.getLocation() != null) {
            json.append("    \"location\": ").append(locationToJson(stop.getLocation(), request));
        } else {
            json.append("    \"location\": null");
        }
        
        if (Boolean.TRUE.equals(request.getIncludeTimestamps())) {
            json.append(",\n    \"createdAt\": ").append(jsonValue(stop.getCreatedAt())).append(",\n");
            json.append("    \"updatedAt\": ").append(jsonValue(stop.getUpdatedAt()));
        }
        
        if (Boolean.TRUE.equals(request.getIncludeUserInfo())) {
            json.append(",\n    \"createdBy\": ").append(jsonValue(stop.getCreatedBy())).append(",\n");
            json.append("    \"updatedBy\": ").append(jsonValue(stop.getUpdatedBy()));
        }
        
        json.append("\n  }");
        return json.toString();
    }
    
    private String locationToJson(LocationDto location, StopExportRequest request) {
        StringBuilder json = new StringBuilder();
        json.append("{\n");
        json.append("      \"latitude\": ").append(location.getLatitude()).append(",\n");
        json.append("      \"longitude\": ").append(location.getLongitude()).append(",\n");
        json.append("      \"address\": ").append(jsonValue(location.getAddress())).append(",\n");
        json.append("      \"city\": ").append(jsonValue(location.getCity())).append(",\n");
        json.append("      \"state\": ").append(jsonValue(location.getState())).append(",\n");
        json.append("      \"zipCode\": ").append(jsonValue(location.getZipCode())).append(",\n");
        json.append("      \"country\": ").append(jsonValue(location.getCountry()));
        
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            json.append(",\n      \"addressSinhala\": ").append(jsonValue(location.getAddressSinhala()));
            json.append(",\n      \"citySinhala\": ").append(jsonValue(location.getCitySinhala()));
            json.append(",\n      \"stateSinhala\": ").append(jsonValue(location.getStateSinhala()));
            json.append(",\n      \"countrySinhala\": ").append(jsonValue(location.getCountrySinhala()));
            json.append(",\n      \"addressTamil\": ").append(jsonValue(location.getAddressTamil()));
            json.append(",\n      \"cityTamil\": ").append(jsonValue(location.getCityTamil()));
            json.append(",\n      \"stateTamil\": ").append(jsonValue(location.getStateTamil()));
            json.append(",\n      \"countryTamil\": ").append(jsonValue(location.getCountryTamil()));
        }
        
        json.append("\n    }");
        return json.toString();
    }
    
    private String jsonValue(Object value) {
        if (value == null) {
            return "null";
        }
        if (value instanceof String) {
            return "\"" + ((String) value).replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
        }
        return value.toString();
    }
    
    private String generateFileName(StopExportRequest request, String extension) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String scope = Boolean.TRUE.equals(request.getExportAll()) ? "all_stops" : "filtered_stops";
        return String.format("stops_export_%s_%s.%s", scope, timestamp, extension);
    }
    
    private StopExportResponse.ExportMetadata buildExportMetadata(List<Stop> stops, 
                                                                StopExportRequest request, 
                                                                String userId) {
        StopExportResponse.ExportMetadata metadata = new StopExportResponse.ExportMetadata();
        metadata.setTotalRecordsFound(stops.size());
        metadata.setRecordsExported(stops.size());
        metadata.setExportedAt(LocalDateTime.now());
        metadata.setExportedBy(userId);
        metadata.setFormat(request.getFormat().toString());
        
        // Build filter summary
        StopExportResponse.FilterSummary filterSummary = new StopExportResponse.FilterSummary();
        filterSummary.setExportedAll(Boolean.TRUE.equals(request.getExportAll()));
        filterSummary.setSpecificStopIds(request.getStopIds() != null ? request.getStopIds().size() : 0);
        filterSummary.setCities(request.getCities());
        filterSummary.setStates(request.getStates());
        filterSummary.setCountries(request.getCountries());
        filterSummary.setAccessibilityFilter(request.getIsAccessible());
        filterSummary.setSearchText(request.getSearchText());
        metadata.setFiltersApplied(filterSummary);
        
        // Build export options
        StopExportResponse.ExportOptions exportOptions = new StopExportResponse.ExportOptions();
        exportOptions.setIncludeMultiLanguageFields(request.getIncludeMultiLanguageFields());
        exportOptions.setIncludeLocationDetails(request.getIncludeLocationDetails());
        exportOptions.setIncludeTimestamps(request.getIncludeTimestamps());
        exportOptions.setIncludeUserInfo(request.getIncludeUserInfo());
        exportOptions.setCustomFields(request.getCustomFields());
        metadata.setOptionsUsed(exportOptions);
        
        return metadata;
    }

    @Override
    public StopBulkUpdateResponse bulkUpdateStops(MultipartFile csvFile, StopBulkUpdateRequest request, String userId) {
        log.info("Starting bulk update of stops from CSV file: {} by user: {}", csvFile.getOriginalFilename(), userId);
        
        long startTime = System.currentTimeMillis();
        StopBulkUpdateResponse response = new StopBulkUpdateResponse();
        
        response.setUpdateResults(new ArrayList<>());
        response.setSkippedRecords(new ArrayList<>());
        response.setErrorRecords(new ArrayList<>());
        
        int totalRowsProcessed = 0;
        int successfulUpdates = 0;
        int successfulCreations = 0;
        int skippedRows = 0;
        int errorRows = 0;

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(csvFile.getInputStream(), StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null) {
                throw new RuntimeException("CSV file is empty");
            }
            
            String[] headers = headerLine.split(",");
            Map<String, Integer> fieldMapping = createFieldMapping(headers);
            
            // Check if we have ID field for ID-based matching
            boolean hasIdField = fieldMapping.containsKey("original_stop_id") || fieldMapping.containsKey("id");
            
            String line;
            int rowNumber = 1; // Starting from 1 (header is 0)
            
            while ((line = reader.readLine()) != null) {
                rowNumber++;
                totalRowsProcessed++;
                
                try {
                    String[] columns = parseCsvLine(line);
                    if (columns.length == 0) continue; // Skip empty rows
                    
                    BulkUpdateResult result = processBulkUpdateRow(columns, fieldMapping, rowNumber, userId, request, hasIdField);
                    
                    switch (result.getStatus()) {
                        case SUCCESS_UPDATED:
                            successfulUpdates++;
                            addUpdateResult(response, result, "UPDATED");
                            break;
                        case SUCCESS_CREATED:
                            successfulCreations++;
                            addUpdateResult(response, result, "CREATED");
                            break;
                        case SKIPPED:
                            skippedRows++;
                            addSkippedRecord(response, result);
                            break;
                        case ERROR:
                            errorRows++;
                            addErrorRecord(response, result, columns);
                            break;
                    }
                    
                } catch (Exception e) {
                    log.error("Error processing row {}: {}", rowNumber, e.getMessage(), e);
                    errorRows++;
                    addErrorRecord(response, rowNumber, "PROCESSING_ERROR", e.getMessage(), line);
                }
            }
            
        } catch (Exception e) {
            log.error("Error processing CSV file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to process CSV file: " + e.getMessage());
        }
        
        // Build summary
        StopBulkUpdateResponse.UpdateSummary summary = new StopBulkUpdateResponse.UpdateSummary();
        summary.setTotalRowsProcessed(totalRowsProcessed);
        summary.setSuccessfulUpdates(successfulUpdates);
        summary.setSuccessfulCreations(successfulCreations);
        summary.setSkippedRows(skippedRows);
        summary.setErrorRows(errorRows);
        summary.setSuccessRate(totalRowsProcessed > 0 ? 
            ((double)(successfulUpdates + successfulCreations) / totalRowsProcessed) * 100.0 : 0.0);
        response.setSummary(summary);
        
        // Build metadata
        StopBulkUpdateResponse.UpdateMetadata metadata = new StopBulkUpdateResponse.UpdateMetadata();
        metadata.setProcessedAt(LocalDateTime.now());
        metadata.setProcessedBy(userId);
        metadata.setFileName(csvFile.getOriginalFilename());
        metadata.setFileSize(csvFile.getSize());
        metadata.setUpdateStrategy(request.getUpdateStrategy().name());
        metadata.setMatchingStrategy(request.getMatchingStrategy().name());
        metadata.setPartialUpdate(request.getPartialUpdate());
        metadata.setCreateMissing(request.getCreateMissing());
        metadata.setProcessingTimeMs(System.currentTimeMillis() - startTime);
        response.setMetadata(metadata);
        
        log.info("Completed bulk update: {} total, {} updated, {} created, {} skipped, {} errors", 
                totalRowsProcessed, successfulUpdates, successfulCreations, skippedRows, errorRows);
        
        return response;
    }
    
    private BulkUpdateResult processBulkUpdateRow(String[] columns, Map<String, Integer> fieldMapping, 
                                                int rowNumber, String userId, StopBulkUpdateRequest request, boolean hasIdField) {
        
        BulkUpdateResult result = new BulkUpdateResult();
        result.setRowNumber(rowNumber);
        
        try {
            // Extract identifier for matching
            String stopId = getFieldValue(columns, fieldMapping, "original_stop_id");
            if (stopId == null) {
                stopId = getFieldValue(columns, fieldMapping, "id");
            }
            String stopName = getFieldValue(columns, fieldMapping, "name");
            String cityName = getFieldValue(columns, fieldMapping, "city");
            
            result.setStopIdentifier(stopId != null ? stopId : (stopName + " (" + cityName + ")"));
            
            // Find existing stop based on strategy
            Stop existingStop = findExistingStop(stopId, stopName, cityName, request.getMatchingStrategy(), hasIdField);
            
            if (existingStop == null) {
                if (request.getCreateMissing()) {
                    // Create new stop
                    Stop newStop = createStopFromCsvRow(columns, fieldMapping, userId, request);
                    result.setStatus(BulkUpdateStatus.SUCCESS_CREATED);
                    result.setStop(newStop);
                    result.setMatchedBy("NEW");
                } else {
                    result.setStatus(BulkUpdateStatus.SKIPPED);
                    result.setReason("Stop not found and create missing is disabled");
                }
                return result;
            }
            
            // Check update strategy
            if (request.getUpdateStrategy() == StopBulkUpdateRequest.UpdateStrategy.SKIP_CONFLICTS) {
                // Additional conflict checks can be added here
                // For now, we'll proceed with update
            }
            
            // Update existing stop
            List<String> updatedFields = updateStopFromCsvRow(existingStop, columns, fieldMapping, userId, request);
            
            if (!updatedFields.isEmpty()) {
                stopRepository.save(existingStop);
                result.setStatus(BulkUpdateStatus.SUCCESS_UPDATED);
                result.setStop(existingStop);
                result.setUpdatedFields(updatedFields);
                result.setMatchedBy(stopId != null ? "ID" : "NAME_AND_CITY");
            } else {
                result.setStatus(BulkUpdateStatus.SKIPPED);
                result.setReason("No changes detected");
            }
            
        } catch (Exception e) {
            result.setStatus(BulkUpdateStatus.ERROR);
            result.setErrorMessage(e.getMessage());
        }
        
        return result;
    }
    
    private Stop findExistingStop(String stopId, String stopName, String cityName, 
                                StopBulkUpdateRequest.MatchingStrategy strategy, boolean hasIdField) {
        
        switch (strategy) {
            case ID:
                if (stopId != null && hasIdField) {
                    try {
                        UUID uuid = UUID.fromString(stopId);
                        return stopRepository.findById(uuid).orElse(null);
                    } catch (Exception e) {
                        log.warn("Invalid UUID format for stop ID: {}", stopId);
                    }
                }
                return null;
                
            case NAME_AND_CITY:
                if (stopName != null && cityName != null) {
                    return stopRepository.findAll().stream()
                            .filter(stop -> matchesByNameAndCity(stop, stopName, cityName))
                            .findFirst()
                            .orElse(null);
                }
                return null;
                
            case AUTO:
            default:
                // Try ID first, then fallback to name+city
                Stop stop = findExistingStop(stopId, stopName, cityName, StopBulkUpdateRequest.MatchingStrategy.ID, hasIdField);
                if (stop == null) {
                    stop = findExistingStop(stopId, stopName, cityName, StopBulkUpdateRequest.MatchingStrategy.NAME_AND_CITY, hasIdField);
                }
                return stop;
        }
    }
    
    private boolean matchesByNameAndCity(Stop stop, String csvName, String csvCity) {
        // Check all language variants for both name and city
        return (matchesName(stop, csvName) && matchesCity(stop, csvCity));
    }
    
    private boolean matchesName(Stop stop, String csvName) {
        if (csvName == null) return false;
        String lowerCsvName = csvName.toLowerCase().trim();
        
        return (stop.getName() != null && stop.getName().toLowerCase().trim().equals(lowerCsvName)) ||
               (stop.getNameSinhala() != null && stop.getNameSinhala().toLowerCase().trim().equals(lowerCsvName)) ||
               (stop.getNameTamil() != null && stop.getNameTamil().toLowerCase().trim().equals(lowerCsvName));
    }
    
    private boolean matchesCity(Stop stop, String csvCity) {
        if (csvCity == null || stop.getLocation() == null) return false;
        String lowerCsvCity = csvCity.toLowerCase().trim();
        
        return (stop.getLocation().getCity() != null && stop.getLocation().getCity().toLowerCase().trim().equals(lowerCsvCity)) ||
               (stop.getLocation().getCitySinhala() != null && stop.getLocation().getCitySinhala().toLowerCase().trim().equals(lowerCsvCity)) ||
               (stop.getLocation().getCityTamil() != null && stop.getLocation().getCityTamil().toLowerCase().trim().equals(lowerCsvCity));
    }
    
    private Stop createStopFromCsvRow(String[] columns, Map<String, Integer> fieldMapping, 
                                    String userId, StopBulkUpdateRequest request) {
        
        StopRequest stopRequest = buildStopRequestFromCsv(columns, fieldMapping, request);
        return createStopEntity(stopRequest, userId);
    }
    
    private List<String> updateStopFromCsvRow(Stop existingStop, String[] columns, Map<String, Integer> fieldMapping, 
                                            String userId, StopBulkUpdateRequest request) {
        
        List<String> updatedFields = new ArrayList<>();
        
        // Update name fields
        updateStringField(existingStop::setName, existingStop.getName(), 
                         getFieldValue(columns, fieldMapping, "name"), "name", updatedFields, request.getPartialUpdate());
        updateStringField(existingStop::setNameSinhala, existingStop.getNameSinhala(), 
                         getFieldValue(columns, fieldMapping, "name_sinhala"), "nameSinhala", updatedFields, request.getPartialUpdate());
        updateStringField(existingStop::setNameTamil, existingStop.getNameTamil(), 
                         getFieldValue(columns, fieldMapping, "name_tamil"), "nameTamil", updatedFields, request.getPartialUpdate());
        
        // Update description
        updateStringField(existingStop::setDescription, existingStop.getDescription(), 
                         getFieldValue(columns, fieldMapping, "description"), "description", updatedFields, request.getPartialUpdate());
        
        // Update location fields
        if (existingStop.getLocation() != null) {
            updateLocationField(existingStop.getLocation(), columns, fieldMapping, updatedFields, request);
        }
        
        // Update accessibility
        String accessibleStr = getFieldValue(columns, fieldMapping, "isAccessible");
        if (!request.getPartialUpdate() || (accessibleStr != null && !accessibleStr.trim().isEmpty())) {
            Boolean newAccessible = parseBoolean(accessibleStr);
            if (!java.util.Objects.equals(existingStop.getIsAccessible(), newAccessible)) {
                existingStop.setIsAccessible(newAccessible);
                updatedFields.add("isAccessible");
            }
        }
        
        // Update audit fields
        if (!updatedFields.isEmpty()) {
            existingStop.setUpdatedAt(LocalDateTime.now());
            existingStop.setUpdatedBy(userId);
        }
        
        return updatedFields;
    }
    
    private void updateStringField(java.util.function.Consumer<String> setter, String currentValue, 
                                 String newValue, String fieldName, List<String> updatedFields, boolean partialUpdate) {
        
        if (!partialUpdate || (newValue != null && !newValue.trim().isEmpty())) {
            if (!java.util.Objects.equals(currentValue, newValue)) {
                setter.accept(newValue);
                updatedFields.add(fieldName);
            }
        }
    }
    
    private void updateLocationField(Stop.Location location, String[] columns, 
                                   Map<String, Integer> fieldMapping, List<String> updatedFields, StopBulkUpdateRequest request) {
        
        // Update address fields
        updateStringField(location::setAddress, location.getAddress(), 
                         getFieldValue(columns, fieldMapping, "address"), "address", updatedFields, request.getPartialUpdate());
        updateStringField(location::setAddressSinhala, location.getAddressSinhala(), 
                         getFieldValue(columns, fieldMapping, "address_sinhala"), "addressSinhala", updatedFields, request.getPartialUpdate());
        updateStringField(location::setAddressTamil, location.getAddressTamil(), 
                         getFieldValue(columns, fieldMapping, "address_tamil"), "addressTamil", updatedFields, request.getPartialUpdate());
        
        // Update city fields
        updateStringField(location::setCity, location.getCity(), 
                         getFieldValue(columns, fieldMapping, "city"), "city", updatedFields, request.getPartialUpdate());
        updateStringField(location::setCitySinhala, location.getCitySinhala(), 
                         getFieldValue(columns, fieldMapping, "city_sinhala"), "citySinhala", updatedFields, request.getPartialUpdate());
        updateStringField(location::setCityTamil, location.getCityTamil(), 
                         getFieldValue(columns, fieldMapping, "city_tamil"), "cityTamil", updatedFields, request.getPartialUpdate());
        
        // Update state fields
        updateStringField(location::setState, location.getState(), 
                         getFieldValue(columns, fieldMapping, "state"), "state", updatedFields, request.getPartialUpdate());
        updateStringField(location::setStateSinhala, location.getStateSinhala(), 
                         getFieldValue(columns, fieldMapping, "state_sinhala"), "stateSinhala", updatedFields, request.getPartialUpdate());
        updateStringField(location::setStateTamil, location.getStateTamil(), 
                         getFieldValue(columns, fieldMapping, "state_tamil"), "stateTamil", updatedFields, request.getPartialUpdate());
        
        // Update country fields
        updateStringField(location::setCountry, location.getCountry(), 
                         getFieldValue(columns, fieldMapping, "country"), "country", updatedFields, request.getPartialUpdate());
        updateStringField(location::setCountrySinhala, location.getCountrySinhala(), 
                         getFieldValue(columns, fieldMapping, "country_sinhala"), "countrySinhala", updatedFields, request.getPartialUpdate());
        updateStringField(location::setCountryTamil, location.getCountryTamil(), 
                         getFieldValue(columns, fieldMapping, "country_tamil"), "countryTamil", updatedFields, request.getPartialUpdate());
        
        // Update zipCode
        updateStringField(location::setZipCode, location.getZipCode(), 
                         getFieldValue(columns, fieldMapping, "zipCode"), "zipCode", updatedFields, request.getPartialUpdate());
        
        // Update coordinates
        String latStr = getFieldValue(columns, fieldMapping, "latitude");
        String lngStr = getFieldValue(columns, fieldMapping, "longitude");
        
        if (!request.getPartialUpdate() || (latStr != null && !latStr.trim().isEmpty())) {
            try {
                Double newLat = latStr != null && !latStr.trim().isEmpty() ? Double.parseDouble(latStr) : null;
                if (!java.util.Objects.equals(location.getLatitude(), newLat)) {
                    location.setLatitude(newLat);
                    updatedFields.add("latitude");
                }
            } catch (NumberFormatException e) {
                log.warn("Invalid latitude format: {}", latStr);
            }
        }
        
        if (!request.getPartialUpdate() || (lngStr != null && !lngStr.trim().isEmpty())) {
            try {
                Double newLng = lngStr != null && !lngStr.trim().isEmpty() ? Double.parseDouble(lngStr) : null;
                if (!java.util.Objects.equals(location.getLongitude(), newLng)) {
                    location.setLongitude(newLng);
                    updatedFields.add("longitude");
                }
            } catch (NumberFormatException e) {
                log.warn("Invalid longitude format: {}", lngStr);
            }
        }
    }
    
    private StopRequest buildStopRequestFromCsv(String[] columns, Map<String, Integer> fieldMapping, StopBulkUpdateRequest request) {
        StopRequest stopRequest = new StopRequest();
        
        // Basic fields
        stopRequest.setName(getFieldValue(columns, fieldMapping, "name"));
        stopRequest.setNameSinhala(getFieldValue(columns, fieldMapping, "name_sinhala"));
        stopRequest.setNameTamil(getFieldValue(columns, fieldMapping, "name_tamil"));
        stopRequest.setDescription(getFieldValue(columns, fieldMapping, "description"));
        
        // Location
        LocationDto locationDto = new LocationDto();
        locationDto.setAddress(getFieldValue(columns, fieldMapping, "address"));
        locationDto.setAddressSinhala(getFieldValue(columns, fieldMapping, "address_sinhala"));
        locationDto.setAddressTamil(getFieldValue(columns, fieldMapping, "address_tamil"));
        locationDto.setCity(getFieldValue(columns, fieldMapping, "city"));
        locationDto.setCitySinhala(getFieldValue(columns, fieldMapping, "city_sinhala"));
        locationDto.setCityTamil(getFieldValue(columns, fieldMapping, "city_tamil"));
        locationDto.setState(getFieldValue(columns, fieldMapping, "state"));
        locationDto.setStateSinhala(getFieldValue(columns, fieldMapping, "state_sinhala"));
        locationDto.setStateTamil(getFieldValue(columns, fieldMapping, "state_tamil"));
        locationDto.setCountry(getFieldValue(columns, fieldMapping, "country"));
        locationDto.setCountrySinhala(getFieldValue(columns, fieldMapping, "country_sinhala"));
        locationDto.setCountryTamil(getFieldValue(columns, fieldMapping, "country_tamil"));
        locationDto.setZipCode(getFieldValue(columns, fieldMapping, "zipCode"));
        
        // Coordinates
        String latStr = getFieldValue(columns, fieldMapping, "latitude");
        String lngStr = getFieldValue(columns, fieldMapping, "longitude");
        try {
            if (latStr != null && !latStr.trim().isEmpty()) {
                locationDto.setLatitude(Double.parseDouble(latStr));
            }
            if (lngStr != null && !lngStr.trim().isEmpty()) {
                locationDto.setLongitude(Double.parseDouble(lngStr));
            }
        } catch (NumberFormatException e) {
            log.warn("Invalid coordinate format: lat={}, lng={}", latStr, lngStr);
        }
        
        // Use default country if not specified
        if (locationDto.getCountry() == null && request.getDefaultCountry() != null) {
            locationDto.setCountry(request.getDefaultCountry());
        }
        
        stopRequest.setLocation(locationDto);
        
        // Accessibility
        String accessibleStr = getFieldValue(columns, fieldMapping, "isAccessible");
        stopRequest.setIsAccessible(parseBoolean(accessibleStr));
        
        return stopRequest;
    }
    
    private Stop createStopEntity(StopRequest request, String userId) {
        // Reuse existing logic from createStop method
        Stop stop = mapperUtils.map(request, Stop.class);
        stop.setCreatedAt(LocalDateTime.now());
        stop.setUpdatedAt(LocalDateTime.now());
        stop.setCreatedBy(userId);
        stop.setUpdatedBy(userId);
        
        return stopRepository.save(stop);
    }
    
    private Boolean parseBoolean(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        
        String lowerValue = value.toLowerCase().trim();
        return "true".equals(lowerValue) || "yes".equals(lowerValue) || "1".equals(lowerValue) || "y".equals(lowerValue);
    }
    
    private String[] parseCsvLine(String line) {
        // Simple CSV parsing - can be enhanced for complex scenarios
        return line.split(",", -1);
    }
    
    private void addUpdateResult(StopBulkUpdateResponse response, BulkUpdateResult result, String operation) {
        StopBulkUpdateResponse.UpdateResult updateResult = new StopBulkUpdateResponse.UpdateResult();
        updateResult.setRowNumber(result.getRowNumber());
        updateResult.setStopId(result.getStop().getId());
        updateResult.setStopName(result.getStop().getName());
        updateResult.setOperation(operation);
        updateResult.setMatchedBy(result.getMatchedBy());
        updateResult.setUpdatedFields(result.getUpdatedFields());
        updateResult.setUpdatedStop(mapperUtils.map(result.getStop(), StopResponse.class));
        
        response.getUpdateResults().add(updateResult);
    }
    
    private void addSkippedRecord(StopBulkUpdateResponse response, BulkUpdateResult result) {
        StopBulkUpdateResponse.SkippedRecord skippedRecord = new StopBulkUpdateResponse.SkippedRecord();
        skippedRecord.setRowNumber(result.getRowNumber());
        skippedRecord.setReason(result.getReason());
        skippedRecord.setStopIdentifier(result.getStopIdentifier());
        skippedRecord.setDetails(result.getErrorMessage());
        
        response.getSkippedRecords().add(skippedRecord);
    }
    
    private void addErrorRecord(StopBulkUpdateResponse response, BulkUpdateResult result, String[] columns) {
        StopBulkUpdateResponse.ErrorRecord errorRecord = new StopBulkUpdateResponse.ErrorRecord();
        errorRecord.setRowNumber(result.getRowNumber());
        errorRecord.setErrorType("PROCESSING_ERROR");
        errorRecord.setErrorMessage(result.getErrorMessage());
        errorRecord.setStopIdentifier(result.getStopIdentifier());
        errorRecord.setCsvData(java.util.Arrays.asList(columns));
        
        response.getErrorRecords().add(errorRecord);
    }
    
    private void addErrorRecord(StopBulkUpdateResponse response, int rowNumber, String errorType, String errorMessage, String csvLine) {
        StopBulkUpdateResponse.ErrorRecord errorRecord = new StopBulkUpdateResponse.ErrorRecord();
        errorRecord.setRowNumber(rowNumber);
        errorRecord.setErrorType(errorType);
        errorRecord.setErrorMessage(errorMessage);
        errorRecord.setStopIdentifier("Row " + rowNumber);
        errorRecord.setCsvData(java.util.Arrays.asList(csvLine.split(",")));
        
        response.getErrorRecords().add(errorRecord);
    }
    
    // Helper class for bulk update processing
    private static class BulkUpdateResult {
        private int rowNumber;
        private BulkUpdateStatus status;
        private Stop stop;
        private String stopIdentifier;
        private String reason;
        private String errorMessage;
        private String matchedBy;
        private List<String> updatedFields;
        
        // Getters and setters
        public int getRowNumber() { return rowNumber; }
        public void setRowNumber(int rowNumber) { this.rowNumber = rowNumber; }
        
        public BulkUpdateStatus getStatus() { return status; }
        public void setStatus(BulkUpdateStatus status) { this.status = status; }
        
        public Stop getStop() { return stop; }
        public void setStop(Stop stop) { this.stop = stop; }
        
        public String getStopIdentifier() { return stopIdentifier; }
        public void setStopIdentifier(String stopIdentifier) { this.stopIdentifier = stopIdentifier; }
        
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
        
        public String getMatchedBy() { return matchedBy; }
        public void setMatchedBy(String matchedBy) { this.matchedBy = matchedBy; }
        
        public List<String> getUpdatedFields() { return updatedFields; }
        public void setUpdatedFields(List<String> updatedFields) { this.updatedFields = updatedFields; }
    }
    
    private enum BulkUpdateStatus {
        SUCCESS_UPDATED,
        SUCCESS_CREATED,
        SKIPPED,
        ERROR
    }
}