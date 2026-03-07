package com.busmate.routeschedule.network.service;

import org.springframework.web.multipart.MultipartFile;

import com.busmate.routeschedule.network.dto.request.RouteExportRequest;
import com.busmate.routeschedule.network.dto.request.RouteUnifiedImportRequest;
import com.busmate.routeschedule.network.dto.response.RouteExportResponse;
import com.busmate.routeschedule.network.dto.response.RouteUnifiedImportResponse;

/**
 * Service contract for Route import and export operations.
 *
 * <p>These methods have been extracted from {@link RouteService} to keep that interface
 * focused on core CRUD and query concerns while this interface groups the heavier
 * data-movement responsibilities together.
 */
public interface RouteImportExportService {

    /**
     * Performs a unified CSV import that creates or reuses route groups, routes, and route stops
     * in a single pass.  Duplicate handling is governed by strategies defined in the request.
     *
     * @param file          the uploaded CSV file (23-column format)
     * @param importRequest configuration including duplicate strategies and continue-on-error flag
     * @param userId        the authenticated user performing the import
     * @return a detailed import result with per-row success/failure information
     */
    RouteUnifiedImportResponse importRoutesUnified(MultipartFile file, RouteUnifiedImportRequest importRequest, String userId);

    /**
     * Exports routes to CSV or JSON based on the supplied request filters and options.
     * Supports ROUTE_ONLY mode (one row per route) and ROUTE_WITH_ALL_STOPS mode.
     *
     * @param request export configuration (format, mode, filters, fields to include)
     * @param userId  the authenticated user performing the export
     * @return export result containing binary content and metadata
     */
    RouteExportResponse exportRoutes(RouteExportRequest request, String userId);
}
