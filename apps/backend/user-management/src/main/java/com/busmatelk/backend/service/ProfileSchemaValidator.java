package com.busmatelk.backend.service;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class ProfileSchemaValidator {

    private static final Map<String, List<String>> REQUIRED_FIELDS = Map.of(
        "conductor",  List.of("employee_id", "assign_operator_id", "nic_number"),
        "operator",   List.of("organization_name", "registration_id"),
        "timekeeper", List.of("assign_stand", "nic"),
        "mot",        List.of("employee_id")
    );

    /**
     * Validates the fully-merged profile data (not just the incoming patch) — a partial
     * update is fine as long as the required fields are present once merged with what's
     * already stored. User types with no entry here (admin, passenger) have no required fields.
     */
    public void validate(String userTypeName, Map<String, Object> mergedProfileData) {
        List<String> required = REQUIRED_FIELDS.get(userTypeName);
        if (required == null) {
            return;
        }

        List<String> missing = required.stream()
                .filter(field -> mergedProfileData.get(field) == null)
                .collect(Collectors.toList());

        if (!missing.isEmpty()) {
            throw new IllegalArgumentException(
                    "Missing required profile fields for " + userTypeName + ": " + missing);
        }
    }
}
