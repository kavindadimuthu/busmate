package com.busmate.routeschedule.service.impl;

import com.busmate.routeschedule.dto.response.RouteResponse;
import com.busmate.routeschedule.dto.response.RouteFilterOptionsResponse;
import com.busmate.routeschedule.dto.response.statistic.RouteStatisticsResponse;
import com.busmate.routeschedule.dto.response.importing.RouteImportResponse;
import com.busmate.routeschedule.entity.Route;
import com.busmate.routeschedule.entity.Stop;
import com.busmate.routeschedule.entity.RouteGroup;
import com.busmate.routeschedule.enums.DirectionEnum;
import com.busmate.routeschedule.exception.ResourceNotFoundException;
import com.busmate.routeschedule.repository.RouteRepository;
import com.busmate.routeschedule.repository.RouteGroupRepository;
import com.busmate.routeschedule.repository.StopRepository;
import com.busmate.routeschedule.service.RouteService;
import com.busmate.routeschedule.util.MapperUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RouteServiceImpl implements RouteService {
    private final RouteRepository routeRepository;
    private final RouteGroupRepository routeGroupRepository;
    private final StopRepository stopRepository;
    private final MapperUtils mapperUtils;

    @Override
    public RouteResponse getRouteById(UUID id) {
        Route route = routeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + id));
        return mapToResponse(route);
    }

    @Override
    public List<RouteResponse> getAllRoutes() {
        return routeRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<RouteResponse> getAllRoutes(Pageable pageable) {
        Page<Route> routes = routeRepository.findAll(pageable);
        return routes.map(this::mapToResponse);
    }

    @Override
    public Page<RouteResponse> getAllRoutesWithSearch(String searchText, Pageable pageable) {
        Page<Route> routes = routeRepository.findAllWithSearch(searchText, pageable);
        return routes.map(this::mapToResponse);
    }

    @Override
    public Page<RouteResponse> getAllRoutesWithFilters(
            UUID routeGroupId,
            DirectionEnum direction,
            Double minDistance,
            Double maxDistance,
            Integer minDuration,
            Integer maxDuration,
            Pageable pageable) {
        Page<Route> routes = routeRepository.findAllWithFilters(
                routeGroupId, direction, minDistance, maxDistance, minDuration, maxDuration, pageable);
        return routes.map(this::mapToResponse);
    }

    @Override
    public Page<RouteResponse> getAllRoutesWithSearchAndFilters(
            String searchText,
            UUID routeGroupId,
            DirectionEnum direction,
            Double minDistance,
            Double maxDistance,
            Integer minDuration,
            Integer maxDuration,
            Pageable pageable) {
        Page<Route> routes = routeRepository.findAllWithSearchAndFilters(
                searchText, routeGroupId, direction, minDistance, maxDistance, minDuration, maxDuration, pageable);
        return routes.map(this::mapToResponse);
    }

    private List<DirectionEnum> getDistinctDirections() {
        return routeRepository.findDistinctDirections();
    }

    private List<Map<String, Object>> getDistinctRouteGroups() {
        List<Object[]> results = routeRepository.findDistinctRouteGroups();
        return results.stream().map(result -> {
            Map<String, Object> routeGroup = new HashMap<>();
            routeGroup.put("id", result[0]);
            routeGroup.put("name", result[1]);
            return routeGroup;
        }).collect(Collectors.toList());
    }

    private Map<String, Object> getDistanceRange() {
        List<Object[]> results = routeRepository.findDistanceRange();
        Map<String, Object> range = new HashMap<>();
        if (!results.isEmpty() && results.get(0) != null) {
            Object[] result = results.get(0);
            range.put("min", result[0]);
            range.put("max", result[1]);
        } else {
            range.put("min", 0.0);
            range.put("max", 0.0);
        }
        return range;
    }

    private Map<String, Object> getDurationRange() {
        List<Object[]> results = routeRepository.findDurationRange();
        Map<String, Object> range = new HashMap<>();
        if (!results.isEmpty() && results.get(0) != null) {
            Object[] result = results.get(0);
            range.put("min", result[0]);
            range.put("max", result[1]);
        } else {
            range.put("min", 0);
            range.put("max", 0);
        }
        return range;
    }

    @Override
    public RouteFilterOptionsResponse getFilterOptions() {
        RouteFilterOptionsResponse response = new RouteFilterOptionsResponse();
        
        // Get directions
        response.setDirections(getDistinctDirections());
        
        // Get route groups
        List<Map<String, Object>> routeGroups = getDistinctRouteGroups();
        response.setRouteGroups(routeGroups);
        
        // Get distance range
        List<Object[]> distanceResults = routeRepository.findDistanceRange();
        RouteFilterOptionsResponse.RangeFilter distanceRange = new RouteFilterOptionsResponse.RangeFilter();
        if (!distanceResults.isEmpty() && distanceResults.get(0) != null) {
            Object[] result = distanceResults.get(0);
            distanceRange.setMin((Double) result[0]);
            distanceRange.setMax((Double) result[1]);
            
            // Calculate average and count for additional metadata
            List<Object[]> distanceStats = routeRepository.getDistanceStatistics();
            if (!distanceStats.isEmpty() && distanceStats.get(0) != null) {
                Object[] stats = distanceStats.get(0);
                distanceRange.setAverage((Double) stats[0]);
                distanceRange.setCount(routeRepository.count()); // Total routes count
            }
        } else {
            distanceRange.setMin(0.0);
            distanceRange.setMax(0.0);
            distanceRange.setAverage(0.0);
            distanceRange.setCount(0L);
        }
        response.setDistanceRange(distanceRange);
        
        // Get duration range
        List<Object[]> durationResults = routeRepository.findDurationRange();
        RouteFilterOptionsResponse.RangeFilter durationRange = new RouteFilterOptionsResponse.RangeFilter();
        if (!durationResults.isEmpty() && durationResults.get(0) != null) {
            Object[] result = durationResults.get(0);
            durationRange.setMin(((Number) result[0]).doubleValue());
            durationRange.setMax(((Number) result[1]).doubleValue());
            
            // Calculate average and count for additional metadata
            List<Object[]> durationStats = routeRepository.getDurationStatistics();
            if (!durationStats.isEmpty() && durationStats.get(0) != null) {
                Object[] stats = durationStats.get(0);
                durationRange.setAverage((Double) stats[0]);
                durationRange.setCount(routeRepository.count()); // Total routes count
            }
        } else {
            durationRange.setMin(0.0);
            durationRange.setMax(0.0);
            durationRange.setAverage(0.0);
            durationRange.setCount(0L);
        }
        response.setDurationRange(durationRange);
        
        // Set metadata
        RouteFilterOptionsResponse.FilterMetadata metadata = new RouteFilterOptionsResponse.FilterMetadata();
        metadata.setTotalRoutes(Math.toIntExact(routeRepository.count()));
        metadata.setTotalRouteGroups(routeGroups.size());
        metadata.setTotalDirections(response.getDirections().size());
        metadata.setHasDistanceData(distanceRange.getCount() > 0);
        metadata.setHasDurationData(durationRange.getCount() > 0);
        metadata.setDataSource("routes");
        response.setMetadata(metadata);
        
        return response;
    }

    @Override
    public List<RouteResponse> getRoutesByRouteGroupId(UUID routeGroupId) {
        List<Route> routes = routeRepository.findByRouteGroup_Id(routeGroupId);
        return routes.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private RouteResponse mapToResponse(Route route) {
        RouteResponse response = mapperUtils.map(route, RouteResponse.class);
        
        if (route.getRouteGroup() != null) {
            response.setRouteGroupId(route.getRouteGroup().getId());
            response.setRouteGroupName(route.getRouteGroup().getName());
        }

        Stop startStop = stopRepository.findById(route.getStartStopId()).orElse(null);
        if (startStop != null) {
            response.setStartStopName(startStop.getName());
            response.setStartStopLocation(mapperUtils.map(startStop.getLocation(), com.busmate.routeschedule.dto.common.LocationDto.class));
        }

        Stop endStop = stopRepository.findById(route.getEndStopId()).orElse(null);
        if (endStop != null) {
            response.setEndStopName(endStop.getName());
            response.setEndStopLocation(mapperUtils.map(endStop.getLocation(), com.busmate.routeschedule.dto.common.LocationDto.class));
        }

        if (route.getRouteStops() != null) {
            List<RouteResponse.RouteStopResponse> routeStopResponses = route.getRouteStops().stream().map(rs -> {
                RouteResponse.RouteStopResponse rsResponse = new RouteResponse.RouteStopResponse();
                rsResponse.setStopId(rs.getStop().getId());
                rsResponse.setStopName(rs.getStop().getName());
                rsResponse.setLocation(mapperUtils.map(rs.getStop().getLocation(), com.busmate.routeschedule.dto.common.LocationDto.class));
                rsResponse.setStopOrder(rs.getStopOrder());
                rsResponse.setDistanceFromStartKm(rs.getDistanceFromStartKm());
                return rsResponse;
            }).collect(Collectors.toList());
            response.setRouteStops(routeStopResponses);
        }

        return response;
    }

    @Override
    public RouteStatisticsResponse getStatistics() {
        RouteStatisticsResponse stats = new RouteStatisticsResponse();
        
        // Basic counts
        stats.setTotalRoutes(routeRepository.count());
        stats.setOutboundRoutes(routeRepository.countByDirection(DirectionEnum.OUTBOUND));
        stats.setInboundRoutes(routeRepository.countByDirection(DirectionEnum.INBOUND));
        stats.setRoutesWithStops(routeRepository.countRoutesWithStops());
        stats.setRoutesWithoutStops(routeRepository.countRoutesWithoutStops());
        stats.setTotalRouteGroups(routeRepository.countDistinctRouteGroups());
        
        // Routes by route group
        Map<String, Long> routesByGroup = new LinkedHashMap<>();
        routeRepository.countRoutesByRouteGroup().forEach(obj -> 
            routesByGroup.put((String) obj[0], (Long) obj[1]));
        stats.setRoutesByRouteGroup(routesByGroup);
        
        // Routes by direction
        Map<String, Long> routesByDirection = new LinkedHashMap<>();
        routeRepository.countRoutesByDirection().forEach(obj -> 
            routesByDirection.put(obj[0] != null ? obj[0].toString() : "UNKNOWN", (Long) obj[1]));
        stats.setRoutesByDirection(routesByDirection);
        
        // Distance statistics
        List<Object[]> distanceStats = routeRepository.getDistanceStatistics();
        if (!distanceStats.isEmpty() && distanceStats.get(0)[0] != null) {
            stats.setAverageDistanceKm(((Number) distanceStats.get(0)[0]).doubleValue());
            stats.setTotalDistanceKm(((Number) distanceStats.get(0)[1]).doubleValue());
        }
        
        List<Object[]> distanceRange = routeRepository.findDistanceRange();
        if (!distanceRange.isEmpty() && distanceRange.get(0)[0] != null) {
            stats.setMinDistanceKm(((Number) distanceRange.get(0)[0]).doubleValue());
            stats.setMaxDistanceKm(((Number) distanceRange.get(0)[1]).doubleValue());
        }
        
        // Duration statistics
        List<Object[]> durationStats = routeRepository.getDurationStatistics();
        if (!durationStats.isEmpty() && durationStats.get(0)[0] != null) {
            stats.setAverageDurationMinutes(((Number) durationStats.get(0)[0]).doubleValue());
            stats.setTotalDurationMinutes(((Number) durationStats.get(0)[1]).doubleValue());
        }
        
        List<Object[]> durationRange = routeRepository.findDurationRange();
        if (!durationRange.isEmpty() && durationRange.get(0)[0] != null) {
            stats.setMinDurationMinutes(((Number) durationRange.get(0)[0]).doubleValue());
            stats.setMaxDurationMinutes(((Number) durationRange.get(0)[1]).doubleValue());
        }
        
        // Route name statistics
        List<String> longestRoutes = routeRepository.findLongestRouteNames();
        stats.setLongestRoute(!longestRoutes.isEmpty() ? longestRoutes.get(0) : null);
        
        List<String> shortestRoutes = routeRepository.findShortestRouteNames();
        stats.setShortestRoute(!shortestRoutes.isEmpty() ? shortestRoutes.get(0) : null);
        
        List<String> longestDurationRoutes = routeRepository.findLongestDurationRouteNames();
        stats.setLongestDurationRoute(!longestDurationRoutes.isEmpty() ? longestDurationRoutes.get(0) : null);
        
        List<String> shortestDurationRoutes = routeRepository.findShortestDurationRouteNames();
        stats.setShortestDurationRoute(!shortestDurationRoutes.isEmpty() ? shortestDurationRoutes.get(0) : null);
        
        // Average routes per group
        if (stats.getTotalRouteGroups() > 0) {
            stats.setAverageRoutesPerGroup(stats.getTotalRoutes().doubleValue() / stats.getTotalRouteGroups().doubleValue());
        }
        
        return stats;
    }

    @Override
    public RouteImportResponse importRoutes(MultipartFile file, String userId) {
        RouteImportResponse response = new RouteImportResponse();
        List<RouteImportResponse.ImportError> errors = new ArrayList<>();
        
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
                    // Expected CSV format: name,description,routeGroupName,startStopName,endStopName,distanceKm,estimatedDurationMinutes,direction
                    if (columns.length < 8) {
                        throw new IllegalArgumentException("Invalid CSV format. Expected 8 columns.");
                    }
                    
                    String name = columns[0].trim();
                    String description = columns[1].trim();
                    String routeGroupName = columns[2].trim();
                    String startStopName = columns[3].trim();
                    String endStopName = columns[4].trim();
                    String distanceKmStr = columns[5].trim();
                    String durationStr = columns[6].trim();
                    String directionStr = columns[7].trim();
                    
                    // Validate required fields
                    if (name.isEmpty()) {
                        throw new IllegalArgumentException("Route name is required");
                    }
                    
                    // Find route group
                    Optional<RouteGroup> routeGroupOpt = routeGroupRepository.findByNameIgnoreCase(routeGroupName);
                    if (routeGroupOpt.isEmpty()) {
                        throw new IllegalArgumentException("Route group not found: " + routeGroupName);
                    }
                    
                    // Check if route already exists in this route group
                    if (routeRepository.existsByNameAndRouteGroup_Id(name, routeGroupOpt.get().getId())) {
                        throw new IllegalArgumentException("Route already exists in this route group: " + name);
                    }
                    
                    // Find start stop
                    List<Stop> startStops = stopRepository.findAll().stream()
                            .filter(s -> s.getName().equalsIgnoreCase(startStopName))
                            .collect(Collectors.toList());
                    if (startStops.isEmpty()) {
                        throw new IllegalArgumentException("Start stop not found: " + startStopName);
                    }
                    
                    // Find end stop
                    List<Stop> endStops = stopRepository.findAll().stream()
                            .filter(s -> s.getName().equalsIgnoreCase(endStopName))
                            .collect(Collectors.toList());
                    if (endStops.isEmpty()) {
                        throw new IllegalArgumentException("End stop not found: " + endStopName);
                    }
                    
                    // Parse numeric values
                    Double distanceKm = null;
                    if (!distanceKmStr.isEmpty()) {
                        distanceKm = Double.parseDouble(distanceKmStr);
                    }
                    
                    Integer estimatedDuration = null;
                    if (!durationStr.isEmpty()) {
                        estimatedDuration = Integer.parseInt(durationStr);
                    }
                    
                    // Parse direction
                    DirectionEnum direction = DirectionEnum.valueOf(directionStr.toUpperCase());
                    
                    // Create and save route
                    Route route = new Route();
                    route.setName(name);
                    route.setDescription(description.isEmpty() ? null : description);
                    route.setRouteGroup(routeGroupOpt.get());
                    route.setStartStopId(startStops.get(0).getId());
                    route.setEndStopId(endStops.get(0).getId());
                    route.setDistanceKm(distanceKm);
                    route.setEstimatedDurationMinutes(estimatedDuration);
                    route.setDirection(direction);
                    route.setCreatedAt(LocalDateTime.now());
                    route.setUpdatedAt(LocalDateTime.now());
                    route.setCreatedBy(userId);
                    route.setUpdatedBy(userId);
                    
                    routeRepository.save(route);
                    successfulImports++;
                    
                } catch (Exception e) {
                    failedImports++;
                    RouteImportResponse.ImportError error = new RouteImportResponse.ImportError();
                    error.setRowNumber(rowNumber);
                    error.setErrorMessage(e.getMessage());
                    error.setValue(line);
                    errors.add(error);
                    
                    log.error("Failed to import route at row {}: {}", rowNumber, e.getMessage());
                }
            }
            
        } catch (Exception e) {
            log.error("Failed to process import file", e);
            failedImports = totalRecords;
            
            RouteImportResponse.ImportError error = new RouteImportResponse.ImportError();
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
}