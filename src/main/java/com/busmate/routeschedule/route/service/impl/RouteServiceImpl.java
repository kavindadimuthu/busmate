package com.busmate.routeschedule.route.service.impl;

import com.busmate.routeschedule.route.dto.request.RouteUnifiedImportRequest;
import com.busmate.routeschedule.route.dto.request.RouteExportRequest;
import com.busmate.routeschedule.route.dto.response.RouteResponse;
import com.busmate.routeschedule.route.dto.response.RouteFilterOptionsResponse;
import com.busmate.routeschedule.route.dto.response.RouteStatisticsResponse;
import com.busmate.routeschedule.route.dto.response.RouteUnifiedImportResponse;
import com.busmate.routeschedule.route.dto.response.RouteExportResponse;
import com.busmate.routeschedule.route.entity.Route;
import com.busmate.routeschedule.route.entity.RouteStop;
import com.busmate.routeschedule.stop.entity.Stop;
import com.busmate.routeschedule.route.entity.RouteGroup;
import com.busmate.routeschedule.route.enums.DirectionEnum;
import com.busmate.routeschedule.route.enums.RoadTypeEnum;
import com.busmate.routeschedule.common.exception.ResourceNotFoundException;
import com.busmate.routeschedule.route.repository.RouteRepository;
import com.busmate.routeschedule.route.repository.RouteGroupRepository;
import com.busmate.routeschedule.route.repository.RouteStopRepository;
import com.busmate.routeschedule.stop.repository.StopRepository;
import com.busmate.routeschedule.route.service.RouteService;
import com.busmate.routeschedule.common.util.MapperUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import com.busmate.routeschedule.common.dto.LocationDto;
import com.busmate.routeschedule.stop.dto.response.StopResponse;

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
            com.busmate.routeschedule.route.enums.RoadTypeEnum roadType,
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
            com.busmate.routeschedule.route.enums.RoadTypeEnum roadType,
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

    private List<com.busmate.routeschedule.route.enums.RoadTypeEnum> getDistinctRoadTypes() {
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
            response.setStartStopLocation(mapperUtils.map(startStop.getLocation(), com.busmate.routeschedule.common.dto.LocationDto.class));
        }

        Stop endStop = stopRepository.findById(route.getEndStopId()).orElse(null);
        if (endStop != null) {
            response.setEndStopName(endStop.getName());
            response.setEndStopLocation(mapperUtils.map(endStop.getLocation(), com.busmate.routeschedule.common.dto.LocationDto.class));
        }

        if (route.getRouteStops() != null) {
            List<RouteResponse.RouteStopResponse> routeStopResponses = route.getRouteStops().stream()
                .sorted(Comparator.comparingInt(RouteStop::getStopOrder))
                .map(rs -> {
                    RouteResponse.RouteStopResponse rsResponse = new RouteResponse.RouteStopResponse();
                    rsResponse.setId(rs.getId());  // Set route stop ID for updates
                    rsResponse.setStopId(rs.getStop().getId());
                    rsResponse.setStopName(rs.getStop().getName());
                    rsResponse.setLocation(mapperUtils.map(rs.getStop().getLocation(), com.busmate.routeschedule.common.dto.LocationDto.class));
                    rsResponse.setStopOrder(rs.getStopOrder());
                    rsResponse.setDistanceFromStartKm(rs.getDistanceFromStartKm());
                    rsResponse.setDistanceFromStartKmUnverified(rs.getDistanceFromStartKmUnverified());
                    rsResponse.setDistanceFromStartKmCalculated(rs.getDistanceFromStartKmCalculated());
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
        
        if (startStopIdStr != null && !startStopIdStr.isEmpty()) {
            try {
                UUID startStopId = UUID.fromString(startStopIdStr);
                if (importRequest.getValidateStopsExist()) {
                    if (stopRepository.existsById(startStopId)) {
                        route.setStartStopId(startStopId);
                    } else {
                        throw new IllegalArgumentException("Start stop with ID '" + startStopIdStr + "' does not exist");
                    }
                } else {
                    // Set the stop ID without validation
                    route.setStartStopId(startStopId);
                }
            } catch (IllegalArgumentException e) {
                throw e; // Re-throw validation errors
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid start stop ID format: '" + startStopIdStr + "'", e);
            }
        }

        if (endStopIdStr != null && !endStopIdStr.isEmpty()) {
            try {
                UUID endStopId = UUID.fromString(endStopIdStr);
                if (importRequest.getValidateStopsExist()) {
                    if (stopRepository.existsById(endStopId)) {
                        route.setEndStopId(endStopId);
                    } else {
                        throw new IllegalArgumentException("End stop with ID '" + endStopIdStr + "' does not exist");
                    }
                } else {
                    // Set the stop ID without validation
                    route.setEndStopId(endStopId);
                }
            } catch (IllegalArgumentException e) {
                throw e; // Re-throw validation errors
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid end stop ID format: '" + endStopIdStr + "'", e);
            }
        }        route.setUpdatedAt(LocalDateTime.now());
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
                if (importRequest.getValidateStopsExist()) {
                    if (stopRepository.existsById(startStopId)) {
                        route.setStartStopId(startStopId);
                    } else {
                        throw new IllegalArgumentException("Start stop with ID '" + startStopIdStr + "' does not exist");
                    }
                } else {
                    // Set the stop ID without validation
                    route.setStartStopId(startStopId);
                }
            } catch (IllegalArgumentException e) {
                throw e; // Re-throw validation errors
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid start stop ID format: '" + startStopIdStr + "'", e);
            }
        }

        if (endStopIdStr != null && !endStopIdStr.isEmpty()) {
            try {
                UUID endStopId = UUID.fromString(endStopIdStr);
                if (importRequest.getValidateStopsExist()) {
                    if (stopRepository.existsById(endStopId)) {
                        route.setEndStopId(endStopId);
                    } else {
                        throw new IllegalArgumentException("End stop with ID '" + endStopIdStr + "' does not exist");
                    }
                } else {
                    // Set the stop ID without validation
                    route.setEndStopId(endStopId);
                }
            } catch (IllegalArgumentException e) {
                throw e; // Re-throw validation errors
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid end stop ID format: '" + endStopIdStr + "'", e);
            }
        }        route.setCreatedAt(LocalDateTime.now());
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

    @Override
    public RouteExportResponse exportRoutes(RouteExportRequest request, String userId) {
        log.info("Exporting routes with request: {}, user: {}", request, userId);
        
        try {
            // Get filtered routes based on request
            List<Route> routes = getFilteredRoutes(request);
            
            // Build export response
            RouteExportResponse response = new RouteExportResponse();
            
            if (request.getFormat() == RouteExportRequest.ExportFormat.CSV) {
                generateCsvExport(routes, request, response, userId);
            } else {
                generateJsonExport(routes, request, response, userId);
            }
            
            // Set metadata
            setExportMetadata(response, request, routes.size(), userId);
            
            log.info("Successfully exported {} routes for user: {}", routes.size(), userId);
            return response;
            
        } catch (Exception e) {
            log.error("Error exporting routes for user: {}", userId, e);
            throw new RuntimeException("Failed to export routes: " + e.getMessage(), e);
        }
    }

    private List<Route> getFilteredRoutes(RouteExportRequest request) {
        if (Boolean.TRUE.equals(request.getExportAll())) {
            return routeRepository.findAll();
        }
        
        // If specific route IDs are provided, use them
        if (request.getRouteIds() != null && !request.getRouteIds().isEmpty()) {
            return routeRepository.findAllById(request.getRouteIds());
        }
        
        // Start with all routes and apply filters
        List<Route> allRoutes = routeRepository.findAll();
        
        return allRoutes.stream()
            .filter(route -> matchesFilters(route, request))
            .collect(Collectors.toList());
    }

    private boolean matchesFilters(Route route, RouteExportRequest request) {
        // Route group filter
        if (request.getRouteGroupIds() != null && !request.getRouteGroupIds().isEmpty()) {
            if (route.getRouteGroup() == null || !request.getRouteGroupIds().contains(route.getRouteGroup().getId())) {
                return false;
            }
        }
        
        // Start stop filter
        if (request.getStartStopIds() != null && !request.getStartStopIds().isEmpty()) {
            if (route.getStartStopId() == null || !request.getStartStopIds().contains(route.getStartStopId())) {
                return false;
            }
        }
        
        // End stop filter
        if (request.getEndStopIds() != null && !request.getEndStopIds().isEmpty()) {
            if (route.getEndStopId() == null || !request.getEndStopIds().contains(route.getEndStopId())) {
                return false;
            }
        }
        
        // Direction filter
        if (request.getDirections() != null && !request.getDirections().isEmpty()) {
            if (route.getDirection() == null || !request.getDirections().contains(route.getDirection().name())) {
                return false;
            }
        }
        
        // Road type filter
        if (request.getRoadTypes() != null && !request.getRoadTypes().isEmpty()) {
            if (route.getRoadType() == null || !request.getRoadTypes().contains(route.getRoadType().name())) {
                return false;
            }
        }
        
        // Distance filters
        if (request.getMinDistanceKm() != null) {
            if (route.getDistanceKm() == null || route.getDistanceKm() < request.getMinDistanceKm()) {
                return false;
            }
        }
        
        if (request.getMaxDistanceKm() != null) {
            if (route.getDistanceKm() == null || route.getDistanceKm() > request.getMaxDistanceKm()) {
                return false;
            }
        }
        
        // Duration filters
        if (request.getMinDurationMinutes() != null) {
            if (route.getEstimatedDurationMinutes() == null || route.getEstimatedDurationMinutes() < request.getMinDurationMinutes()) {
                return false;
            }
        }
        
        if (request.getMaxDurationMinutes() != null) {
            if (route.getEstimatedDurationMinutes() == null || route.getEstimatedDurationMinutes() > request.getMaxDurationMinutes()) {
                return false;
            }
        }
        
        // Search text filter
        if (request.getSearchText() != null && !request.getSearchText().trim().isEmpty()) {
            String searchText = request.getSearchText().toLowerCase();
            boolean matchesSearch = 
                (route.getName() != null && route.getName().toLowerCase().contains(searchText)) ||
                (route.getNameSinhala() != null && route.getNameSinhala().toLowerCase().contains(searchText)) ||
                (route.getNameTamil() != null && route.getNameTamil().toLowerCase().contains(searchText)) ||
                (route.getRouteNumber() != null && route.getRouteNumber().toLowerCase().contains(searchText)) ||
                (route.getDescription() != null && route.getDescription().toLowerCase().contains(searchText)) ||
                (route.getRouteThrough() != null && route.getRouteThrough().toLowerCase().contains(searchText)) ||
                (route.getRouteGroup() != null && route.getRouteGroup().getName() != null && 
                 route.getRouteGroup().getName().toLowerCase().contains(searchText));
            
            if (!matchesSearch) {
                return false;
            }
        }
        
        // Travels through stop filter
        if (request.getTravelsThroughStopIds() != null && !request.getTravelsThroughStopIds().isEmpty()) {
            List<RouteStop> routeStops = routeStopRepository.findByRouteIdOrderByStopOrder(route.getId());
            boolean travelsThrough = routeStops.stream()
                .anyMatch(rs -> request.getTravelsThroughStopIds().contains(rs.getStop().getId()));
            
            if (!travelsThrough) {
                return false;
            }
        }
        
        return true;
    }

    private void generateCsvExport(List<Route> routes, RouteExportRequest request, 
                                  RouteExportResponse response, String userId) {
        
        if (request.getExportMode() == RouteExportRequest.ExportMode.ROUTE_WITH_ALL_STOPS) {
            generateCsvExportWithAllStops(routes, request, response, userId);
        } else {
            generateCsvExportRouteOnly(routes, request, response, userId);
        }
    }
    
    /**
     * MODE 1 - ROUTE_ONLY: One row per route with only start and end stops
     */
    private void generateCsvExportRouteOnly(List<Route> routes, RouteExportRequest request, 
                                           RouteExportResponse response, String userId) {
        StringWriter csvWriter = new StringWriter();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        
        // Write CSV header
        List<String> headers = buildRouteOnlyCsvHeaders(request);
        csvWriter.write(String.join(",", headers) + "\n");
        
        // Write route data - one row per route
        for (Route route : routes) {
            List<String> rowData = buildRouteOnlyRowData(route, request, formatter);
            csvWriter.write(String.join(",", rowData) + "\n");
        }
        
        // Set response data
        String fileName = String.format("routes_export_route_only_%d.csv", System.currentTimeMillis());
        response.setContent(csvWriter.toString().getBytes(StandardCharsets.UTF_8));
        response.setContentType("text/csv; charset=UTF-8");
        response.setFileName(fileName);
    }
    
    /**
     * MODE 2 - ROUTE_WITH_ALL_STOPS: One row per stop (multiple rows per route)
     */
    private void generateCsvExportWithAllStops(List<Route> routes, RouteExportRequest request, 
                                              RouteExportResponse response, String userId) {
        StringWriter csvWriter = new StringWriter();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        
        // Write CSV header
        List<String> headers = buildRouteWithAllStopsCsvHeaders(request);
        csvWriter.write(String.join(",", headers) + "\n");
        
        int totalRows = 0;
        
        // Write route data - multiple rows per route (one per stop)
        for (Route route : routes) {
            List<RouteStop> routeStops = routeStopRepository.findByRouteIdOrderByStopOrder(route.getId());
            
            // If no route stops found, create one row with start and end stop info
            if (routeStops.isEmpty()) {
                List<String> rowData = buildRouteWithStopRowData(route, null, "start", request, formatter);
                csvWriter.write(String.join(",", rowData) + "\n");
                totalRows++;
            } else {
                // Create a row for each stop in the route
                for (RouteStop routeStop : routeStops) {
                    String stopType = determineStopType(routeStop, route);
                    List<String> rowData = buildRouteWithStopRowData(route, routeStop, stopType, request, formatter);
                    csvWriter.write(String.join(",", rowData) + "\n");
                    totalRows++;
                }
            }
        }
        
        // Set response data
        String fileName = String.format("routes_export_with_all_stops_%d.csv", System.currentTimeMillis());
        response.setContent(csvWriter.toString().getBytes(StandardCharsets.UTF_8));
        response.setContentType("text/csv; charset=UTF-8");
        response.setFileName(fileName);
    }

    private void generateJsonExport(List<Route> routes, RouteExportRequest request, 
                                   RouteExportResponse response, String userId) {
        // Convert routes to response DTOs with filtering based on request options
        List<Map<String, Object>> exportData = new ArrayList<>();
        
        for (Route route : routes) {
            Map<String, Object> routeData = new HashMap<>();
            
            // Basic fields
            routeData.put("id", route.getId());
            routeData.put("name", route.getName());
            
            if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
                routeData.put("nameSinhala", route.getNameSinhala());
                routeData.put("nameTamil", route.getNameTamil());
            }
            
            routeData.put("routeNumber", route.getRouteNumber());
            routeData.put("description", route.getDescription());
            routeData.put("roadType", route.getRoadType());
            routeData.put("routeThrough", route.getRouteThrough());
            
            if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
                routeData.put("routeThroughSinhala", route.getRouteThroughSinhala());
                routeData.put("routeThroughTamil", route.getRouteThroughTamil());
            }
            
            // Route group info
            if (Boolean.TRUE.equals(request.getIncludeRouteGroupInfo()) && route.getRouteGroup() != null) {
                Map<String, Object> routeGroupData = new HashMap<>();
                routeGroupData.put("id", route.getRouteGroup().getId());
                routeGroupData.put("name", route.getRouteGroup().getName());
                
                if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
                    routeGroupData.put("nameSinhala", route.getRouteGroup().getNameSinhala());
                    routeGroupData.put("nameTamil", route.getRouteGroup().getNameTamil());
                }
                
                routeData.put("routeGroup", routeGroupData);
            }
            
            // Stop IDs
            routeData.put("startStopId", route.getStartStopId());
            routeData.put("endStopId", route.getEndStopId());
            
            // Stop details (always included for basic route info)
            Stop startStop = route.getStartStopId() != null ? 
                stopRepository.findById(route.getStartStopId()).orElse(null) : null;
            Stop endStop = route.getEndStopId() != null ? 
                stopRepository.findById(route.getEndStopId()).orElse(null) : null;
            
            if (startStop != null) {
                routeData.put("startStop", mapperUtils.map(startStop, com.busmate.routeschedule.stop.dto.response.StopResponse.class));
            }
            if (endStop != null) {
                routeData.put("endStop", mapperUtils.map(endStop, com.busmate.routeschedule.stop.dto.response.StopResponse.class));
            }
            
            // Route metrics
            routeData.put("distanceKm", route.getDistanceKm());
            routeData.put("estimatedDurationMinutes", route.getEstimatedDurationMinutes());
            routeData.put("direction", route.getDirection());
            
            // Route stops if export mode includes all stops
            if (request.getExportMode() == RouteExportRequest.ExportMode.ROUTE_WITH_ALL_STOPS) {
                List<RouteStop> routeStops = routeStopRepository.findByRouteIdOrderByStopOrder(route.getId());
                List<Map<String, Object>> routeStopsData = routeStops.stream()
                    .map(rs -> {
                        Map<String, Object> rsData = new HashMap<>();
                        rsData.put("stopId", rs.getStop().getId());
                        rsData.put("stopName", rs.getStop().getName());
                        rsData.put("stopOrder", rs.getStopOrder());
                        rsData.put("distanceFromStartKm", rs.getDistanceFromStartKm());
                        return rsData;
                    })
                    .collect(Collectors.toList());
                routeData.put("routeStops", routeStopsData);
            }
            
            // Audit fields if requested
            if (Boolean.TRUE.equals(request.getIncludeAuditFields())) {
                routeData.put("createdAt", route.getCreatedAt());
                routeData.put("updatedAt", route.getUpdatedAt());
                routeData.put("createdBy", route.getCreatedBy());
                routeData.put("updatedBy", route.getUpdatedBy());
            }
            
            exportData.add(routeData);
        }
        
        // Convert to JSON
        try {
            String jsonContent = "{\n  \"routes\": " + 
                exportData.toString().replace("=", ": ") + "\n}";
            response.setContent(jsonContent.getBytes(StandardCharsets.UTF_8));
            response.setContentType("application/json");
            response.setFileName("routes_export_" + System.currentTimeMillis() + ".json");
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate JSON export", e);
        }
    }



    /**
     * Build CSV headers for ROUTE_ONLY mode
     */
    private List<String> buildRouteOnlyCsvHeaders(RouteExportRequest request) {
        List<String> headers = new ArrayList<>();
        
        // Core route fields
        headers.add("route_id");
        headers.add("route_name");
        
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            headers.add("route_name_sinhala");
            headers.add("route_name_tamil");
        }
        
        headers.add("route_number");
        headers.add("route_description");
        headers.add("road_type");
        headers.add("route_through");
        
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            headers.add("route_through_sinhala");
            headers.add("route_through_tamil");
        }
        
        // Route group fields
        if (Boolean.TRUE.equals(request.getIncludeRouteGroupInfo())) {
            headers.add("route_group_id");
            headers.add("route_group_name");
            
            if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
                headers.add("route_group_name_sinhala");
                headers.add("route_group_name_tamil");
            }
        }
        
        // Start and end stop fields (always included)
        headers.add("start_route_stop_id");
        headers.add("start_stop_id");
        headers.add("end_route_stop_id");
        headers.add("end_stop_id");
        headers.add("start_stop_name");
        headers.add("end_stop_name");
        
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            headers.add("start_stop_name_sinhala");
            headers.add("start_stop_name_tamil");
            headers.add("end_stop_name_sinhala");
            headers.add("end_stop_name_tamil");
        }
        
        headers.add("start_stop_latitude");
        headers.add("start_stop_longitude");
        headers.add("start_stop_address");
        headers.add("start_stop_city");
        headers.add("end_stop_latitude");
        headers.add("end_stop_longitude");
        headers.add("end_stop_address");
        headers.add("end_stop_city");
        
        // Route metrics
        headers.add("route_distance_km");
        headers.add("route_estimated_duration_minutes");
        headers.add("route_direction");
        
        // Audit fields
        if (Boolean.TRUE.equals(request.getIncludeAuditFields())) {
            headers.add("route_created_at");
            headers.add("route_updated_at");
            headers.add("route_created_by");
            headers.add("route_updated_by");
        }
        
        return headers;
    }
    
    /**
     * Build CSV headers for ROUTE_WITH_ALL_STOPS mode
     */
    private List<String> buildRouteWithAllStopsCsvHeaders(RouteExportRequest request) {
        List<String> headers = new ArrayList<>();
        
        // Core route fields
        headers.add("route_id");
        headers.add("route_name");
        
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            headers.add("route_name_sinhala");
            headers.add("route_name_tamil");
        }
        
        headers.add("route_number");
        headers.add("route_description");
        headers.add("road_type");
        headers.add("route_through");
        
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            headers.add("route_through_sinhala");
            headers.add("route_through_tamil");
        }
        
        // Route group fields
        if (Boolean.TRUE.equals(request.getIncludeRouteGroupInfo())) {
            headers.add("route_group_id");
            headers.add("route_group_name");
            
            if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
                headers.add("route_group_name_sinhala");
                headers.add("route_group_name_tamil");
            }
        }
        
        // Route stop and stop fields (for current stop in this row)
        headers.add("route_stop_id");
        headers.add("stop_id");
        headers.add("stop_name");
        
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            headers.add("stop_name_sinhala");
            headers.add("stop_name_tamil");
        }
        
        headers.add("stop_order");
        headers.add("distance_from_start_km");
        headers.add("stop_type"); // start, end, intermediate
        
        // Stop location details (always included)
        headers.add("stop_latitude");
        headers.add("stop_longitude");
        headers.add("stop_address");
        headers.add("stop_city");
        
        // Route metrics
        headers.add("route_distance_km");
        headers.add("route_estimated_duration_minutes");
        headers.add("route_direction");
        
        // Audit fields
        if (Boolean.TRUE.equals(request.getIncludeAuditFields())) {
            headers.add("route_created_at");
            headers.add("route_updated_at");
            headers.add("route_created_by");
            headers.add("route_updated_by");
        }
        
        return headers;
    }
    
    /**
     * Build row data for ROUTE_ONLY mode
     */
    private List<String> buildRouteOnlyRowData(Route route, RouteExportRequest request, DateTimeFormatter formatter) {
        List<String> rowData = new ArrayList<>();
        
        // Core route fields
        rowData.add(escapeCsvValue(route.getId().toString()));
        rowData.add(escapeCsvValue(route.getName()));
        
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            rowData.add(escapeCsvValue(route.getNameSinhala()));
            rowData.add(escapeCsvValue(route.getNameTamil()));
        }
        
        rowData.add(escapeCsvValue(route.getRouteNumber()));
        rowData.add(escapeCsvValue(route.getDescription()));
        rowData.add(escapeCsvValue(route.getRoadType() != null ? route.getRoadType().name() : ""));
        rowData.add(escapeCsvValue(route.getRouteThrough()));
        
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            rowData.add(escapeCsvValue(route.getRouteThroughSinhala()));
            rowData.add(escapeCsvValue(route.getRouteThroughTamil()));
        }
        
        // Route group info
        if (Boolean.TRUE.equals(request.getIncludeRouteGroupInfo())) {
            rowData.add(escapeCsvValue(route.getRouteGroup() != null ? route.getRouteGroup().getId().toString() : ""));
            rowData.add(escapeCsvValue(route.getRouteGroup() != null ? route.getRouteGroup().getName() : ""));
            
            if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
                rowData.add(escapeCsvValue(route.getRouteGroup() != null ? route.getRouteGroup().getNameSinhala() : ""));
                rowData.add(escapeCsvValue(route.getRouteGroup() != null ? route.getRouteGroup().getNameTamil() : ""));
            }
        }
        
        // Start and end stop IDs
        // Fetch route stops to get route_stop_ids for start and end stops
        List<RouteStop> routeStops = routeStopRepository.findByRouteIdOrderByStopOrder(route.getId());
        
        // Find start and end route stops
        RouteStop startRouteStop = routeStops.stream()
            .filter(rs -> rs.getStop().getId().equals(route.getStartStopId()))
            .findFirst()
            .orElse(null);
        RouteStop endRouteStop = routeStops.stream()
            .filter(rs -> rs.getStop().getId().equals(route.getEndStopId()))
            .findFirst()
            .orElse(null);
        
        // Add route stop IDs and stop IDs
        rowData.add(escapeCsvValue(startRouteStop != null ? startRouteStop.getId().toString() : ""));
        rowData.add(escapeCsvValue(route.getStartStopId() != null ? route.getStartStopId().toString() : ""));
        rowData.add(escapeCsvValue(endRouteStop != null ? endRouteStop.getId().toString() : ""));
        rowData.add(escapeCsvValue(route.getEndStopId() != null ? route.getEndStopId().toString() : ""));
        
        // Stop details (always included)
        Stop startStop = route.getStartStopId() != null ? 
            stopRepository.findById(route.getStartStopId()).orElse(null) : null;
        Stop endStop = route.getEndStopId() != null ? 
            stopRepository.findById(route.getEndStopId()).orElse(null) : null;
        
        // Start and end stop names
        rowData.add(escapeCsvValue(startStop != null ? startStop.getName() : ""));
        rowData.add(escapeCsvValue(endStop != null ? endStop.getName() : ""));
        
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            rowData.add(escapeCsvValue(startStop != null ? startStop.getNameSinhala() : ""));
            rowData.add(escapeCsvValue(startStop != null ? startStop.getNameTamil() : ""));
            rowData.add(escapeCsvValue(endStop != null ? endStop.getNameSinhala() : ""));
            rowData.add(escapeCsvValue(endStop != null ? endStop.getNameTamil() : ""));
        }
            
        // Start stop location
        if (startStop != null && startStop.getLocation() != null) {
            rowData.add(escapeCsvValue(startStop.getLocation().getLatitude() != null ? 
                startStop.getLocation().getLatitude().toString() : ""));
            rowData.add(escapeCsvValue(startStop.getLocation().getLongitude() != null ? 
                startStop.getLocation().getLongitude().toString() : ""));
            rowData.add(escapeCsvValue(startStop.getLocation().getAddress()));
            rowData.add(escapeCsvValue(startStop.getLocation().getCity()));
        } else {
            rowData.add("");
            rowData.add("");
            rowData.add("");
            rowData.add("");
        }
        
        // End stop location
        if (endStop != null && endStop.getLocation() != null) {
            rowData.add(escapeCsvValue(endStop.getLocation().getLatitude() != null ? 
                endStop.getLocation().getLatitude().toString() : ""));
            rowData.add(escapeCsvValue(endStop.getLocation().getLongitude() != null ? 
                endStop.getLocation().getLongitude().toString() : ""));
            rowData.add(escapeCsvValue(endStop.getLocation().getAddress()));
            rowData.add(escapeCsvValue(endStop.getLocation().getCity()));
        } else {
            rowData.add("");
            rowData.add("");
            rowData.add("");
            rowData.add("");
        }
        
        // Route metrics
        rowData.add(escapeCsvValue(route.getDistanceKm() != null ? route.getDistanceKm().toString() : ""));
        rowData.add(escapeCsvValue(route.getEstimatedDurationMinutes() != null ? 
            route.getEstimatedDurationMinutes().toString() : ""));
        rowData.add(escapeCsvValue(route.getDirection() != null ? route.getDirection().name() : ""));
        
        // Audit fields
        if (Boolean.TRUE.equals(request.getIncludeAuditFields())) {
            rowData.add(escapeCsvValue(route.getCreatedAt() != null ? 
                route.getCreatedAt().format(formatter) : ""));
            rowData.add(escapeCsvValue(route.getUpdatedAt() != null ? 
                route.getUpdatedAt().format(formatter) : ""));
            rowData.add(escapeCsvValue(route.getCreatedBy()));
            rowData.add(escapeCsvValue(route.getUpdatedBy()));
        }
        
        return rowData;
    }
    
    /**
     * Build row data for ROUTE_WITH_ALL_STOPS mode
     */
    private List<String> buildRouteWithStopRowData(Route route, RouteStop routeStop, String stopType, 
                                                  RouteExportRequest request, DateTimeFormatter formatter) {
        List<String> rowData = new ArrayList<>();
        
        // Core route fields (same for all rows of this route)
        rowData.add(escapeCsvValue(route.getId().toString()));
        rowData.add(escapeCsvValue(route.getName()));
        
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            rowData.add(escapeCsvValue(route.getNameSinhala()));
            rowData.add(escapeCsvValue(route.getNameTamil()));
        }
        
        rowData.add(escapeCsvValue(route.getRouteNumber()));
        rowData.add(escapeCsvValue(route.getDescription()));
        rowData.add(escapeCsvValue(route.getRoadType() != null ? route.getRoadType().name() : ""));
        rowData.add(escapeCsvValue(route.getRouteThrough()));
        
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            rowData.add(escapeCsvValue(route.getRouteThroughSinhala()));
            rowData.add(escapeCsvValue(route.getRouteThroughTamil()));
        }
        
        // Route group info
        if (Boolean.TRUE.equals(request.getIncludeRouteGroupInfo())) {
            rowData.add(escapeCsvValue(route.getRouteGroup() != null ? route.getRouteGroup().getId().toString() : ""));
            rowData.add(escapeCsvValue(route.getRouteGroup() != null ? route.getRouteGroup().getName() : ""));
            
            if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
                rowData.add(escapeCsvValue(route.getRouteGroup() != null ? route.getRouteGroup().getNameSinhala() : ""));
                rowData.add(escapeCsvValue(route.getRouteGroup() != null ? route.getRouteGroup().getNameTamil() : ""));
            }
        }
        
        // Route stop and current stop fields (different for each row)
        if (routeStop != null && routeStop.getStop() != null) {
            Stop stop = routeStop.getStop();
            
            // Route stop ID (essential for schedule creation)
            rowData.add(escapeCsvValue(routeStop.getId().toString()));
            
            // Stop information
            rowData.add(escapeCsvValue(stop.getId().toString()));
            rowData.add(escapeCsvValue(stop.getName()));
            
            if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
                rowData.add(escapeCsvValue(stop.getNameSinhala()));
                rowData.add(escapeCsvValue(stop.getNameTamil()));
            }
            
            rowData.add(escapeCsvValue(routeStop.getStopOrder().toString()));
            rowData.add(escapeCsvValue(routeStop.getDistanceFromStartKm() != null ? 
                routeStop.getDistanceFromStartKm().toString() : ""));
            rowData.add(escapeCsvValue(stopType));
            
            // Stop location details
            if (stop.getLocation() != null) {
                rowData.add(escapeCsvValue(stop.getLocation().getLatitude() != null ? 
                    stop.getLocation().getLatitude().toString() : ""));
                rowData.add(escapeCsvValue(stop.getLocation().getLongitude() != null ? 
                    stop.getLocation().getLongitude().toString() : ""));
                rowData.add(escapeCsvValue(stop.getLocation().getAddress()));
                rowData.add(escapeCsvValue(stop.getLocation().getCity()));
            } else {
                rowData.add("");
                rowData.add("");
                rowData.add("");
                rowData.add("");
            }
        } else {
            // Handle case where routeStop is null (shouldn't happen in normal flow)
            rowData.add(""); // route_stop_id
            rowData.add(""); // stop_id
            rowData.add(""); // stop_name
            
            if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
                rowData.add(""); // stop_name_sinhala
                rowData.add(""); // stop_name_tamil
            }
            
            rowData.add(""); // stop_order
            rowData.add(""); // distance_from_start_km
            rowData.add(escapeCsvValue(stopType)); // stop_type
            
            // Empty location fields
            rowData.add(""); // latitude
            rowData.add(""); // longitude
            rowData.add(""); // address
            rowData.add(""); // city
        }
        
        // Route metrics (same for all rows of this route)
        rowData.add(escapeCsvValue(route.getDistanceKm() != null ? route.getDistanceKm().toString() : ""));
        rowData.add(escapeCsvValue(route.getEstimatedDurationMinutes() != null ? 
            route.getEstimatedDurationMinutes().toString() : ""));
        rowData.add(escapeCsvValue(route.getDirection() != null ? route.getDirection().name() : ""));
        
        // Audit fields
        if (Boolean.TRUE.equals(request.getIncludeAuditFields())) {
            rowData.add(escapeCsvValue(route.getCreatedAt() != null ? 
                route.getCreatedAt().format(formatter) : ""));
            rowData.add(escapeCsvValue(route.getUpdatedAt() != null ? 
                route.getUpdatedAt().format(formatter) : ""));
            rowData.add(escapeCsvValue(route.getCreatedBy()));
            rowData.add(escapeCsvValue(route.getUpdatedBy()));
        }
        
        return rowData;
    }
    
    /**
     * Determine the type of stop (start, end, intermediate)
     */
    private String determineStopType(RouteStop routeStop, Route route) {
        if (routeStop.getStop().getId().equals(route.getStartStopId())) {
            return "start";
        } else if (routeStop.getStop().getId().equals(route.getEndStopId())) {
            return "end";
        } else {
            return "intermediate";
        }
    }

    private String escapeCsvValue(String value) {
        if (value == null) {
            return "";
        }
        
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        
        return value;
    }

    private void setExportMetadata(RouteExportResponse response, RouteExportRequest request, 
                                  int recordCount, String userId) {
        RouteExportResponse.ExportMetadata metadata = new RouteExportResponse.ExportMetadata();
        metadata.setTotalRecordsFound(recordCount);
        metadata.setRecordsExported(recordCount);
        metadata.setExportedAt(LocalDateTime.now());
        metadata.setExportedBy(userId);
        metadata.setFormat(request.getFormat().name());
        metadata.setExportMode(request.getExportMode().name());
        
        // Set filter summary
        RouteExportResponse.FilterSummary filterSummary = new RouteExportResponse.FilterSummary();
        filterSummary.setExportedAll(Boolean.TRUE.equals(request.getExportAll()));
        filterSummary.setSpecificRouteIds(request.getRouteIds() != null ? request.getRouteIds().size() : 0);
        filterSummary.setRouteGroupIds(request.getRouteGroupIds() != null ? request.getRouteGroupIds().size() : 0);
        filterSummary.setStartStopIds(request.getStartStopIds() != null ? request.getStartStopIds().size() : 0);
        filterSummary.setEndStopIds(request.getEndStopIds() != null ? request.getEndStopIds().size() : 0);
        filterSummary.setTravelsThroughStops(request.getTravelsThroughStopIds() != null ? 
            request.getTravelsThroughStopIds().size() : 0);
        filterSummary.setDirections(request.getDirections());
        filterSummary.setRoadTypes(request.getRoadTypes());
        filterSummary.setMinDistanceKm(request.getMinDistanceKm());
        filterSummary.setMaxDistanceKm(request.getMaxDistanceKm());
        filterSummary.setMinDurationMinutes(request.getMinDurationMinutes());
        filterSummary.setMaxDurationMinutes(request.getMaxDurationMinutes());
        filterSummary.setSearchText(request.getSearchText());
        
        metadata.setFiltersApplied(filterSummary);
        
        // Set export options
        RouteExportResponse.ExportOptions exportOptions = new RouteExportResponse.ExportOptions();
        exportOptions.setExportMode(request.getExportMode().name());
        exportOptions.setIncludeMultiLanguageFields(request.getIncludeMultiLanguageFields());
        exportOptions.setIncludeRouteGroupInfo(request.getIncludeRouteGroupInfo());
        exportOptions.setIncludeAuditFields(request.getIncludeAuditFields());
        exportOptions.setCustomFields(request.getCustomFields());
        
        metadata.setOptionsUsed(exportOptions);
        response.setMetadata(metadata);
    }
}