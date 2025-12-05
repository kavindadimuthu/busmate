package com.busmate.routeschedule.service.impl;

import com.busmate.routeschedule.dto.request.RouteUnifiedImportRequest;
import com.busmate.routeschedule.dto.response.RouteResponse;
import com.busmate.routeschedule.dto.response.RouteFilterOptionsResponse;
import com.busmate.routeschedule.dto.response.statistic.RouteStatisticsResponse;
import com.busmate.routeschedule.dto.response.importing.RouteUnifiedImportResponse;
import com.busmate.routeschedule.entity.Route;
import com.busmate.routeschedule.entity.RouteStop;
import com.busmate.routeschedule.entity.Stop;
import com.busmate.routeschedule.entity.RouteGroup;
import com.busmate.routeschedule.enums.DirectionEnum;
import com.busmate.routeschedule.enums.RoadTypeEnum;
import com.busmate.routeschedule.exception.ResourceNotFoundException;
import com.busmate.routeschedule.repository.RouteRepository;
import com.busmate.routeschedule.repository.RouteGroupRepository;
import com.busmate.routeschedule.repository.RouteStopRepository;
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
    private final RouteStopRepository routeStopRepository;
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
            com.busmate.routeschedule.enums.RoadTypeEnum roadType,
            Double minDistance,
            Double maxDistance,
            Integer minDuration,
            Integer maxDuration,
            Pageable pageable) {
        Page<Route> routes = routeRepository.findAllWithFilters(
                routeGroupId, direction, roadType, minDistance, maxDistance, minDuration, maxDuration, pageable);
        return routes.map(this::mapToResponse);
    }

    @Override
    public Page<RouteResponse> getAllRoutesWithSearchAndFilters(
            String searchText,
            UUID routeGroupId,
            DirectionEnum direction,
            com.busmate.routeschedule.enums.RoadTypeEnum roadType,
            Double minDistance,
            Double maxDistance,
            Integer minDuration,
            Integer maxDuration,
            Pageable pageable) {
        Page<Route> routes = routeRepository.findAllWithSearchAndFilters(
                searchText, routeGroupId, direction, roadType, minDistance, maxDistance, minDuration, maxDuration, pageable);
        return routes.map(this::mapToResponse);
    }

    private List<DirectionEnum> getDistinctDirections() {
        return routeRepository.findDistinctDirections();
    }

    private List<com.busmate.routeschedule.enums.RoadTypeEnum> getDistinctRoadTypes() {
        return routeRepository.findDistinctRoadTypes();
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
        
        // Get road types
        response.setRoadTypes(getDistinctRoadTypes());
        
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
    public RouteUnifiedImportResponse importRoutesUnified(MultipartFile file, RouteUnifiedImportRequest importRequest, String userId) {
        RouteUnifiedImportResponse response = new RouteUnifiedImportResponse();
        List<RouteUnifiedImportResponse.ImportError> errors = new ArrayList<>();
        List<RouteUnifiedImportResponse.ImportWarning> warnings = new ArrayList<>();
        
        // Summary tracking
        RouteUnifiedImportResponse.ImportSummary summary = new RouteUnifiedImportResponse.ImportSummary();
        summary.setCreatedRouteGroups(new ArrayList<>());
        summary.setCreatedRoutes(new ArrayList<>());
        summary.setProcessedAt(LocalDateTime.now());
        summary.setProcessedBy(userId);
        summary.setRouteGroupsCreated(0);
        summary.setRouteGroupsReused(0);
        summary.setRoutesCreated(0);
        summary.setRouteStopsCreated(0);
        
        int totalRecords = 0;
        int successfulImports = 0;
        int failedImports = 0;
        int skippedRecords = 0;
        
        // Track route groups and routes to avoid duplicates within the same import
        Map<String, RouteGroup> routeGroupCache = new HashMap<>();
        Map<String, Route> routeCache = new HashMap<>();
        
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
                
                try {
                    String[] columns = parseCSVLine(line);
                    
                    // Expected CSV format based on your sample:
                    // route_group_name,route_group_name_sinhala,route_group_name_tamil,route_group_description,
                    // route_name,route_name_sinhala,route_name_tamil,route_number,route_description,
                    // road_type,route_through,route_through_sinhala,route_through_tamil,direction,
                    // distance_km,estimated_duration_minutes,start_stop_id,end_stop_id,
                    // stop_order,stop_id,stop_name_english,stop_name_sinhala,distance_from_start_km
                    
                    if (columns.length < 23) {
                        throw new IllegalArgumentException("Invalid CSV format. Expected 23 columns but found " + columns.length);
                    }
                    
                    // Parse route group data (columns 0-3)
                    String routeGroupName = getValueOrNull(columns[0]);
                    String routeGroupNameSinhala = getValueOrNull(columns[1]);
                    String routeGroupNameTamil = getValueOrNull(columns[2]);
                    String routeGroupDescription = getValueOrNull(columns[3]);
                    
                    // Parse route data (columns 4-17)
                    String routeName = getValueOrNull(columns[4]);
                    String routeNameSinhala = getValueOrNull(columns[5]);
                    String routeNameTamil = getValueOrNull(columns[6]);
                    String routeNumber = getValueOrNull(columns[7]);
                    String routeDescription = getValueOrNull(columns[8]);
                    String roadTypeStr = getValueOrNull(columns[9]);
                    String routeThrough = getValueOrNull(columns[10]);
                    String routeThroughSinhala = getValueOrNull(columns[11]);
                    String routeThroughTamil = getValueOrNull(columns[12]);
                    String directionStr = getValueOrNull(columns[13]);
                    String distanceKmStr = getValueOrNull(columns[14]);
                    String estimatedDurationStr = getValueOrNull(columns[15]);
                    String startStopIdStr = getValueOrNull(columns[16]);
                    String endStopIdStr = getValueOrNull(columns[17]);
                    
                    // Parse route stop data (columns 18-22)
                    String stopOrderStr = getValueOrNull(columns[18]);
                    String stopIdStr = getValueOrNull(columns[19]);
                    String stopNameEnglish = getValueOrNull(columns[20]);
                    String stopNameSinhala = getValueOrNull(columns[21]);
                    String distanceFromStartStr = getValueOrNull(columns[22]);
                    
                    // Validate required fields
                    if (routeGroupName == null || routeGroupName.trim().isEmpty()) {
                        throw new IllegalArgumentException("Route group name is required");
                    }
                    if (routeName == null || routeName.trim().isEmpty()) {
                        throw new IllegalArgumentException("Route name is required");
                    }
                    if (directionStr == null || directionStr.trim().isEmpty()) {
                        throw new IllegalArgumentException("Direction is required");
                    }
                    
                    // Process route group
                    RouteGroup routeGroup = processRouteGroup(routeGroupName, routeGroupNameSinhala, 
                                                            routeGroupNameTamil, routeGroupDescription, 
                                                            importRequest, routeGroupCache, summary, 
                                                            rowNumber, warnings, userId);
                    
                    if (routeGroup == null) {
                        skippedRecords++;
                        continue;
                    }
                    
                    // Process route
                    String routeKey = routeGroup.getId() + ":" + routeName;
                    Route route = routeCache.get(routeKey);
                    
                    if (route == null) {
                        route = processRoute(routeName, routeNameSinhala, routeNameTamil, routeNumber,
                                           routeDescription, roadTypeStr, routeThrough, routeThroughSinhala,
                                           routeThroughTamil, directionStr, distanceKmStr, estimatedDurationStr,
                                           startStopIdStr, endStopIdStr, routeGroup, importRequest, 
                                           summary, rowNumber, warnings, userId);
                        
                        if (route != null) {
                            routeCache.put(routeKey, route);
                        }
                    }
                    
                    if (route == null) {
                        skippedRecords++;
                        continue;
                    }
                    
                    // Process route stop
                    boolean routeStopProcessed = processRouteStop(route, stopOrderStr, stopIdStr,
                                                                stopNameEnglish, stopNameSinhala,
                                                                distanceFromStartStr, importRequest,
                                                                summary, rowNumber, warnings);
                    
                    if (routeStopProcessed) {
                        successfulImports++;
                    } else {
                        skippedRecords++;
                    }
                    
                } catch (Exception e) {
                    failedImports++;
                    RouteUnifiedImportResponse.ImportError error = new RouteUnifiedImportResponse.ImportError();
                    error.setRowNumber(rowNumber);
                    error.setErrorMessage(e.getMessage());
                    error.setRawCsvRow(line);
                    errors.add(error);
                    
                    log.error("Failed to import route data at row {}: {}", rowNumber, e.getMessage());
                    
                    if (!importRequest.getContinueOnError()) {
                        break;
                    }
                }
            }
            
        } catch (Exception e) {
            log.error("Failed to process import file", e);
            RouteUnifiedImportResponse.ImportError error = new RouteUnifiedImportResponse.ImportError();
            error.setErrorMessage("Failed to process import file: " + e.getMessage());
            errors.add(error);
        }
        
        response.setTotalRecords(totalRecords);
        response.setSuccessfulImports(successfulImports);
        response.setFailedImports(failedImports);
        response.setSkippedRecords(skippedRecords);
        response.setErrors(errors);
        response.setWarnings(warnings);
        response.setSummary(summary);
        response.setMessage(String.format("Import completed. %d successful, %d failed, %d skipped out of %d total records. " +
                                         "Created %d route groups, %d routes, %d route stops.",
                                         successfulImports, failedImports, skippedRecords, totalRecords,
                                         summary.getRouteGroupsCreated(), summary.getRoutesCreated(),
                                         summary.getRouteStopsCreated()));
        
        return response;
    }
    
    // Helper methods for unified import
    private String[] parseCSVLine(String line) {
        List<String> result = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder field = new StringBuilder();
        
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                result.add(field.toString());
                field = new StringBuilder();
            } else {
                field.append(c);
            }
        }
        result.add(field.toString());
        
        return result.toArray(new String[0]);
    }
    
    private String getValueOrNull(String value) {
        if (value == null || value.trim().isEmpty() || "null".equalsIgnoreCase(value.trim())) {
            return null;
        }
        return value.trim();
    }
    
    private RouteGroup processRouteGroup(String name, String nameSinhala, String nameTamil, 
                                       String description, RouteUnifiedImportRequest importRequest,
                                       Map<String, RouteGroup> routeGroupCache,
                                       RouteUnifiedImportResponse.ImportSummary summary,
                                       int rowNumber, List<RouteUnifiedImportResponse.ImportWarning> warnings,
                                       String userId) {
        
        // Check cache first
        RouteGroup cached = routeGroupCache.get(name);
        if (cached != null) {
            return cached;
        }
        
        // Check if route group exists in database
        Optional<RouteGroup> existing = routeGroupRepository.findByNameIgnoreCase(name);
        if (existing.isPresent()) {
            RouteGroup routeGroup = existing.get();
            
            switch (importRequest.getRouteGroupDuplicateStrategy()) {
                case SKIP:
                    RouteUnifiedImportResponse.ImportWarning skipWarning = new RouteUnifiedImportResponse.ImportWarning();
                    skipWarning.setRowNumber(rowNumber);
                    skipWarning.setField("route_group_name");
                    skipWarning.setWarningMessage("Route group already exists, skipping");
                    skipWarning.setAction("SKIPPED");
                    warnings.add(skipWarning);
                    return null;
                    
                case REUSE:
                    routeGroupCache.put(name, routeGroup);
                    summary.setRouteGroupsReused(summary.getRouteGroupsReused() + 1);
                    
                    RouteUnifiedImportResponse.ImportWarning reuseWarning = new RouteUnifiedImportResponse.ImportWarning();
                    reuseWarning.setRowNumber(rowNumber);
                    reuseWarning.setField("route_group_name");
                    reuseWarning.setWarningMessage("Reusing existing route group: " + name);
                    reuseWarning.setAction("REUSED");
                    warnings.add(reuseWarning);
                    return routeGroup;
                    
                case CREATE_WITH_SUFFIX:
                    String newName = findUniqueRouteGroupName(name);
                    RouteGroup newRouteGroup = createRouteGroup(newName, nameSinhala, nameTamil, description, userId);
                    routeGroupCache.put(name, newRouteGroup);
                    
                    RouteUnifiedImportResponse.ImportSummary.CreatedEntity created = new RouteUnifiedImportResponse.ImportSummary.CreatedEntity();
                    created.setId(newRouteGroup.getId());
                    created.setName(newRouteGroup.getName());
                    created.setRowNumber(rowNumber);
                    summary.getCreatedRouteGroups().add(created);
                    summary.setRouteGroupsCreated(summary.getRouteGroupsCreated() + 1);
                    
                    RouteUnifiedImportResponse.ImportWarning suffixWarning = new RouteUnifiedImportResponse.ImportWarning();
                    suffixWarning.setRowNumber(rowNumber);
                    suffixWarning.setField("route_group_name");
                    suffixWarning.setWarningMessage("Created route group with suffix: " + newName);
                    suffixWarning.setAction("CREATED");
                    warnings.add(suffixWarning);
                    return newRouteGroup;
            }
        }
        
        // Create new route group
        RouteGroup newRouteGroup = createRouteGroup(name, nameSinhala, nameTamil, description, userId);
        routeGroupCache.put(name, newRouteGroup);
        
        RouteUnifiedImportResponse.ImportSummary.CreatedEntity created = new RouteUnifiedImportResponse.ImportSummary.CreatedEntity();
        created.setId(newRouteGroup.getId());
        created.setName(newRouteGroup.getName());
        created.setRowNumber(rowNumber);
        summary.getCreatedRouteGroups().add(created);
        summary.setRouteGroupsCreated(summary.getRouteGroupsCreated() + 1);
        
        return newRouteGroup;
    }
    
    private String findUniqueRouteGroupName(String baseName) {
        int counter = 1;
        String newName;
        do {
            newName = baseName + "_" + counter;
            counter++;
        } while (routeGroupRepository.existsByName(newName));
        return newName;
    }
    
    private RouteGroup createRouteGroup(String name, String nameSinhala, String nameTamil, 
                                      String description, String userId) {
        RouteGroup routeGroup = new RouteGroup();
        routeGroup.setName(name);
        routeGroup.setNameSinhala(nameSinhala);
        routeGroup.setNameTamil(nameTamil);
        routeGroup.setDescription(description);
        routeGroup.setCreatedAt(LocalDateTime.now());
        routeGroup.setUpdatedAt(LocalDateTime.now());
        routeGroup.setCreatedBy(userId);
        routeGroup.setUpdatedBy(userId);
        
        return routeGroupRepository.save(routeGroup);
    }
    
    private Route processRoute(String name, String nameSinhala, String nameTamil, String routeNumber,
                             String description, String roadTypeStr, String routeThrough,
                             String routeThroughSinhala, String routeThroughTamil, String directionStr,
                             String distanceKmStr, String estimatedDurationStr, String startStopIdStr,
                             String endStopIdStr, RouteGroup routeGroup, RouteUnifiedImportRequest importRequest,
                             RouteUnifiedImportResponse.ImportSummary summary, int rowNumber,
                             List<RouteUnifiedImportResponse.ImportWarning> warnings, String userId) {
        
        // Check if route already exists in this route group
        boolean routeExists = routeRepository.existsByNameAndRouteGroup_Id(name, routeGroup.getId());
        
        if (routeExists) {
            switch (importRequest.getRouteDuplicateStrategy()) {
                case SKIP:
                    RouteUnifiedImportResponse.ImportWarning skipWarning = new RouteUnifiedImportResponse.ImportWarning();
                    skipWarning.setRowNumber(rowNumber);
                    skipWarning.setField("route_name");
                    skipWarning.setWarningMessage("Route already exists in route group, skipping");
                    skipWarning.setAction("SKIPPED");
                    warnings.add(skipWarning);
                    return null;
                    
                case UPDATE:
                    // Find and update existing route
                    Optional<Route> existingRoute = routeRepository.findByNameAndRouteGroup_Id(name, routeGroup.getId());
                    if (existingRoute.isPresent()) {
                        Route route = existingRoute.get();
                        updateRouteFields(route, nameSinhala, nameTamil, routeNumber, description,
                                        roadTypeStr, routeThrough, routeThroughSinhala, routeThroughTamil,
                                        directionStr, distanceKmStr, estimatedDurationStr, startStopIdStr,
                                        endStopIdStr, importRequest, userId);
                        
                        RouteUnifiedImportResponse.ImportWarning updateWarning = new RouteUnifiedImportResponse.ImportWarning();
                        updateWarning.setRowNumber(rowNumber);
                        updateWarning.setField("route_name");
                        updateWarning.setWarningMessage("Updated existing route: " + name);
                        updateWarning.setAction("UPDATED");
                        warnings.add(updateWarning);
                        return route;
                    }
                    break;
                    
                case CREATE_WITH_SUFFIX:
                    String newName = findUniqueRouteName(name, routeGroup.getId());
                    Route newRoute = createRoute(newName, nameSinhala, nameTamil, routeNumber, description,
                                               roadTypeStr, routeThrough, routeThroughSinhala, routeThroughTamil,
                                               directionStr, distanceKmStr, estimatedDurationStr, startStopIdStr,
                                               endStopIdStr, routeGroup, importRequest, summary, rowNumber, userId);
                    
                    RouteUnifiedImportResponse.ImportWarning suffixWarning = new RouteUnifiedImportResponse.ImportWarning();
                    suffixWarning.setRowNumber(rowNumber);
                    suffixWarning.setField("route_name");
                    suffixWarning.setWarningMessage("Created route with suffix: " + newName);
                    suffixWarning.setAction("CREATED");
                    warnings.add(suffixWarning);
                    return newRoute;
            }
        }
        
        // Create new route
        return createRoute(name, nameSinhala, nameTamil, routeNumber, description, roadTypeStr,
                         routeThrough, routeThroughSinhala, routeThroughTamil, directionStr,
                         distanceKmStr, estimatedDurationStr, startStopIdStr, endStopIdStr,
                         routeGroup, importRequest, summary, rowNumber, userId);
    }
    
    private String findUniqueRouteName(String baseName, UUID routeGroupId) {
        int counter = 1;
        String newName;
        do {
            newName = baseName + "_" + counter;
            counter++;
        } while (routeRepository.existsByNameAndRouteGroup_Id(newName, routeGroupId));
        return newName;
    }
    
    private void updateRouteFields(Route route, String nameSinhala, String nameTamil, String routeNumber,
                                 String description, String roadTypeStr, String routeThrough,
                                 String routeThroughSinhala, String routeThroughTamil, String directionStr,
                                 String distanceKmStr, String estimatedDurationStr, String startStopIdStr,
                                 String endStopIdStr, RouteUnifiedImportRequest importRequest, String userId) {
        
        if (nameSinhala != null) route.setNameSinhala(nameSinhala);
        if (nameTamil != null) route.setNameTamil(nameTamil);
        if (routeNumber != null) route.setRouteNumber(routeNumber);
        if (description != null) route.setDescription(description);
        
        if (roadTypeStr != null && !roadTypeStr.isEmpty()) {
            try {
                route.setRoadType(RoadTypeEnum.valueOf(roadTypeStr.toUpperCase()));
            } catch (Exception e) {
                route.setRoadType(RoadTypeEnum.valueOf(importRequest.getDefaultRoadType()));
            }
        }
        
        if (routeThrough != null) route.setRouteThrough(routeThrough);
        if (routeThroughSinhala != null) route.setRouteThroughSinhala(routeThroughSinhala);
        if (routeThroughTamil != null) route.setRouteThroughTamil(routeThroughTamil);
        
        if (directionStr != null && !directionStr.isEmpty()) {
            route.setDirection(DirectionEnum.valueOf(directionStr.toUpperCase()));
        }
        
        if (distanceKmStr != null && !distanceKmStr.isEmpty()) {
            route.setDistanceKm(Double.parseDouble(distanceKmStr));
        }
        
        if (estimatedDurationStr != null && !estimatedDurationStr.isEmpty()) {
            route.setEstimatedDurationMinutes(Integer.parseInt(estimatedDurationStr));
        }
        
        if (startStopIdStr != null && !startStopIdStr.isEmpty() && importRequest.getValidateStopsExist()) {
            try {
                UUID startStopId = UUID.fromString(startStopIdStr);
                if (stopRepository.existsById(startStopId)) {
                    route.setStartStopId(startStopId);
                }
            } catch (Exception ignored) {}
        }
        
        if (endStopIdStr != null && !endStopIdStr.isEmpty() && importRequest.getValidateStopsExist()) {
            try {
                UUID endStopId = UUID.fromString(endStopIdStr);
                if (stopRepository.existsById(endStopId)) {
                    route.setEndStopId(endStopId);
                }
            } catch (Exception ignored) {}
        }
        
        route.setUpdatedAt(LocalDateTime.now());
        route.setUpdatedBy(userId);
        routeRepository.save(route);
    }
    
    private Route createRoute(String name, String nameSinhala, String nameTamil, String routeNumber,
                            String description, String roadTypeStr, String routeThrough,
                            String routeThroughSinhala, String routeThroughTamil, String directionStr,
                            String distanceKmStr, String estimatedDurationStr, String startStopIdStr,
                            String endStopIdStr, RouteGroup routeGroup, RouteUnifiedImportRequest importRequest,
                            RouteUnifiedImportResponse.ImportSummary summary, int rowNumber, String userId) {
        
        Route route = new Route();
        route.setName(name);
        route.setNameSinhala(nameSinhala);
        route.setNameTamil(nameTamil);
        route.setRouteNumber(routeNumber);
        route.setDescription(description);
        route.setRouteGroup(routeGroup);
        
        // Set road type
        if (roadTypeStr != null && !roadTypeStr.isEmpty()) {
            try {
                route.setRoadType(RoadTypeEnum.valueOf(roadTypeStr.toUpperCase()));
            } catch (Exception e) {
                route.setRoadType(RoadTypeEnum.valueOf(importRequest.getDefaultRoadType()));
            }
        } else {
            route.setRoadType(RoadTypeEnum.valueOf(importRequest.getDefaultRoadType()));
        }
        
        route.setRouteThrough(routeThrough);
        route.setRouteThroughSinhala(routeThroughSinhala);
        route.setRouteThroughTamil(routeThroughTamil);
        
        // Set direction
        if (directionStr != null && !directionStr.isEmpty()) {
            route.setDirection(DirectionEnum.valueOf(directionStr.toUpperCase()));
        }
        
        // Set distance
        if (distanceKmStr != null && !distanceKmStr.isEmpty()) {
            route.setDistanceKm(Double.parseDouble(distanceKmStr));
        }
        
        // Set duration
        if (estimatedDurationStr != null && !estimatedDurationStr.isEmpty()) {
            route.setEstimatedDurationMinutes(Integer.parseInt(estimatedDurationStr));
        }
        
        // Set start and end stops
        if (startStopIdStr != null && !startStopIdStr.isEmpty()) {
            try {
                UUID startStopId = UUID.fromString(startStopIdStr);
                if (!importRequest.getValidateStopsExist() || stopRepository.existsById(startStopId)) {
                    route.setStartStopId(startStopId);
                }
            } catch (Exception ignored) {}
        }
        
        if (endStopIdStr != null && !endStopIdStr.isEmpty()) {
            try {
                UUID endStopId = UUID.fromString(endStopIdStr);
                if (!importRequest.getValidateStopsExist() || stopRepository.existsById(endStopId)) {
                    route.setEndStopId(endStopId);
                }
            } catch (Exception ignored) {}
        }
        
        route.setCreatedAt(LocalDateTime.now());
        route.setUpdatedAt(LocalDateTime.now());
        route.setCreatedBy(userId);
        route.setUpdatedBy(userId);
        
        route = routeRepository.save(route);
        
        RouteUnifiedImportResponse.ImportSummary.CreatedEntity created = new RouteUnifiedImportResponse.ImportSummary.CreatedEntity();
        created.setId(route.getId());
        created.setName(route.getName());
        created.setRowNumber(rowNumber);
        summary.getCreatedRoutes().add(created);
        summary.setRoutesCreated(summary.getRoutesCreated() + 1);
        
        return route;
    }
    
    private boolean processRouteStop(Route route, String stopOrderStr, String stopIdStr,
                                   String stopNameEnglish, String stopNameSinhala,
                                   String distanceFromStartStr, RouteUnifiedImportRequest importRequest,
                                   RouteUnifiedImportResponse.ImportSummary summary, int rowNumber,
                                   List<RouteUnifiedImportResponse.ImportWarning> warnings) {
        
        if (stopOrderStr == null || stopOrderStr.isEmpty()) {
            return false; // Skip if no stop order
        }
        
        try {
            Integer stopOrder = Integer.parseInt(stopOrderStr);
            UUID stopId = null;
            
            // Try to find stop by ID first
            if (stopIdStr != null && !stopIdStr.isEmpty()) {
                try {
                    stopId = UUID.fromString(stopIdStr);
                    if (!stopRepository.existsById(stopId)) {
                        stopId = null;
                    }
                } catch (Exception ignored) {}
            }
            
            // If not found by ID, try to find by name
            if (stopId == null && stopNameEnglish != null && !stopNameEnglish.isEmpty()) {
                List<Stop> stops = stopRepository.findAll().stream()
                        .filter(s -> s.getName().equalsIgnoreCase(stopNameEnglish))
                        .collect(Collectors.toList());
                if (!stops.isEmpty()) {
                    stopId = stops.get(0).getId();
                }
            }
            
            if (stopId == null) {
                if (importRequest.getValidateStopsExist()) {
                    throw new IllegalArgumentException("Stop not found: " + (stopNameEnglish != null ? stopNameEnglish : stopIdStr));
                } else {
                    // Skip this route stop but don't fail the import
                    RouteUnifiedImportResponse.ImportWarning warning = new RouteUnifiedImportResponse.ImportWarning();
                    warning.setRowNumber(rowNumber);
                    warning.setField("stop_id");
                    warning.setWarningMessage("Stop not found, skipping route stop: " + (stopNameEnglish != null ? stopNameEnglish : stopIdStr));
                    warning.setAction("SKIPPED");
                    warnings.add(warning);
                    return false;
                }
            }
            
            // Check if route stop already exists
            Optional<RouteStop> existingRouteStop = routeStopRepository.findByRouteIdAndStopIdAndStopOrder(
                    route.getId(), stopId, stopOrder);
            
            if (existingRouteStop.isPresent()) {
                if (!importRequest.getAllowPartialRouteStops()) {
                    return false; // Skip duplicate route stop
                }
            }
            
            // Create route stop
            RouteStop routeStop = new RouteStop();
            routeStop.setRoute(route);
            
            // Load stop entity
            Optional<Stop> stopOpt = stopRepository.findById(stopId);
            if (stopOpt.isPresent()) {
                routeStop.setStop(stopOpt.get());
            } else {
                return false;
            }
            
            routeStop.setStopOrder(stopOrder);
            
            if (distanceFromStartStr != null && !distanceFromStartStr.isEmpty()) {
                try {
                    routeStop.setDistanceFromStartKm(Double.parseDouble(distanceFromStartStr));
                } catch (Exception ignored) {}
            }
            
            routeStopRepository.save(routeStop);
            summary.setRouteStopsCreated(summary.getRouteStopsCreated() + 1);
            
            return true;
            
        } catch (Exception e) {
            if (!importRequest.getAllowPartialRouteStops()) {
                throw e;
            }
            
            RouteUnifiedImportResponse.ImportWarning warning = new RouteUnifiedImportResponse.ImportWarning();
            warning.setRowNumber(rowNumber);
            warning.setField("route_stop");
            warning.setWarningMessage("Failed to create route stop: " + e.getMessage());
            warning.setAction("SKIPPED");
            warnings.add(warning);
            return false;
        }
    }
}