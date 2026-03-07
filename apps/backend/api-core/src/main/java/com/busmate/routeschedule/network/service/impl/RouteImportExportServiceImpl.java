package com.busmate.routeschedule.network.service.impl;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.busmate.routeschedule.network.dto.request.RouteExportRequest;
import com.busmate.routeschedule.network.dto.request.RouteUnifiedImportRequest;
import com.busmate.routeschedule.network.dto.response.RouteExportResponse;
import com.busmate.routeschedule.network.dto.response.RouteUnifiedImportResponse;
import com.busmate.routeschedule.network.entity.Route;
import com.busmate.routeschedule.network.entity.RouteGroup;
import com.busmate.routeschedule.network.entity.RouteStop;
import com.busmate.routeschedule.network.entity.Stop;
import com.busmate.routeschedule.network.enums.DirectionEnum;
import com.busmate.routeschedule.network.enums.RoadTypeEnum;
import com.busmate.routeschedule.network.repository.RouteGroupRepository;
import com.busmate.routeschedule.network.repository.RouteRepository;
import com.busmate.routeschedule.network.repository.RouteStopRepository;
import com.busmate.routeschedule.network.repository.StopRepository;
import com.busmate.routeschedule.network.service.RouteImportExportService;
import com.busmate.routeschedule.shared.util.MapperUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementation of {@link RouteImportExportService}.
 *
 * <p>All bulk data-movement logic (CSV import, JSON/CSV export) has been extracted here from
 * {@code RouteServiceImpl} to keep the core service class focused on CRUD operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RouteImportExportServiceImpl implements RouteImportExportService {

    private final RouteRepository routeRepository;
    private final RouteGroupRepository routeGroupRepository;
    private final RouteStopRepository routeStopRepository;
    private final StopRepository stopRepository;
    private final MapperUtils mapperUtils;

    // ════════════════════════════════ IMPORT ════════════════════════════════

    @Override
    @Transactional
    public RouteUnifiedImportResponse importRoutesUnified(MultipartFile file,
                                                          RouteUnifiedImportRequest importRequest,
                                                          String userId) {
        RouteUnifiedImportResponse response = new RouteUnifiedImportResponse();
        List<RouteUnifiedImportResponse.ImportError> errors = new ArrayList<>();
        List<RouteUnifiedImportResponse.ImportWarning> warnings = new ArrayList<>();

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

        Map<String, RouteGroup> routeGroupCache = new HashMap<>();
        Map<String, Route> routeCache = new HashMap<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            int rowNumber = 0;
            boolean isHeader = true;

            while ((line = reader.readLine()) != null) {
                rowNumber++;
                if (isHeader) { isHeader = false; continue; }
                totalRecords++;

                try {
                    String[] columns = parseCSVLine(line);

                    if (columns.length < 23) {
                        throw new IllegalArgumentException(
                                "Invalid CSV format. Expected 23 columns but found " + columns.length);
                    }

                    String routeGroupName        = getValueOrNull(columns[0]);
                    String routeGroupNameSinhala = getValueOrNull(columns[1]);
                    String routeGroupNameTamil   = getValueOrNull(columns[2]);
                    String routeGroupDescription = getValueOrNull(columns[3]);

                    String routeName             = getValueOrNull(columns[4]);
                    String routeNameSinhala      = getValueOrNull(columns[5]);
                    String routeNameTamil        = getValueOrNull(columns[6]);
                    String routeNumber           = getValueOrNull(columns[7]);
                    String routeDescription      = getValueOrNull(columns[8]);
                    String roadTypeStr           = getValueOrNull(columns[9]);
                    String routeThrough          = getValueOrNull(columns[10]);
                    String routeThroughSinhala   = getValueOrNull(columns[11]);
                    String routeThroughTamil     = getValueOrNull(columns[12]);
                    String directionStr          = getValueOrNull(columns[13]);
                    String distanceKmStr         = getValueOrNull(columns[14]);
                    String estimatedDurationStr  = getValueOrNull(columns[15]);
                    String startStopIdStr        = getValueOrNull(columns[16]);
                    String endStopIdStr          = getValueOrNull(columns[17]);

                    String stopOrderStr          = getValueOrNull(columns[18]);
                    String stopIdStr             = getValueOrNull(columns[19]);
                    String stopNameEnglish       = getValueOrNull(columns[20]);
                    String stopNameSinhala       = getValueOrNull(columns[21]);
                    String distanceFromStartStr  = getValueOrNull(columns[22]);

                    if (routeGroupName == null || routeGroupName.trim().isEmpty()) {
                        throw new IllegalArgumentException("Route group name is required");
                    }
                    if (routeName == null || routeName.trim().isEmpty()) {
                        throw new IllegalArgumentException("Route name is required");
                    }
                    if (directionStr == null || directionStr.trim().isEmpty()) {
                        throw new IllegalArgumentException("Direction is required");
                    }

                    RouteGroup routeGroup = processRouteGroup(
                            routeGroupName, routeGroupNameSinhala, routeGroupNameTamil,
                            routeGroupDescription, importRequest, routeGroupCache, summary,
                            rowNumber, warnings, userId);

                    if (routeGroup == null) { skippedRecords++; continue; }

                    String routeKey = routeGroup.getId() + ":" + routeName;
                    Route route = routeCache.get(routeKey);

                    if (route == null) {
                        route = processRoute(routeName, routeNameSinhala, routeNameTamil, routeNumber,
                                routeDescription, roadTypeStr, routeThrough, routeThroughSinhala,
                                routeThroughTamil, directionStr, distanceKmStr, estimatedDurationStr,
                                startStopIdStr, endStopIdStr, routeGroup, importRequest,
                                summary, rowNumber, warnings, userId);
                        if (route != null) routeCache.put(routeKey, route);
                    }

                    if (route == null) { skippedRecords++; continue; }

                    boolean routeStopProcessed = processRouteStop(route, stopOrderStr, stopIdStr,
                            stopNameEnglish, stopNameSinhala, distanceFromStartStr,
                            importRequest, summary, rowNumber, warnings);

                    if (routeStopProcessed) { successfulImports++; } else { skippedRecords++; }

                } catch (Exception e) {
                    failedImports++;
                    RouteUnifiedImportResponse.ImportError error = new RouteUnifiedImportResponse.ImportError();
                    error.setRowNumber(rowNumber);
                    error.setErrorMessage(e.getMessage());
                    error.setRawCsvRow(line);
                    errors.add(error);
                    log.error("Failed to import route data at row {}: {}", rowNumber, e.getMessage());
                    if (!importRequest.getContinueOnError()) break;
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
        response.setMessage(String.format(
                "Import completed. %d successful, %d failed, %d skipped out of %d total records. "
                + "Created %d route groups, %d routes, %d route stops.",
                successfulImports, failedImports, skippedRecords, totalRecords,
                summary.getRouteGroupsCreated(), summary.getRoutesCreated(),
                summary.getRouteStopsCreated()));

        return response;
    }

    // ─────────────────── Import helpers ───────────────────────────────────

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
        if (value == null || value.trim().isEmpty() || "null".equalsIgnoreCase(value.trim())) return null;
        return value.trim();
    }

    private RouteGroup processRouteGroup(String name, String nameSinhala, String nameTamil,
                                         String description, RouteUnifiedImportRequest importRequest,
                                         Map<String, RouteGroup> routeGroupCache,
                                         RouteUnifiedImportResponse.ImportSummary summary,
                                         int rowNumber, List<RouteUnifiedImportResponse.ImportWarning> warnings,
                                         String userId) {
        RouteGroup cached = routeGroupCache.get(name);
        if (cached != null) return cached;

        Optional<RouteGroup> existing = routeGroupRepository.findByNameIgnoreCase(name);
        if (existing.isPresent()) {
            RouteGroup routeGroup = existing.get();
            switch (importRequest.getRouteGroupDuplicateStrategy()) {
                case SKIP:
                    addWarning(warnings, rowNumber, "route_group_name", "Route group already exists, skipping", "SKIPPED");
                    return null;
                case REUSE:
                    routeGroupCache.put(name, routeGroup);
                    summary.setRouteGroupsReused(summary.getRouteGroupsReused() + 1);
                    addWarning(warnings, rowNumber, "route_group_name", "Reusing existing route group: " + name, "REUSED");
                    return routeGroup;
                case CREATE_WITH_SUFFIX:
                    String newName = findUniqueRouteGroupName(name);
                    RouteGroup newRG = createRouteGroup(newName, nameSinhala, nameTamil, description, userId);
                    routeGroupCache.put(name, newRG);
                    addCreatedEntity(summary.getCreatedRouteGroups(), newRG.getId(), newRG.getName(), rowNumber);
                    summary.setRouteGroupsCreated(summary.getRouteGroupsCreated() + 1);
                    addWarning(warnings, rowNumber, "route_group_name", "Created route group with suffix: " + newName, "CREATED");
                    return newRG;
            }
        }

        RouteGroup newRouteGroup = createRouteGroup(name, nameSinhala, nameTamil, description, userId);
        routeGroupCache.put(name, newRouteGroup);
        addCreatedEntity(summary.getCreatedRouteGroups(), newRouteGroup.getId(), newRouteGroup.getName(), rowNumber);
        summary.setRouteGroupsCreated(summary.getRouteGroupsCreated() + 1);
        return newRouteGroup;
    }

    private String findUniqueRouteGroupName(String baseName) {
        int counter = 1;
        String newName;
        do { newName = baseName + "_" + counter++; } while (routeGroupRepository.existsByName(newName));
        return newName;
    }

    private RouteGroup createRouteGroup(String name, String nameSinhala, String nameTamil,
                                         String description, String userId) {
        RouteGroup rg = new RouteGroup();
        rg.setName(name);
        rg.setNameSinhala(nameSinhala);
        rg.setNameTamil(nameTamil);
        rg.setDescription(description);
        rg.setCreatedAt(LocalDateTime.now());
        rg.setUpdatedAt(LocalDateTime.now());
        rg.setCreatedBy(userId);
        rg.setUpdatedBy(userId);
        return routeGroupRepository.save(rg);
    }

    private Route processRoute(String name, String nameSinhala, String nameTamil, String routeNumber,
                               String description, String roadTypeStr, String routeThrough,
                               String routeThroughSinhala, String routeThroughTamil, String directionStr,
                               String distanceKmStr, String estimatedDurationStr,
                               String startStopIdStr, String endStopIdStr,
                               RouteGroup routeGroup, RouteUnifiedImportRequest importRequest,
                               RouteUnifiedImportResponse.ImportSummary summary, int rowNumber,
                               List<RouteUnifiedImportResponse.ImportWarning> warnings, String userId) {

        boolean routeExists = routeRepository.existsByNameAndRouteGroup_Id(name, routeGroup.getId());

        if (routeExists) {
            switch (importRequest.getRouteDuplicateStrategy()) {
                case SKIP:
                    addWarning(warnings, rowNumber, "route_name", "Route already exists in route group, skipping", "SKIPPED");
                    return null;
                case UPDATE:
                    Optional<Route> existingRoute = routeRepository.findByNameAndRouteGroup_Id(name, routeGroup.getId());
                    if (existingRoute.isPresent()) {
                        Route route = existingRoute.get();
                        updateRouteFields(route, nameSinhala, nameTamil, routeNumber, description,
                                roadTypeStr, routeThrough, routeThroughSinhala, routeThroughTamil,
                                directionStr, distanceKmStr, estimatedDurationStr,
                                startStopIdStr, endStopIdStr, importRequest, userId);
                        addWarning(warnings, rowNumber, "route_name", "Updated existing route: " + name, "UPDATED");
                        return route;
                    }
                    break;
                case CREATE_WITH_SUFFIX:
                    String newName = findUniqueRouteName(name, routeGroup.getId());
                    Route newRoute = createRoute(newName, nameSinhala, nameTamil, routeNumber, description,
                            roadTypeStr, routeThrough, routeThroughSinhala, routeThroughTamil,
                            directionStr, distanceKmStr, estimatedDurationStr,
                            startStopIdStr, endStopIdStr, routeGroup, importRequest, summary, rowNumber, userId);
                    addWarning(warnings, rowNumber, "route_name", "Created route with suffix: " + newName, "CREATED");
                    return newRoute;
            }
        }

        return createRoute(name, nameSinhala, nameTamil, routeNumber, description, roadTypeStr,
                routeThrough, routeThroughSinhala, routeThroughTamil, directionStr,
                distanceKmStr, estimatedDurationStr, startStopIdStr, endStopIdStr,
                routeGroup, importRequest, summary, rowNumber, userId);
    }

    private String findUniqueRouteName(String baseName, UUID routeGroupId) {
        int counter = 1;
        String newName;
        do { newName = baseName + "_" + counter++; } while (routeRepository.existsByNameAndRouteGroup_Id(newName, routeGroupId));
        return newName;
    }

    private void updateRouteFields(Route route, String nameSinhala, String nameTamil, String routeNumber,
                                   String description, String roadTypeStr, String routeThrough,
                                   String routeThroughSinhala, String routeThroughTamil, String directionStr,
                                   String distanceKmStr, String estimatedDurationStr,
                                   String startStopIdStr, String endStopIdStr,
                                   RouteUnifiedImportRequest importRequest, String userId) {

        if (nameSinhala != null) route.setNameSinhala(nameSinhala);
        if (nameTamil != null) route.setNameTamil(nameTamil);
        if (routeNumber != null) route.setRouteNumber(routeNumber);
        if (description != null) route.setDescription(description);

        if (roadTypeStr != null && !roadTypeStr.isEmpty()) {
            try { route.setRoadType(RoadTypeEnum.valueOf(roadTypeStr.toUpperCase())); }
            catch (Exception e) { route.setRoadType(RoadTypeEnum.valueOf(importRequest.getDefaultRoadType())); }
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

        applyStartStop(route, startStopIdStr, importRequest.getValidateStopsExist());
        applyEndStop(route, endStopIdStr, importRequest.getValidateStopsExist());

        route.setUpdatedAt(LocalDateTime.now());
        route.setUpdatedBy(userId);
        routeRepository.save(route);
    }

    private Route createRoute(String name, String nameSinhala, String nameTamil, String routeNumber,
                              String description, String roadTypeStr, String routeThrough,
                              String routeThroughSinhala, String routeThroughTamil, String directionStr,
                              String distanceKmStr, String estimatedDurationStr,
                              String startStopIdStr, String endStopIdStr,
                              RouteGroup routeGroup, RouteUnifiedImportRequest importRequest,
                              RouteUnifiedImportResponse.ImportSummary summary, int rowNumber, String userId) {

        Route route = new Route();
        route.setName(name);
        route.setNameSinhala(nameSinhala);
        route.setNameTamil(nameTamil);
        route.setRouteNumber(routeNumber);
        route.setDescription(description);
        route.setRouteGroup(routeGroup);

        if (roadTypeStr != null && !roadTypeStr.isEmpty()) {
            try { route.setRoadType(RoadTypeEnum.valueOf(roadTypeStr.toUpperCase())); }
            catch (Exception e) { route.setRoadType(RoadTypeEnum.valueOf(importRequest.getDefaultRoadType())); }
        } else {
            route.setRoadType(RoadTypeEnum.valueOf(importRequest.getDefaultRoadType()));
        }

        route.setRouteThrough(routeThrough);
        route.setRouteThroughSinhala(routeThroughSinhala);
        route.setRouteThroughTamil(routeThroughTamil);

        if (directionStr != null && !directionStr.isEmpty()) {
            route.setDirection(DirectionEnum.valueOf(directionStr.toUpperCase()));
        }
        if (distanceKmStr != null && !distanceKmStr.isEmpty()) {
            route.setDistanceKm(Double.parseDouble(distanceKmStr));
        }
        if (estimatedDurationStr != null && !estimatedDurationStr.isEmpty()) {
            route.setEstimatedDurationMinutes(Integer.parseInt(estimatedDurationStr));
        }

        applyStartStop(route, startStopIdStr, importRequest.getValidateStopsExist());
        applyEndStop(route, endStopIdStr, importRequest.getValidateStopsExist());

        route.setCreatedAt(LocalDateTime.now());
        route.setUpdatedAt(LocalDateTime.now());
        route.setCreatedBy(userId);
        route.setUpdatedBy(userId);

        route = routeRepository.save(route);

        addCreatedEntity(summary.getCreatedRoutes(), route.getId(), route.getName(), rowNumber);
        summary.setRoutesCreated(summary.getRoutesCreated() + 1);
        return route;
    }

    private void applyStartStop(Route route, String startStopIdStr, boolean validate) {
        if (startStopIdStr == null || startStopIdStr.isEmpty()) return;
        try {
            UUID startStopId = UUID.fromString(startStopIdStr);
            if (validate && !stopRepository.existsById(startStopId)) {
                throw new IllegalArgumentException("Start stop with ID '" + startStopIdStr + "' does not exist");
            }
            route.setStartStopId(startStopId);
        } catch (IllegalArgumentException e) { throw e; }
        catch (Exception e) { throw new IllegalArgumentException("Invalid start stop ID: '" + startStopIdStr + "'", e); }
    }

    private void applyEndStop(Route route, String endStopIdStr, boolean validate) {
        if (endStopIdStr == null || endStopIdStr.isEmpty()) return;
        try {
            UUID endStopId = UUID.fromString(endStopIdStr);
            if (validate && !stopRepository.existsById(endStopId)) {
                throw new IllegalArgumentException("End stop with ID '" + endStopIdStr + "' does not exist");
            }
            route.setEndStopId(endStopId);
        } catch (IllegalArgumentException e) { throw e; }
        catch (Exception e) { throw new IllegalArgumentException("Invalid end stop ID: '" + endStopIdStr + "'", e); }
    }

    private boolean processRouteStop(Route route, String stopOrderStr, String stopIdStr,
                                     String stopNameEnglish, String stopNameSinhala,
                                     String distanceFromStartStr, RouteUnifiedImportRequest importRequest,
                                     RouteUnifiedImportResponse.ImportSummary summary, int rowNumber,
                                     List<RouteUnifiedImportResponse.ImportWarning> warnings) {

        if (stopOrderStr == null || stopOrderStr.isEmpty()) return false;

        try {
            Integer stopOrder = Integer.parseInt(stopOrderStr);
            UUID stopId = null;

            if (stopIdStr != null && !stopIdStr.isEmpty()) {
                try {
                    stopId = UUID.fromString(stopIdStr);
                    if (!stopRepository.existsById(stopId)) stopId = null;
                } catch (Exception ignored) {}
            }

            if (stopId == null && stopNameEnglish != null && !stopNameEnglish.isEmpty()) {
                final String name = stopNameEnglish;
                List<Stop> stops = stopRepository.findAll().stream()
                        .filter(s -> s.getName().equalsIgnoreCase(name))
                        .collect(Collectors.toList());
                if (!stops.isEmpty()) stopId = stops.get(0).getId();
            }

            if (stopId == null) {
                if (importRequest.getValidateStopsExist()) {
                    throw new IllegalArgumentException(
                            "Stop not found: " + (stopNameEnglish != null ? stopNameEnglish : stopIdStr));
                } else {
                    addWarning(warnings, rowNumber, "stop_id",
                            "Stop not found, skipping route stop: " + (stopNameEnglish != null ? stopNameEnglish : stopIdStr),
                            "SKIPPED");
                    return false;
                }
            }

            Optional<RouteStop> existingRouteStop = routeStopRepository
                    .findByRouteIdAndStopIdAndStopOrder(route.getId(), stopId, stopOrder);

            if (existingRouteStop.isPresent() && !importRequest.getAllowPartialRouteStops()) {
                return false;
            }

            RouteStop routeStop = new RouteStop();
            routeStop.setRoute(route);

            Optional<Stop> stopOpt = stopRepository.findById(stopId);
            if (stopOpt.isEmpty()) return false;
            routeStop.setStop(stopOpt.get());
            routeStop.setStopOrder(stopOrder);

            if (distanceFromStartStr != null && !distanceFromStartStr.isEmpty()) {
                try { routeStop.setDistanceFromStartKm(Double.parseDouble(distanceFromStartStr)); }
                catch (Exception ignored) {}
            }

            routeStopRepository.save(routeStop);
            summary.setRouteStopsCreated(summary.getRouteStopsCreated() + 1);
            return true;

        } catch (Exception e) {
            if (!importRequest.getAllowPartialRouteStops()) throw e;
            addWarning(warnings, rowNumber, "route_stop", "Failed to create route stop: " + e.getMessage(), "SKIPPED");
            return false;
        }
    }

    private void addWarning(List<RouteUnifiedImportResponse.ImportWarning> warnings,
                            int rowNumber, String field, String message, String action) {
        RouteUnifiedImportResponse.ImportWarning w = new RouteUnifiedImportResponse.ImportWarning();
        w.setRowNumber(rowNumber);
        w.setField(field);
        w.setWarningMessage(message);
        w.setAction(action);
        warnings.add(w);
    }

    private void addCreatedEntity(List<RouteUnifiedImportResponse.ImportSummary.CreatedEntity> list,
                                   UUID id, String name, int rowNumber) {
        RouteUnifiedImportResponse.ImportSummary.CreatedEntity entity =
                new RouteUnifiedImportResponse.ImportSummary.CreatedEntity();
        entity.setId(id);
        entity.setName(name);
        entity.setRowNumber(rowNumber);
        list.add(entity);
    }

    // ════════════════════════════════ EXPORT ════════════════════════════════

    @Override
    public RouteExportResponse exportRoutes(RouteExportRequest request, String userId) {
        log.info("Exporting routes with request: {}, user: {}", request, userId);
        try {
            List<Route> routes = getFilteredRoutes(request);
            RouteExportResponse response = new RouteExportResponse();

            if (request.getFormat() == RouteExportRequest.ExportFormat.CSV) {
                generateCsvExport(routes, request, response, userId);
            } else {
                generateJsonExport(routes, request, response, userId);
            }

            setExportMetadata(response, request, routes.size(), userId);
            log.info("Successfully exported {} routes for user: {}", routes.size(), userId);
            return response;

        } catch (Exception e) {
            log.error("Error exporting routes for user: {}", userId, e);
            throw new RuntimeException("Failed to export routes: " + e.getMessage(), e);
        }
    }

    // ─────────────────── Export helpers ───────────────────────────────────

    private List<Route> getFilteredRoutes(RouteExportRequest request) {
        if (Boolean.TRUE.equals(request.getExportAll())) return routeRepository.findAll();
        if (request.getRouteIds() != null && !request.getRouteIds().isEmpty()) {
            return routeRepository.findAllById(request.getRouteIds());
        }
        return routeRepository.findAll().stream()
                .filter(r -> matchesFilters(r, request))
                .collect(Collectors.toList());
    }

    private boolean matchesFilters(Route route, RouteExportRequest request) {
        if (request.getRouteGroupIds() != null && !request.getRouteGroupIds().isEmpty()) {
            if (route.getRouteGroup() == null || !request.getRouteGroupIds().contains(route.getRouteGroup().getId()))
                return false;
        }
        if (request.getStartStopIds() != null && !request.getStartStopIds().isEmpty()) {
            if (route.getStartStopId() == null || !request.getStartStopIds().contains(route.getStartStopId()))
                return false;
        }
        if (request.getEndStopIds() != null && !request.getEndStopIds().isEmpty()) {
            if (route.getEndStopId() == null || !request.getEndStopIds().contains(route.getEndStopId()))
                return false;
        }
        if (request.getDirections() != null && !request.getDirections().isEmpty()) {
            if (route.getDirection() == null || !request.getDirections().contains(route.getDirection().name()))
                return false;
        }
        if (request.getRoadTypes() != null && !request.getRoadTypes().isEmpty()) {
            if (route.getRoadType() == null || !request.getRoadTypes().contains(route.getRoadType().name()))
                return false;
        }
        if (request.getMinDistanceKm() != null &&
                (route.getDistanceKm() == null || route.getDistanceKm() < request.getMinDistanceKm()))
            return false;
        if (request.getMaxDistanceKm() != null &&
                (route.getDistanceKm() == null || route.getDistanceKm() > request.getMaxDistanceKm()))
            return false;
        if (request.getMinDurationMinutes() != null &&
                (route.getEstimatedDurationMinutes() == null || route.getEstimatedDurationMinutes() < request.getMinDurationMinutes()))
            return false;
        if (request.getMaxDurationMinutes() != null &&
                (route.getEstimatedDurationMinutes() == null || route.getEstimatedDurationMinutes() > request.getMaxDurationMinutes()))
            return false;

        if (request.getSearchText() != null && !request.getSearchText().trim().isEmpty()) {
            String s = request.getSearchText().toLowerCase();
            boolean matches =
                    (route.getName() != null && route.getName().toLowerCase().contains(s)) ||
                    (route.getNameSinhala() != null && route.getNameSinhala().toLowerCase().contains(s)) ||
                    (route.getNameTamil() != null && route.getNameTamil().toLowerCase().contains(s)) ||
                    (route.getRouteNumber() != null && route.getRouteNumber().toLowerCase().contains(s)) ||
                    (route.getDescription() != null && route.getDescription().toLowerCase().contains(s)) ||
                    (route.getRouteThrough() != null && route.getRouteThrough().toLowerCase().contains(s)) ||
                    (route.getRouteGroup() != null && route.getRouteGroup().getName() != null &&
                     route.getRouteGroup().getName().toLowerCase().contains(s));
            if (!matches) return false;
        }

        if (request.getTravelsThroughStopIds() != null && !request.getTravelsThroughStopIds().isEmpty()) {
            List<RouteStop> rStops = routeStopRepository.findByRouteIdOrderByStopOrder(route.getId());
            boolean travels = rStops.stream()
                    .anyMatch(rs -> request.getTravelsThroughStopIds().contains(rs.getStop().getId()));
            if (!travels) return false;
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

    private void generateCsvExportRouteOnly(List<Route> routes, RouteExportRequest request,
                                            RouteExportResponse response, String userId) {
        StringWriter csvWriter = new StringWriter();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        csvWriter.write(String.join(",", buildRouteOnlyCsvHeaders(request)) + "\n");
        for (Route route : routes) {
            csvWriter.write(String.join(",", buildRouteOnlyRowData(route, request, formatter)) + "\n");
        }
        response.setContent(csvWriter.toString().getBytes(StandardCharsets.UTF_8));
        response.setContentType("text/csv; charset=UTF-8");
        response.setFileName("routes_export_route_only_" + System.currentTimeMillis() + ".csv");
    }

    private void generateCsvExportWithAllStops(List<Route> routes, RouteExportRequest request,
                                               RouteExportResponse response, String userId) {
        StringWriter csvWriter = new StringWriter();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        csvWriter.write(String.join(",", buildRouteWithAllStopsCsvHeaders(request)) + "\n");

        for (Route route : routes) {
            List<RouteStop> routeStops = routeStopRepository.findByRouteIdOrderByStopOrder(route.getId());
            if (routeStops.isEmpty()) {
                csvWriter.write(String.join(",", buildRouteWithStopRowData(route, null, "start", request, formatter)) + "\n");
            } else {
                for (RouteStop rs : routeStops) {
                    String stopType = determineStopType(rs, route);
                    csvWriter.write(String.join(",", buildRouteWithStopRowData(route, rs, stopType, request, formatter)) + "\n");
                }
            }
        }

        response.setContent(csvWriter.toString().getBytes(StandardCharsets.UTF_8));
        response.setContentType("text/csv; charset=UTF-8");
        response.setFileName("routes_export_with_all_stops_" + System.currentTimeMillis() + ".csv");
    }

    private void generateJsonExport(List<Route> routes, RouteExportRequest request,
                                    RouteExportResponse response, String userId) {
        List<Map<String, Object>> exportData = new ArrayList<>();

        for (Route route : routes) {
            Map<String, Object> routeData = new HashMap<>();
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
            if (Boolean.TRUE.equals(request.getIncludeRouteGroupInfo()) && route.getRouteGroup() != null) {
                Map<String, Object> rgData = new HashMap<>();
                rgData.put("id", route.getRouteGroup().getId());
                rgData.put("name", route.getRouteGroup().getName());
                if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
                    rgData.put("nameSinhala", route.getRouteGroup().getNameSinhala());
                    rgData.put("nameTamil", route.getRouteGroup().getNameTamil());
                }
                routeData.put("routeGroup", rgData);
            }
            routeData.put("startStopId", route.getStartStopId());
            routeData.put("endStopId", route.getEndStopId());

            Stop startStop = route.getStartStop();
            Stop endStop = route.getEndStop();

            if (startStop != null) {
                routeData.put("startStop", mapperUtils.map(startStop, com.busmate.routeschedule.network.dto.response.StopResponse.class));
            }
            if (endStop != null) {
                routeData.put("endStop", mapperUtils.map(endStop, com.busmate.routeschedule.network.dto.response.StopResponse.class));
            }

            routeData.put("distanceKm", route.getDistanceKm());
            routeData.put("estimatedDurationMinutes", route.getEstimatedDurationMinutes());
            routeData.put("direction", route.getDirection());

            if (request.getExportMode() == RouteExportRequest.ExportMode.ROUTE_WITH_ALL_STOPS) {
                List<RouteStop> rStops = routeStopRepository.findByRouteIdOrderByStopOrder(route.getId());
                List<Map<String, Object>> rsData = rStops.stream().map(rs -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("stopId", rs.getStop().getId());
                    m.put("stopName", rs.getStop().getName());
                    m.put("stopOrder", rs.getStopOrder());
                    m.put("distanceFromStartKm", rs.getDistanceFromStartKm());
                    return m;
                }).collect(Collectors.toList());
                routeData.put("routeStops", rsData);
            }

            if (Boolean.TRUE.equals(request.getIncludeAuditFields())) {
                routeData.put("createdAt", route.getCreatedAt());
                routeData.put("updatedAt", route.getUpdatedAt());
                routeData.put("createdBy", route.getCreatedBy());
                routeData.put("updatedBy", route.getUpdatedBy());
            }
            exportData.add(routeData);
        }

        try {
            String jsonContent = "{\n  \"routes\": " + exportData.toString().replace("=", ": ") + "\n}";
            response.setContent(jsonContent.getBytes(StandardCharsets.UTF_8));
            response.setContentType("application/json");
            response.setFileName("routes_export_" + System.currentTimeMillis() + ".json");
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate JSON export", e);
        }
    }

    // ─── CSV header/row builders ───────────────────────────────────────────

    private List<String> buildRouteOnlyCsvHeaders(RouteExportRequest request) {
        List<String> h = new ArrayList<>();
        h.add("route_id"); h.add("route_name");
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            h.add("route_name_sinhala"); h.add("route_name_tamil");
        }
        h.add("route_number"); h.add("route_description"); h.add("road_type"); h.add("route_through");
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            h.add("route_through_sinhala"); h.add("route_through_tamil");
        }
        if (Boolean.TRUE.equals(request.getIncludeRouteGroupInfo())) {
            h.add("route_group_id"); h.add("route_group_name");
            if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
                h.add("route_group_name_sinhala"); h.add("route_group_name_tamil");
            }
        }
        h.add("start_route_stop_id"); h.add("start_stop_id"); h.add("end_route_stop_id"); h.add("end_stop_id");
        h.add("start_stop_name"); h.add("end_stop_name");
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            h.add("start_stop_name_sinhala"); h.add("start_stop_name_tamil");
            h.add("end_stop_name_sinhala"); h.add("end_stop_name_tamil");
        }
        h.add("start_stop_latitude"); h.add("start_stop_longitude");
        h.add("start_stop_address"); h.add("start_stop_city");
        h.add("end_stop_latitude"); h.add("end_stop_longitude");
        h.add("end_stop_address"); h.add("end_stop_city");
        h.add("route_distance_km"); h.add("route_estimated_duration_minutes"); h.add("route_direction");
        if (Boolean.TRUE.equals(request.getIncludeAuditFields())) {
            h.add("route_created_at"); h.add("route_updated_at");
            h.add("route_created_by"); h.add("route_updated_by");
        }
        return h;
    }

    private List<String> buildRouteWithAllStopsCsvHeaders(RouteExportRequest request) {
        List<String> h = new ArrayList<>();
        h.add("route_id"); h.add("route_name");
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            h.add("route_name_sinhala"); h.add("route_name_tamil");
        }
        h.add("route_number"); h.add("route_description"); h.add("road_type"); h.add("route_through");
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            h.add("route_through_sinhala"); h.add("route_through_tamil");
        }
        if (Boolean.TRUE.equals(request.getIncludeRouteGroupInfo())) {
            h.add("route_group_id"); h.add("route_group_name");
            if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
                h.add("route_group_name_sinhala"); h.add("route_group_name_tamil");
            }
        }
        h.add("route_stop_id"); h.add("stop_id"); h.add("stop_name");
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            h.add("stop_name_sinhala"); h.add("stop_name_tamil");
        }
        h.add("stop_order"); h.add("distance_from_start_km"); h.add("stop_type");
        h.add("stop_latitude"); h.add("stop_longitude"); h.add("stop_address"); h.add("stop_city");
        h.add("route_distance_km"); h.add("route_estimated_duration_minutes"); h.add("route_direction");
        if (Boolean.TRUE.equals(request.getIncludeAuditFields())) {
            h.add("route_created_at"); h.add("route_updated_at");
            h.add("route_created_by"); h.add("route_updated_by");
        }
        return h;
    }

    private List<String> buildRouteOnlyRowData(Route route, RouteExportRequest request,
                                               DateTimeFormatter formatter) {
        List<String> r = new ArrayList<>();
        r.add(csv(route.getId().toString())); r.add(csv(route.getName()));
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            r.add(csv(route.getNameSinhala())); r.add(csv(route.getNameTamil()));
        }
        r.add(csv(route.getRouteNumber())); r.add(csv(route.getDescription()));
        r.add(csv(route.getRoadType() != null ? route.getRoadType().name() : ""));
        r.add(csv(route.getRouteThrough()));
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            r.add(csv(route.getRouteThroughSinhala())); r.add(csv(route.getRouteThroughTamil()));
        }
        if (Boolean.TRUE.equals(request.getIncludeRouteGroupInfo())) {
            r.add(csv(route.getRouteGroup() != null ? route.getRouteGroup().getId().toString() : ""));
            r.add(csv(route.getRouteGroup() != null ? route.getRouteGroup().getName() : ""));
            if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
                r.add(csv(route.getRouteGroup() != null ? route.getRouteGroup().getNameSinhala() : ""));
                r.add(csv(route.getRouteGroup() != null ? route.getRouteGroup().getNameTamil() : ""));
            }
        }

        List<RouteStop> rStops = routeStopRepository.findByRouteIdOrderByStopOrder(route.getId());
        RouteStop startRS = rStops.stream()
                .filter(rs -> rs.getStop().getId().equals(route.getStartStopId())).findFirst().orElse(null);
        RouteStop endRS = rStops.stream()
                .filter(rs -> rs.getStop().getId().equals(route.getEndStopId())).findFirst().orElse(null);

        r.add(csv(startRS != null ? startRS.getId().toString() : ""));
        r.add(csv(route.getStartStopId() != null ? route.getStartStopId().toString() : ""));
        r.add(csv(endRS != null ? endRS.getId().toString() : ""));
        r.add(csv(route.getEndStopId() != null ? route.getEndStopId().toString() : ""));

        Stop startStop = route.getStartStop();
        Stop endStop = route.getEndStop();

        r.add(csv(startStop != null ? startStop.getName() : ""));
        r.add(csv(endStop != null ? endStop.getName() : ""));
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            r.add(csv(startStop != null ? startStop.getNameSinhala() : ""));
            r.add(csv(startStop != null ? startStop.getNameTamil() : ""));
            r.add(csv(endStop != null ? endStop.getNameSinhala() : ""));
            r.add(csv(endStop != null ? endStop.getNameTamil() : ""));
        }

        appendStopLocation(r, startStop);
        appendStopLocation(r, endStop);

        r.add(csv(route.getDistanceKm() != null ? route.getDistanceKm().toString() : ""));
        r.add(csv(route.getEstimatedDurationMinutes() != null ? route.getEstimatedDurationMinutes().toString() : ""));
        r.add(csv(route.getDirection() != null ? route.getDirection().name() : ""));
        if (Boolean.TRUE.equals(request.getIncludeAuditFields())) {
            r.add(csv(route.getCreatedAt() != null ? route.getCreatedAt().format(formatter) : ""));
            r.add(csv(route.getUpdatedAt() != null ? route.getUpdatedAt().format(formatter) : ""));
            r.add(csv(route.getCreatedBy())); r.add(csv(route.getUpdatedBy()));
        }
        return r;
    }

    private List<String> buildRouteWithStopRowData(Route route, RouteStop routeStop, String stopType,
                                                   RouteExportRequest request, DateTimeFormatter formatter) {
        List<String> r = new ArrayList<>();
        r.add(csv(route.getId().toString())); r.add(csv(route.getName()));
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            r.add(csv(route.getNameSinhala())); r.add(csv(route.getNameTamil()));
        }
        r.add(csv(route.getRouteNumber())); r.add(csv(route.getDescription()));
        r.add(csv(route.getRoadType() != null ? route.getRoadType().name() : ""));
        r.add(csv(route.getRouteThrough()));
        if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
            r.add(csv(route.getRouteThroughSinhala())); r.add(csv(route.getRouteThroughTamil()));
        }
        if (Boolean.TRUE.equals(request.getIncludeRouteGroupInfo())) {
            r.add(csv(route.getRouteGroup() != null ? route.getRouteGroup().getId().toString() : ""));
            r.add(csv(route.getRouteGroup() != null ? route.getRouteGroup().getName() : ""));
            if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
                r.add(csv(route.getRouteGroup() != null ? route.getRouteGroup().getNameSinhala() : ""));
                r.add(csv(route.getRouteGroup() != null ? route.getRouteGroup().getNameTamil() : ""));
            }
        }

        if (routeStop != null && routeStop.getStop() != null) {
            Stop stop = routeStop.getStop();
            r.add(csv(routeStop.getId().toString())); r.add(csv(stop.getId().toString()));
            r.add(csv(stop.getName()));
            if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) {
                r.add(csv(stop.getNameSinhala())); r.add(csv(stop.getNameTamil()));
            }
            r.add(csv(routeStop.getStopOrder().toString()));
            r.add(csv(routeStop.getDistanceFromStartKm() != null ? routeStop.getDistanceFromStartKm().toString() : ""));
            r.add(csv(stopType));
            appendStopLocation(r, stop);
        } else {
            r.add(""); r.add(""); r.add("");
            if (Boolean.TRUE.equals(request.getIncludeMultiLanguageFields())) { r.add(""); r.add(""); }
            r.add(""); r.add(""); r.add(csv(stopType));
            r.add(""); r.add(""); r.add(""); r.add("");
        }

        r.add(csv(route.getDistanceKm() != null ? route.getDistanceKm().toString() : ""));
        r.add(csv(route.getEstimatedDurationMinutes() != null ? route.getEstimatedDurationMinutes().toString() : ""));
        r.add(csv(route.getDirection() != null ? route.getDirection().name() : ""));
        if (Boolean.TRUE.equals(request.getIncludeAuditFields())) {
            r.add(csv(route.getCreatedAt() != null ? route.getCreatedAt().format(formatter) : ""));
            r.add(csv(route.getUpdatedAt() != null ? route.getUpdatedAt().format(formatter) : ""));
            r.add(csv(route.getCreatedBy())); r.add(csv(route.getUpdatedBy()));
        }
        return r;
    }

    private void appendStopLocation(List<String> row, Stop stop) {
        if (stop != null && stop.getLocation() != null) {
            Stop.Location loc = stop.getLocation();
            row.add(csv(loc.getLatitude() != null ? loc.getLatitude().toString() : ""));
            row.add(csv(loc.getLongitude() != null ? loc.getLongitude().toString() : ""));
            row.add(csv(loc.getAddress())); row.add(csv(loc.getCity()));
        } else {
            row.add(""); row.add(""); row.add(""); row.add("");
        }
    }

    private String determineStopType(RouteStop routeStop, Route route) {
        if (routeStop.getStop().getId().equals(route.getStartStopId())) return "start";
        if (routeStop.getStop().getId().equals(route.getEndStopId())) return "end";
        return "intermediate";
    }

    private String csv(String value) {
        if (value == null) return "";
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

        RouteExportResponse.FilterSummary fs = new RouteExportResponse.FilterSummary();
        fs.setExportedAll(Boolean.TRUE.equals(request.getExportAll()));
        fs.setSpecificRouteIds(request.getRouteIds() != null ? request.getRouteIds().size() : 0);
        fs.setRouteGroupIds(request.getRouteGroupIds() != null ? request.getRouteGroupIds().size() : 0);
        fs.setStartStopIds(request.getStartStopIds() != null ? request.getStartStopIds().size() : 0);
        fs.setEndStopIds(request.getEndStopIds() != null ? request.getEndStopIds().size() : 0);
        fs.setTravelsThroughStops(request.getTravelsThroughStopIds() != null ? request.getTravelsThroughStopIds().size() : 0);
        fs.setDirections(request.getDirections());
        fs.setRoadTypes(request.getRoadTypes());
        fs.setMinDistanceKm(request.getMinDistanceKm());
        fs.setMaxDistanceKm(request.getMaxDistanceKm());
        fs.setMinDurationMinutes(request.getMinDurationMinutes());
        fs.setMaxDurationMinutes(request.getMaxDurationMinutes());
        fs.setSearchText(request.getSearchText());
        metadata.setFiltersApplied(fs);

        RouteExportResponse.ExportOptions opts = new RouteExportResponse.ExportOptions();
        opts.setExportMode(request.getExportMode().name());
        opts.setIncludeMultiLanguageFields(request.getIncludeMultiLanguageFields());
        opts.setIncludeRouteGroupInfo(request.getIncludeRouteGroupInfo());
        opts.setIncludeAuditFields(request.getIncludeAuditFields());
        opts.setCustomFields(request.getCustomFields());
        metadata.setOptionsUsed(opts);

        response.setMetadata(metadata);
    }
}
