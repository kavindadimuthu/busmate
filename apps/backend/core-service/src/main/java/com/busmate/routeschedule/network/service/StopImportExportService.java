package com.busmate.routeschedule.network.service;

import org.springframework.web.multipart.MultipartFile;

import com.busmate.routeschedule.network.dto.request.StopBulkUpdateRequest;
import com.busmate.routeschedule.network.dto.request.StopExportRequest;
import com.busmate.routeschedule.network.dto.response.StopBulkUpdateResponse;
import com.busmate.routeschedule.network.dto.response.StopExportResponse;
import com.busmate.routeschedule.network.dto.response.StopImportResponse;

/**
 * Service contract for Stop import, export, and bulk-update operations.
 *
 * <p>These methods have been extracted from {@link StopService} to keep that interface
 * focused on core CRUD concerns while this interface groups the heavier
 * data-movement responsibilities together.
 */
public interface StopImportExportService {

    /**
     * Imports stops from a CSV file.  Supports multiple header formats via dynamic field mapping.
     *
     * @param file          the uploaded CSV file
     * @param userId        the authenticated user performing the import
     * @param defaultCountry country value to apply when the CSV row omits it
     * @return a detailed import result report
     */
    StopImportResponse importStops(MultipartFile file, String userId, String defaultCountry);

    /**
     * Exports stops to CSV or JSON based on the supplied request filters and options.
     *
     * @param request export configuration (format, filters, fields to include)
     * @param userId  the authenticated user performing the export
     * @return export result containing binary content and metadata
     */
    StopExportResponse exportStops(StopExportRequest request, String userId);

    /**
     * Performs a bulk update of stops from a CSV file, with configurable matching and
     * update strategies (update existing, create missing, skip conflicts, etc.).
     *
     * @param csvFile the uploaded CSV file
     * @param request bulk-update configuration
     * @param userId  the authenticated user performing the update
     * @return a detailed result report per processed row
     */
    StopBulkUpdateResponse bulkUpdateStops(MultipartFile csvFile, StopBulkUpdateRequest request, String userId);
}
