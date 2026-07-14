package com.busmate.routeschedule.network.service.impl;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.busmate.routeschedule.network.dto.request.StopBatchCreateRequest;
import com.busmate.routeschedule.network.dto.request.StopRequest;
import com.busmate.routeschedule.network.dto.response.RouteGroupStopDetailResponse;
import com.busmate.routeschedule.network.dto.response.RouteStopDetailResponse;
import com.busmate.routeschedule.network.dto.response.StopBatchCreateResponse;
import com.busmate.routeschedule.network.dto.response.StopExistsResponse;
import com.busmate.routeschedule.network.dto.response.StopFilterOptionsResponse;
import com.busmate.routeschedule.network.dto.response.StopResponse;
import com.busmate.routeschedule.network.dto.response.StopStatisticsResponse;
import com.busmate.routeschedule.network.entity.Route;
import com.busmate.routeschedule.network.entity.RouteGroup;
import com.busmate.routeschedule.network.entity.RouteStop;
import com.busmate.routeschedule.network.entity.Stop;
import com.busmate.routeschedule.network.mapper.StopMapper;
import com.busmate.routeschedule.network.repository.RouteGroupRepository;
import com.busmate.routeschedule.network.repository.RouteRepository;
import com.busmate.routeschedule.network.repository.RouteStopRepository;
import com.busmate.routeschedule.network.repository.StopRepository;
import com.busmate.routeschedule.network.service.StopService;
import com.busmate.routeschedule.scheduling.dto.response.ScheduleStopDetailResponse;
import com.busmate.routeschedule.scheduling.entity.Schedule;
import com.busmate.routeschedule.scheduling.entity.ScheduleStop;
import com.busmate.routeschedule.scheduling.repository.ScheduleRepository;
import com.busmate.routeschedule.scheduling.repository.ScheduleStopRepository;
import com.busmate.routeschedule.shared.dto.LocationDto;
import com.busmate.routeschedule.shared.exception.ConflictException;
import com.busmate.routeschedule.shared.exception.ResourceNotFoundException;
import com.busmate.routeschedule.shared.util.MapperUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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
    private final StopMapper stopMapper;

    @Override
    @Transactional
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

        Stop stop = stopMapper.toEntity(request);
        stop.setCreatedBy(userId);
        stop.setUpdatedBy(userId);
        Stop savedStop = stopRepository.save(stop);
        return stopMapper.toResponse(savedStop);
    }

    @Override
    @Transactional
    public StopBatchCreateResponse createStopsBatch(StopBatchCreateRequest request, String userId) {
        List<StopBatchCreateResponse.StopBatchResultItem> results = new ArrayList<>();
        int successCount = 0;
        int failedCount = 0;

        for (StopRequest stopRequest : request.getStops()) {
            String stopName = stopRequest.getName();
            try {
                // Check for duplicates across all language variants
                String cityToCheck = stopRequest.getLocation() != null ?
                    (stopRequest.getLocation().getCity() != null ? stopRequest.getLocation().getCity() :
                     stopRequest.getLocation().getCitySinhala() != null ? stopRequest.getLocation().getCitySinhala() :
                     stopRequest.getLocation().getCityTamil()) : null;

                if (stopRepository.existsByAnyNameVariantAndAnyCity(
                        stopRequest.getName(),
                        stopRequest.getNameSinhala(),
                        stopRequest.getNameTamil(),
                        cityToCheck)) {
                    // Stop already exists - return the existing stop as a success (idempotent)
                    Optional<Stop> existingStop = stopRepository.findByAnyNameVariantAndAnyCity(
                            stopRequest.getName(),
                            stopRequest.getNameSinhala(),
                            stopRequest.getNameTamil(),
                            cityToCheck);
                    if (existingStop.isPresent()) {
                        StopResponse existingResponse = mapperUtils.map(existingStop.get(), StopResponse.class);
                        results.add(StopBatchCreateResponse.StopBatchResultItem.success(stopName, existingResponse));
                        successCount++;
                    } else {
                        results.add(StopBatchCreateResponse.StopBatchResultItem.failure(
                            stopName, "Stop exists but could not be retrieved"));
                        failedCount++;
                    }
                    continue;
                }

                Stop stop = mapperUtils.map(stopRequest, Stop.class);
                stop.setCreatedBy(userId);
                stop.setUpdatedBy(userId);
                Stop savedStop = stopRepository.save(stop);
                StopResponse response = mapperUtils.map(savedStop, StopResponse.class);

                results.add(StopBatchCreateResponse.StopBatchResultItem.success(stopName, response));
                successCount++;
            } catch (Exception e) {
                log.error("Failed to create stop '{}': {}", stopName, e.getMessage());
                results.add(StopBatchCreateResponse.StopBatchResultItem.failure(
                    stopName, e.getMessage()));
                failedCount++;
            }
        }

        return StopBatchCreateResponse.builder()
                .totalRequested(request.getStops().size())
                .successCount(successCount)
                .failedCount(failedCount)
                .results(results)
                .build();
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
    @Transactional(readOnly = true)
    public Page<StopResponse> getAllStopsFiltered(String searchText, String state, String city, Boolean isAccessible, Pageable pageable) {
        // If no filters are provided, delegate to the simpler pageable query
        boolean hasFilters = (state != null && !state.isBlank())
                || (city != null && !city.isBlank())
                || (isAccessible != null);
        String effectiveSearch = (searchText != null && !searchText.isBlank()) ? searchText.trim() : null;

        if (!hasFilters && effectiveSearch == null) {
            return stopRepository.findAll(pageable)
                    .map(stop -> mapperUtils.map(stop, StopResponse.class));
        }

        return stopRepository.findAllWithFilters(
                effectiveSearch,
                (state != null && !state.isBlank()) ? state.trim() : null,
                (city != null && !city.isBlank()) ? city.trim() : null,
                isAccessible,
                pageable)
                .map(stop -> mapperUtils.map(stop, StopResponse.class));
    }

    @Override
    @Transactional
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

        stopMapper.updateEntityFromRequest(request, stop);
        stop.setUpdatedBy(userId);
        Stop updatedStop = stopRepository.save(stop);
        return stopMapper.toResponse(updatedStop);
    }

    @Override
    @Transactional
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
}
