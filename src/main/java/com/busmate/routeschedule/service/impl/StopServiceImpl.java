package com.busmate.routeschedule.service.impl;

import com.busmate.routeschedule.dto.common.LocationDto;
import com.busmate.routeschedule.dto.request.StopRequest;
import com.busmate.routeschedule.dto.response.RouteStopDetailResponse;
import com.busmate.routeschedule.dto.response.ScheduleStopDetailResponse;
import com.busmate.routeschedule.dto.response.StopResponse;
import com.busmate.routeschedule.dto.response.StopFilterOptionsResponse;
import com.busmate.routeschedule.dto.response.statistic.StopStatisticsResponse;
import com.busmate.routeschedule.dto.response.importing.StopImportResponse;

import com.busmate.routeschedule.entity.RouteStop;
import com.busmate.routeschedule.entity.ScheduleStop;
import com.busmate.routeschedule.entity.Stop;
import com.busmate.routeschedule.repository.RouteStopRepository;
import com.busmate.routeschedule.repository.ScheduleStopRepository;
import com.busmate.routeschedule.repository.StopRepository;
import com.busmate.routeschedule.service.StopService;
import com.busmate.routeschedule.exception.ResourceNotFoundException;
import com.busmate.routeschedule.exception.ConflictException;
import com.busmate.routeschedule.util.MapperUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
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
        List<RouteStop> routeStops = routeStopRepository.findByRouteIdOrderByStopOrder(routeId);

        return routeStops.stream()
                .map(this::mapToRouteStopDetailResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScheduleStopDetailResponse> getStopsWithScheduleBySchedule(UUID scheduleId) {
        List<ScheduleStop> scheduleStops = scheduleStopRepository.findByScheduleIdOrderByStopOrder(scheduleId);

        return scheduleStops.stream()
                .map(this::mapToScheduleStopDetailResponse)
                .collect(Collectors.toList());
    }

    private RouteStopDetailResponse mapToRouteStopDetailResponse(RouteStop routeStop) {
        RouteStopDetailResponse response = new RouteStopDetailResponse();
        response.setRouteStopId(routeStop.getId());
        response.setStopId(routeStop.getStop().getId());
        response.setStopName(routeStop.getStop().getName());
        response.setStopDescription(routeStop.getStop().getDescription());
        response.setLocation(mapperUtils.map(routeStop.getStop().getLocation(), LocationDto.class));
        response.setIsAccessible(routeStop.getStop().getIsAccessible());
        response.setStopOrder(routeStop.getStopOrder());
        response.setDistanceFromStartKm(routeStop.getDistanceFromStartKm());
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
}