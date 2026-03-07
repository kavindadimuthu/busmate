package com.busmate.routeschedule.network.service.impl;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.busmate.routeschedule.network.dto.request.StopBulkUpdateRequest;
import com.busmate.routeschedule.network.dto.request.StopExportRequest;
import com.busmate.routeschedule.network.dto.request.StopRequest;
import com.busmate.routeschedule.network.dto.response.StopBulkUpdateResponse;
import com.busmate.routeschedule.network.dto.response.StopExportResponse;
import com.busmate.routeschedule.network.dto.response.StopImportResponse;
import com.busmate.routeschedule.network.dto.response.StopResponse;
import com.busmate.routeschedule.network.entity.Stop;
import com.busmate.routeschedule.network.repository.StopRepository;
import com.busmate.routeschedule.network.service.StopImportExportService;
import com.busmate.routeschedule.shared.dto.LocationDto;
import com.busmate.routeschedule.shared.util.MapperUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementation of {@link StopImportExportService}.
 *
 * <p>All bulk data-movement logic (CSV import, JSON/CSV export, bulk update) has been
 * extracted here from {@code StopServiceImpl} to keep the core service class small and focused.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StopImportExportServiceImpl implements StopImportExportService {

    private final StopRepository stopRepository;
    private final MapperUtils mapperUtils;

    // ════════════════════════════════ IMPORT ════════════════════════════════

    @Override
    @Transactional
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

            String[] headers = firstLine.split(",");
            Map<String, Integer> fieldMapping = createFieldMapping(headers);

            if (!hasRequiredFields(fieldMapping)) {
                throw new IllegalArgumentException(
                        "CSV must contain at least one name field (name, stop_name, name_sinhala, or name_tamil)");
            }

            log.info("Detected CSV fields: {}", fieldMapping.keySet());

            String line;
            int rowNumber = 1;

            while ((line = reader.readLine()) != null) {
                rowNumber++;
                totalRecords++;

                if (line.trim().isEmpty()) continue;

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
            error.setSuggestion(
                    "Ensure the file is a valid CSV with at least a name column. Supported fields: "
                    + "name, name_sinhala, name_tamil, description, latitude, longitude, address, "
                    + "city, state, zipCode, country, isAccessible");
            errors.add(error);
        }

        response.setTotalRecords(totalRecords);
        response.setSuccessfulImports(successfulImports);
        response.setFailedImports(failedImports);
        response.setErrors(errors);
        response.setImportedStops(importedStops);
        response.setMessage(String.format(
                "Import completed. %d successful, %d failed out of %d total records. %d stops imported with UUIDs.",
                successfulImports, failedImports, totalRecords, importedStops.size()));

        log.info("Stop import completed. Success: {}, Failed: {}, Total: {}",
                successfulImports, failedImports, totalRecords);

        return response;
    }

    /** Creates a dynamic field→column-index mapping from the CSV header row. */
    private Map<String, Integer> createFieldMapping(String[] headers) {
        Map<String, Integer> fieldMapping = new LinkedHashMap<>();

        for (int i = 0; i < headers.length; i++) {
            String header = headers[i].trim().toLowerCase();

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

    private boolean hasRequiredFields(Map<String, Integer> fieldMapping) {
        return fieldMapping.containsKey("name")
                || fieldMapping.containsKey("name_sinhala")
                || fieldMapping.containsKey("name_tamil");
    }

    private void processDynamicRow(String[] columns, Map<String, Integer> fieldMapping, int rowNumber,
                                   String userId, String defaultCountry,
                                   List<StopImportResponse.ImportedStop> importedStops) {

        String name = getFieldValue(columns, fieldMapping, "name");
        String nameSinhala = getFieldValue(columns, fieldMapping, "name_sinhala");
        String nameTamil = getFieldValue(columns, fieldMapping, "name_tamil");
        String description = getFieldValue(columns, fieldMapping, "description");
        String originalStopId = getFieldValue(columns, fieldMapping, "original_stop_id");

        String primaryName = name != null && !name.isEmpty() ? name
                : nameSinhala != null && !nameSinhala.isEmpty() ? nameSinhala
                : nameTamil;

        if (primaryName == null || primaryName.trim().isEmpty()) {
            throw new IllegalArgumentException("At least one name field is required");
        }

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

        String cityToCheck = city != null && !city.isEmpty() ? city
                : citySinhala != null && !citySinhala.isEmpty() ? citySinhala
                : cityTamil;

        if (stopRepository.existsByAnyNameVariantAndAnyCity(name, nameSinhala, nameTamil, cityToCheck)) {
            throw new IllegalArgumentException("Stop already exists: " + primaryName
                    + (cityToCheck != null ? " in " + cityToCheck : ""));
        }

        Double latitude = null;
        Double longitude = null;
        if (latitudeStr != null && !latitudeStr.isEmpty() && longitudeStr != null && !longitudeStr.isEmpty()) {
            try {
                latitude = Double.parseDouble(latitudeStr);
                longitude = Double.parseDouble(longitudeStr);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException(
                        "Invalid latitude or longitude format: " + latitudeStr + ", " + longitudeStr);
            }
        }

        Boolean isAccessible = isAccessibleStr != null && !isAccessibleStr.isEmpty()
                ? Boolean.parseBoolean(isAccessibleStr) : true;

        if (country == null || country.isEmpty()) {
            country = defaultCountry;
        }

        Stop stop = new Stop();
        stop.setName(name);
        stop.setNameSinhala(nameSinhala);
        stop.setNameTamil(nameTamil);
        stop.setDescription(description);
        stop.setIsAccessible(isAccessible);

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

        stop.setCreatedBy(userId);
        stop.setUpdatedBy(userId);

        Stop savedStop = stopRepository.save(stop);

        StopImportResponse.ImportedStop importedStop = new StopImportResponse.ImportedStop();
        importedStop.setId(savedStop.getId());
        importedStop.setName(primaryName);
        importedStop.setOriginalStopId(originalStopId);
        importedStop.setRowNumber(rowNumber);
        importedStops.add(importedStop);

        log.debug("Successfully imported dynamic stop: {} with ID: {}", primaryName, savedStop.getId());
    }

    private String getFieldValue(String[] columns, Map<String, Integer> fieldMapping, String fieldName) {
        Integer index = fieldMapping.get(fieldName);
        if (index == null || index >= columns.length) return null;
        String value = columns[index].trim();
        return value.isEmpty() ? null : value;
    }

    // ════════════════════════════════ EXPORT ════════════════════════════════

    @Override
    public StopExportResponse exportStops(StopExportRequest request, String userId) {
        log.info("Starting stops export for user: {}, request: {}", userId, request);

        try {
            List<Stop> stops = getFilteredStops(request);
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
                request.getSearchText());
    }

    private void generateCSVExport(List<Stop> stops, StopExportRequest request,
                                   StopExportResponse response, String userId) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8))) {
            writer.println(String.join(",", buildCSVHeaders(request)));
            for (Stop stop : stops) {
                writer.println(String.join(",", buildCSVRow(stop, request).stream()
                        .map(this::escapeCsvField)
                        .collect(Collectors.toList())));
            }
            writer.flush();
        }
        response.setContent(baos.toByteArray());
        response.setContentType("text/csv");
        response.setFileName(generateFileName(request, "csv"));
        response.setMetadata(buildExportMetadata(stops, request, userId));
    }

    private void generateJSONExport(List<Stop> stops, StopExportRequest request,
                                    StopExportResponse response, String userId) throws Exception {
        List<StopResponse> stopResponses = stops.stream()
                .map(stop -> mapperUtils.map(stop, StopResponse.class))
                .collect(Collectors.toList());

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
        if (field == null) return "";
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
        if (value == null) return "null";
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

        StopExportResponse.FilterSummary filterSummary = new StopExportResponse.FilterSummary();
        filterSummary.setExportedAll(Boolean.TRUE.equals(request.getExportAll()));
        filterSummary.setSpecificStopIds(request.getStopIds() != null ? request.getStopIds().size() : 0);
        filterSummary.setCities(request.getCities());
        filterSummary.setStates(request.getStates());
        filterSummary.setCountries(request.getCountries());
        filterSummary.setAccessibilityFilter(request.getIsAccessible());
        filterSummary.setSearchText(request.getSearchText());
        metadata.setFiltersApplied(filterSummary);

        StopExportResponse.ExportOptions exportOptions = new StopExportResponse.ExportOptions();
        exportOptions.setIncludeMultiLanguageFields(request.getIncludeMultiLanguageFields());
        exportOptions.setIncludeLocationDetails(request.getIncludeLocationDetails());
        exportOptions.setIncludeTimestamps(request.getIncludeTimestamps());
        exportOptions.setIncludeUserInfo(request.getIncludeUserInfo());
        exportOptions.setCustomFields(request.getCustomFields());
        metadata.setOptionsUsed(exportOptions);

        return metadata;
    }

    // ═══════════════════════════ BULK UPDATE ════════════════════════════════

    @Override
    @Transactional
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

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(csvFile.getInputStream(), StandardCharsets.UTF_8))) {

            String headerLine = reader.readLine();
            if (headerLine == null) throw new RuntimeException("CSV file is empty");

            String[] headers = headerLine.split(",");
            Map<String, Integer> fieldMapping = createFieldMapping(headers);
            boolean hasIdField = fieldMapping.containsKey("original_stop_id") || fieldMapping.containsKey("id");

            String line;
            int rowNumber = 1;

            while ((line = reader.readLine()) != null) {
                rowNumber++;
                totalRowsProcessed++;

                try {
                    String[] columns = parseCsvLine(line);
                    if (columns.length == 0) continue;

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

        StopBulkUpdateResponse.UpdateSummary summary = new StopBulkUpdateResponse.UpdateSummary();
        summary.setTotalRowsProcessed(totalRowsProcessed);
        summary.setSuccessfulUpdates(successfulUpdates);
        summary.setSuccessfulCreations(successfulCreations);
        summary.setSkippedRows(skippedRows);
        summary.setErrorRows(errorRows);
        summary.setSuccessRate(totalRowsProcessed > 0
                ? ((double) (successfulUpdates + successfulCreations) / totalRowsProcessed) * 100.0 : 0.0);
        response.setSummary(summary);

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
                                                   int rowNumber, String userId, StopBulkUpdateRequest request,
                                                   boolean hasIdField) {
        BulkUpdateResult result = new BulkUpdateResult();
        result.setRowNumber(rowNumber);

        try {
            String stopId = getFieldValue(columns, fieldMapping, "original_stop_id");
            if (stopId == null) stopId = getFieldValue(columns, fieldMapping, "id");
            String stopName = getFieldValue(columns, fieldMapping, "name");
            String cityName = getFieldValue(columns, fieldMapping, "city");

            result.setStopIdentifier(stopId != null ? stopId : (stopName + " (" + cityName + ")"));

            Stop existingStop = findExistingStop(stopId, stopName, cityName, request.getMatchingStrategy(), hasIdField);

            if (existingStop == null) {
                if (request.getCreateMissing()) {
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
                        return stopRepository.findById(UUID.fromString(stopId)).orElse(null);
                    } catch (Exception e) {
                        log.warn("Invalid UUID format for stop ID: {}", stopId);
                    }
                }
                return null;

            case NAME_AND_CITY:
                if (stopName != null && cityName != null) {
                    return stopRepository.findAll().stream()
                            .filter(s -> matchesByNameAndCity(s, stopName, cityName))
                            .findFirst()
                            .orElse(null);
                }
                return null;

            case AUTO:
            default:
                Stop stop = findExistingStop(stopId, stopName, cityName, StopBulkUpdateRequest.MatchingStrategy.ID, hasIdField);
                if (stop == null) {
                    stop = findExistingStop(stopId, stopName, cityName, StopBulkUpdateRequest.MatchingStrategy.NAME_AND_CITY, hasIdField);
                }
                return stop;
        }
    }

    private boolean matchesByNameAndCity(Stop stop, String csvName, String csvCity) {
        return matchesName(stop, csvName) && matchesCity(stop, csvCity);
    }

    private boolean matchesName(Stop stop, String csvName) {
        if (csvName == null) return false;
        String lower = csvName.toLowerCase().trim();
        return (stop.getName() != null && stop.getName().toLowerCase().trim().equals(lower))
                || (stop.getNameSinhala() != null && stop.getNameSinhala().toLowerCase().trim().equals(lower))
                || (stop.getNameTamil() != null && stop.getNameTamil().toLowerCase().trim().equals(lower));
    }

    private boolean matchesCity(Stop stop, String csvCity) {
        if (csvCity == null || stop.getLocation() == null) return false;
        String lower = csvCity.toLowerCase().trim();
        return (stop.getLocation().getCity() != null && stop.getLocation().getCity().toLowerCase().trim().equals(lower))
                || (stop.getLocation().getCitySinhala() != null && stop.getLocation().getCitySinhala().toLowerCase().trim().equals(lower))
                || (stop.getLocation().getCityTamil() != null && stop.getLocation().getCityTamil().toLowerCase().trim().equals(lower));
    }

    private Stop createStopFromCsvRow(String[] columns, Map<String, Integer> fieldMapping,
                                       String userId, StopBulkUpdateRequest request) {
        StopRequest stopRequest = buildStopRequestFromCsv(columns, fieldMapping, request);
        Stop stop = mapperUtils.map(stopRequest, Stop.class);
        stop.setCreatedBy(userId);
        stop.setUpdatedBy(userId);
        return stopRepository.save(stop);
    }

    private List<String> updateStopFromCsvRow(Stop existingStop, String[] columns,
                                               Map<String, Integer> fieldMapping,
                                               String userId, StopBulkUpdateRequest request) {
        List<String> updatedFields = new ArrayList<>();

        updateStringField(existingStop::setName, existingStop.getName(),
                getFieldValue(columns, fieldMapping, "name"), "name", updatedFields, request.getPartialUpdate());
        updateStringField(existingStop::setNameSinhala, existingStop.getNameSinhala(),
                getFieldValue(columns, fieldMapping, "name_sinhala"), "nameSinhala", updatedFields, request.getPartialUpdate());
        updateStringField(existingStop::setNameTamil, existingStop.getNameTamil(),
                getFieldValue(columns, fieldMapping, "name_tamil"), "nameTamil", updatedFields, request.getPartialUpdate());
        updateStringField(existingStop::setDescription, existingStop.getDescription(),
                getFieldValue(columns, fieldMapping, "description"), "description", updatedFields, request.getPartialUpdate());

        if (existingStop.getLocation() != null) {
            updateLocationField(existingStop.getLocation(), columns, fieldMapping, updatedFields, request);
        }

        String accessibleStr = getFieldValue(columns, fieldMapping, "isAccessible");
        if (!request.getPartialUpdate() || (accessibleStr != null && !accessibleStr.trim().isEmpty())) {
            Boolean newAccessible = parseBoolean(accessibleStr);
            if (!java.util.Objects.equals(existingStop.getIsAccessible(), newAccessible)) {
                existingStop.setIsAccessible(newAccessible);
                updatedFields.add("isAccessible");
            }
        }

        if (!updatedFields.isEmpty()) {
            existingStop.setUpdatedBy(userId);
        }

        return updatedFields;
    }

    private void updateStringField(java.util.function.Consumer<String> setter, String currentValue,
                                   String newValue, String fieldName, List<String> updatedFields,
                                   boolean partialUpdate) {
        if (!partialUpdate || (newValue != null && !newValue.trim().isEmpty())) {
            if (!java.util.Objects.equals(currentValue, newValue)) {
                setter.accept(newValue);
                updatedFields.add(fieldName);
            }
        }
    }

    private void updateLocationField(Stop.Location location, String[] columns,
                                     Map<String, Integer> fieldMapping, List<String> updatedFields,
                                     StopBulkUpdateRequest request) {
        updateStringField(location::setAddress, location.getAddress(),
                getFieldValue(columns, fieldMapping, "address"), "address", updatedFields, request.getPartialUpdate());
        updateStringField(location::setAddressSinhala, location.getAddressSinhala(),
                getFieldValue(columns, fieldMapping, "address_sinhala"), "addressSinhala", updatedFields, request.getPartialUpdate());
        updateStringField(location::setAddressTamil, location.getAddressTamil(),
                getFieldValue(columns, fieldMapping, "address_tamil"), "addressTamil", updatedFields, request.getPartialUpdate());
        updateStringField(location::setCity, location.getCity(),
                getFieldValue(columns, fieldMapping, "city"), "city", updatedFields, request.getPartialUpdate());
        updateStringField(location::setCitySinhala, location.getCitySinhala(),
                getFieldValue(columns, fieldMapping, "city_sinhala"), "citySinhala", updatedFields, request.getPartialUpdate());
        updateStringField(location::setCityTamil, location.getCityTamil(),
                getFieldValue(columns, fieldMapping, "city_tamil"), "cityTamil", updatedFields, request.getPartialUpdate());
        updateStringField(location::setState, location.getState(),
                getFieldValue(columns, fieldMapping, "state"), "state", updatedFields, request.getPartialUpdate());
        updateStringField(location::setStateSinhala, location.getStateSinhala(),
                getFieldValue(columns, fieldMapping, "state_sinhala"), "stateSinhala", updatedFields, request.getPartialUpdate());
        updateStringField(location::setStateTamil, location.getStateTamil(),
                getFieldValue(columns, fieldMapping, "state_tamil"), "stateTamil", updatedFields, request.getPartialUpdate());
        updateStringField(location::setCountry, location.getCountry(),
                getFieldValue(columns, fieldMapping, "country"), "country", updatedFields, request.getPartialUpdate());
        updateStringField(location::setCountrySinhala, location.getCountrySinhala(),
                getFieldValue(columns, fieldMapping, "country_sinhala"), "countrySinhala", updatedFields, request.getPartialUpdate());
        updateStringField(location::setCountryTamil, location.getCountryTamil(),
                getFieldValue(columns, fieldMapping, "country_tamil"), "countryTamil", updatedFields, request.getPartialUpdate());
        updateStringField(location::setZipCode, location.getZipCode(),
                getFieldValue(columns, fieldMapping, "zipCode"), "zipCode", updatedFields, request.getPartialUpdate());

        String latStr = getFieldValue(columns, fieldMapping, "latitude");
        String lngStr = getFieldValue(columns, fieldMapping, "longitude");

        if (!request.getPartialUpdate() || (latStr != null && !latStr.trim().isEmpty())) {
            try {
                Double newLat = (latStr != null && !latStr.trim().isEmpty()) ? Double.parseDouble(latStr) : null;
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
                Double newLng = (lngStr != null && !lngStr.trim().isEmpty()) ? Double.parseDouble(lngStr) : null;
                if (!java.util.Objects.equals(location.getLongitude(), newLng)) {
                    location.setLongitude(newLng);
                    updatedFields.add("longitude");
                }
            } catch (NumberFormatException e) {
                log.warn("Invalid longitude format: {}", lngStr);
            }
        }
    }

    private StopRequest buildStopRequestFromCsv(String[] columns, Map<String, Integer> fieldMapping,
                                                 StopBulkUpdateRequest request) {
        StopRequest stopRequest = new StopRequest();
        stopRequest.setName(getFieldValue(columns, fieldMapping, "name"));
        stopRequest.setNameSinhala(getFieldValue(columns, fieldMapping, "name_sinhala"));
        stopRequest.setNameTamil(getFieldValue(columns, fieldMapping, "name_tamil"));
        stopRequest.setDescription(getFieldValue(columns, fieldMapping, "description"));

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

        String latStr = getFieldValue(columns, fieldMapping, "latitude");
        String lngStr = getFieldValue(columns, fieldMapping, "longitude");
        try {
            if (latStr != null && !latStr.trim().isEmpty()) locationDto.setLatitude(Double.parseDouble(latStr));
            if (lngStr != null && !lngStr.trim().isEmpty()) locationDto.setLongitude(Double.parseDouble(lngStr));
        } catch (NumberFormatException e) {
            log.warn("Invalid coordinate format: lat={}, lng={}", latStr, lngStr);
        }

        if (locationDto.getCountry() == null && request.getDefaultCountry() != null) {
            locationDto.setCountry(request.getDefaultCountry());
        }

        stopRequest.setLocation(locationDto);
        stopRequest.setIsAccessible(parseBoolean(getFieldValue(columns, fieldMapping, "isAccessible")));

        return stopRequest;
    }

    private Boolean parseBoolean(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        String lower = value.toLowerCase().trim();
        return "true".equals(lower) || "yes".equals(lower) || "1".equals(lower) || "y".equals(lower);
    }

    private String[] parseCsvLine(String line) {
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
        errorRecord.setCsvData(Arrays.asList(columns));
        response.getErrorRecords().add(errorRecord);
    }

    private void addErrorRecord(StopBulkUpdateResponse response, int rowNumber, String errorType,
                                 String errorMessage, String csvLine) {
        StopBulkUpdateResponse.ErrorRecord errorRecord = new StopBulkUpdateResponse.ErrorRecord();
        errorRecord.setRowNumber(rowNumber);
        errorRecord.setErrorType(errorType);
        errorRecord.setErrorMessage(errorMessage);
        errorRecord.setStopIdentifier("Row " + rowNumber);
        errorRecord.setCsvData(Arrays.asList(csvLine.split(",")));
        response.getErrorRecords().add(errorRecord);
    }

    // ─────────────────────────── Inner helpers ───────────────────────────────

    private static class BulkUpdateResult {
        private int rowNumber;
        private BulkUpdateStatus status;
        private Stop stop;
        private String stopIdentifier;
        private String reason;
        private String errorMessage;
        private String matchedBy;
        private List<String> updatedFields;

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
        SUCCESS_UPDATED, SUCCESS_CREATED, SKIPPED, ERROR
    }
}
