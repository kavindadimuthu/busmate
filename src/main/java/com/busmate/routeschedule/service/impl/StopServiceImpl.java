package com.busmate.routeschedule.service.impl;

import com.busmate.routeschedule.dto.common.LocationDto;
import com.busmate.routeschedule.dto.request.StopRequest;
import com.busmate.routeschedule.dto.response.RouteStopDetailResponse;
import com.busmate.routeschedule.dto.response.ScheduleStopDetailResponse;
import com.busmate.routeschedule.dto.response.StopResponse;
import com.busmate.routeschedule.dto.response.StopStatisticsResponse;
import com.busmate.routeschedule.dto.response.StopImportResponse;
import com.busmate.routeschedule.dto.response.SimpleStopImportResponse;
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
        if (stopRepository.existsByNameAndLocation_City(request.getName(), request.getLocation().getCity())) {
            throw new ConflictException("Stop with name " + request.getName() + " already exists in city " + request.getLocation().getCity());
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

        if (!stop.getName().equals(request.getName()) &&
                stopRepository.existsByNameAndLocation_City(request.getName(), request.getLocation().getCity())) {
            throw new ConflictException("Stop with name " + request.getName() + " already exists in city " + request.getLocation().getCity());
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
    public List<String> getDistinctStates() {
        return stopRepository.findDistinctStates();
    }

    @Override
    public List<Boolean> getDistinctAccessibilityStatuses() {
        return stopRepository.findDistinctAccessibilityStatuses();
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
    public StopImportResponse importStops(MultipartFile file, String userId) {
        StopImportResponse response = new StopImportResponse();
        List<StopImportResponse.ImportError> errors = new ArrayList<>();
        
        int totalRecords = 0;
        int successfulImports = 0;
        int failedImports = 0;
        
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            int rowNumber = 0;
            boolean isHeader = true;
            
            while ((line = reader.readLine()) != null) {
                rowNumber++;
                
                if (isHeader) {
                    isHeader = false;
                    continue; // Skip header row
                }
                
                totalRecords++;
                String[] columns = line.split(",");
                
                try {
                    // Expected CSV format: name,description,latitude,longitude,address,city,state,zipCode,country,isAccessible
                    if (columns.length < 10) {
                        throw new IllegalArgumentException("Invalid CSV format. Expected 10 columns.");
                    }
                    
                    String name = columns[0].trim();
                    String description = columns[1].trim();
                    String latitudeStr = columns[2].trim();
                    String longitudeStr = columns[3].trim();
                    String address = columns[4].trim();
                    String city = columns[5].trim();
                    String state = columns[6].trim();
                    String zipCode = columns[7].trim();
                    String country = columns[8].trim();
                    String isAccessibleStr = columns[9].trim();
                    
                    // Validate required fields
                    if (name.isEmpty()) {
                        throw new IllegalArgumentException("Stop name is required");
                    }
                    
                    if (latitudeStr.isEmpty() || longitudeStr.isEmpty()) {
                        throw new IllegalArgumentException("Latitude and longitude are required");
                    }
                    
                    // Check if stop already exists
                    if (stopRepository.existsByNameAndLocation_City(name, city)) {
                        throw new IllegalArgumentException("Stop already exists in this city: " + name);
                    }
                    
                    // Parse numeric values
                    Double latitude = Double.parseDouble(latitudeStr);
                    Double longitude = Double.parseDouble(longitudeStr);
                    
                    // Parse boolean value
                    Boolean isAccessible = null;
                    if (!isAccessibleStr.isEmpty()) {
                        isAccessible = Boolean.parseBoolean(isAccessibleStr);
                    }
                    
                    // Create and save stop
                    Stop stop = new Stop();
                    stop.setName(name);
                    stop.setDescription(description.isEmpty() ? null : description);
                    stop.setIsAccessible(isAccessible);
                    
                    // Set location
                    Stop.Location location = new Stop.Location();
                    location.setLatitude(latitude);
                    location.setLongitude(longitude);
                    location.setAddress(address.isEmpty() ? null : address);
                    location.setCity(city.isEmpty() ? null : city);
                    location.setState(state.isEmpty() ? null : state);
                    location.setZipCode(zipCode.isEmpty() ? null : zipCode);
                    location.setCountry(country.isEmpty() ? null : country);
                    stop.setLocation(location);
                    
                    stop.setCreatedAt(LocalDateTime.now());
                    stop.setUpdatedAt(LocalDateTime.now());
                    stop.setCreatedBy(userId);
                    stop.setUpdatedBy(userId);
                    
                    stopRepository.save(stop);
                    successfulImports++;
                    
                } catch (Exception e) {
                    failedImports++;
                    StopImportResponse.ImportError error = new StopImportResponse.ImportError();
                    error.setRowNumber(rowNumber);
                    error.setErrorMessage(e.getMessage());
                    error.setValue(line);
                    errors.add(error);
                    
                    log.error("Failed to import stop at row {}: {}", rowNumber, e.getMessage());
                }
            }
            
        } catch (Exception e) {
            log.error("Failed to process import file", e);
            failedImports = totalRecords;
            
            StopImportResponse.ImportError error = new StopImportResponse.ImportError();
            error.setErrorMessage("Failed to process import file: " + e.getMessage());
            errors.add(error);
        }
        
        response.setTotalRecords(totalRecords);
        response.setSuccessfulImports(successfulImports);
        response.setFailedImports(failedImports);
        response.setErrors(errors);
        response.setMessage(String.format("Import completed. %d successful, %d failed out of %d total records.", 
                                        successfulImports, failedImports, totalRecords));
        
        return response;
    }
    
    @Override
    public SimpleStopImportResponse importSimpleStops(MultipartFile file, String userId, String defaultCountry) {
        log.info("Starting simple stop import for user: {}", userId);
        
        SimpleStopImportResponse response = new SimpleStopImportResponse();
        List<SimpleStopImportResponse.ImportError> errors = new ArrayList<>();
        List<SimpleStopImportResponse.ImportedStop> importedStops = new ArrayList<>();
        
        int totalRecords = 0;
        int successfulImports = 0;
        int failedImports = 0;
        
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            int rowNumber = 0;
            boolean isHeader = true;
            
            while ((line = reader.readLine()) != null) {
                rowNumber++;
                
                if (isHeader) {
                    isHeader = false;
                    continue; // Skip header row
                }
                
                totalRecords++;
                String[] columns = line.split(",");
                
                try {
                    // Expected CSV format: stop_id,stop_name
                    if (columns.length < 2) {
                        throw new IllegalArgumentException("Invalid CSV format. Expected 2 columns: stop_id,stop_name");
                    }
                    
                    String stopId = columns[0].trim();
                    String stopName = columns[1].trim();
                    
                    // Validate required fields
                    if (stopName.isEmpty()) {
                        throw new IllegalArgumentException("Stop name is required");
                    }
                    
                    // Check if stop already exists by name (since we don't have city info yet)
                    if (stopRepository.existsByNameAndLocation_City(stopName, null)) {
                        throw new IllegalArgumentException("Stop already exists: " + stopName);
                    }
                    
                    // Create and save stop with default values
                    Stop stop = new Stop();
                    stop.setName(stopName);
                    stop.setDescription(null); // No description in simple format
                    stop.setIsAccessible(true); // Default to accessible
                    
                    // Set default location with minimal info
                    Stop.Location location = new Stop.Location();
                    location.setLatitude(null); // Will be set later through geocoding
                    location.setLongitude(null); // Will be set later through geocoding  
                    location.setAddress(null); // Unknown for now
                    location.setCity(null); // Will try to extract from stop name or set later
                    location.setState(null); // Will be set later
                    location.setZipCode(null); // Unknown
                    location.setCountry(defaultCountry);
                    stop.setLocation(location);
                    
                    stop.setCreatedAt(LocalDateTime.now());
                    stop.setUpdatedAt(LocalDateTime.now());
                    stop.setCreatedBy(userId);
                    stop.setUpdatedBy(userId);
                    
                    Stop savedStop = stopRepository.save(stop);
                    successfulImports++;
                    
                    // Add to imported stops list
                    SimpleStopImportResponse.ImportedStop importedStop = new SimpleStopImportResponse.ImportedStop();
                    importedStop.setId(savedStop.getId());
                    importedStop.setName(savedStop.getName());
                    importedStop.setOriginalStopId(stopId);
                    importedStop.setRowNumber(rowNumber);
                    importedStops.add(importedStop);
                    
                    log.debug("Successfully imported stop: {} with ID: {}", stopName, savedStop.getId());
                    
                } catch (Exception e) {
                    failedImports++;
                    SimpleStopImportResponse.ImportError error = new SimpleStopImportResponse.ImportError();
                    error.setRowNumber(rowNumber);
                    error.setErrorMessage(e.getMessage());
                    error.setValue(line);
                    
                    if (e.getMessage().contains("already exists")) {
                        error.setSuggestion("This stop name already exists in the database. Consider updating the existing stop or use a different name.");
                    } else if (e.getMessage().contains("Stop name is required")) {
                        error.setSuggestion("Ensure the stop_name column is not empty.");
                    } else {
                        error.setSuggestion("Check the CSV format. Expected: stop_id,stop_name");
                    }
                    
                    errors.add(error);
                    log.error("Failed to import stop at row {}: {}", rowNumber, e.getMessage());
                }
            }
            
        } catch (Exception e) {
            log.error("Failed to process simple import file", e);
            failedImports = totalRecords;
            
            SimpleStopImportResponse.ImportError error = new SimpleStopImportResponse.ImportError();
            error.setErrorMessage("Failed to process import file: " + e.getMessage());
            error.setSuggestion("Ensure the file is a valid CSV with format: stop_id,stop_name");
            errors.add(error);
        }
        
        response.setTotalRecords(totalRecords);
        response.setSuccessfulImports(successfulImports);
        response.setFailedImports(failedImports);
        response.setErrors(errors);
        response.setImportedStops(importedStops);
        response.setMessage(String.format("Simple import completed. %d successful, %d failed out of %d total records. %d stops imported with UUIDs.", 
                                        successfulImports, failedImports, totalRecords, importedStops.size()));
        
        log.info("Simple stop import completed. Success: {}, Failed: {}, Total: {}", 
                successfulImports, failedImports, totalRecords);
        
        return response;
    }
}