'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSetPageMetadata } from '@/context/PageContext';
import { CSVEditor } from '@/components/tools/csv-editor';
import { ROUTE_VALIDATION_RULES } from '@/components/tools/csv-editor';
import { CSVData } from '@/components/tools/csv-editor/types';
import { useToast } from '@/hooks/use-toast';
import { RouteManagementService } from '../../../../../generated/api-clients/route-management';

function RoutesImportPage() {
    const router = useRouter();
    const { toast } = useToast();

    useSetPageMetadata({
        title: 'Import Routes',
        description: 'Import routes data in bulk',
        activeItem: 'routes',
        showBreadcrumbs: true,
        breadcrumbs: [{ label: 'Routes', href: '/mot/routes' }, { label: 'Import' }],
    });

    // Handle route template download
    const handleTemplateDownload = useCallback(async (format: string) => {
        try {
            const templateContent = await RouteManagementService.downloadUnifiedRouteImportTemplate();
            
            // Create and download the file
            const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `routes-template-${format}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Template download error:', error);
            throw new Error('Failed to download template');
        }
    }, []);

    // Handle route data import
    const handleImport = useCallback(async (data: CSVData, options?: any) => {
        try {
            // Convert CSV data to CSV file content
            const headers = data.headers.join(',');
            const rows = data.rows.map(row => 
                data.headers.map(header => {
                    const value = row[header];
                    if (value === null || value === undefined) return '';
                    if (typeof value === 'string' && value.includes(',')) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return String(value);
                }).join(',')
            );
            const csvContent = [headers, ...rows].join('\n');

            // Create blob for upload
            const blob = new Blob([csvContent], { type: 'text/csv' });
            
            // Use the RouteManagementService.importRoutesUnified with configurable options
            const importOptions = {
                routeGroupDuplicateStrategy: options?.routeGroupDuplicateStrategy || 'REUSE',
                routeDuplicateStrategy: options?.routeDuplicateStrategy || 'SKIP',
                validateStopsExist: options?.validateStopsExist ?? true,
                createMissingStops: options?.createMissingStops ?? false,
                allowPartialRouteStops: options?.allowPartialRouteStops ?? true,
                validateCoordinates: options?.validateCoordinates ?? false,
                continueOnError: options?.continueOnError ?? true,
                defaultRoadType: options?.defaultRoadType || 'NORMALWAY',
                ...options
            };

            const result = await RouteManagementService.importRoutesUnified(
                importOptions.routeGroupDuplicateStrategy,
                importOptions.routeDuplicateStrategy,
                importOptions.validateStopsExist,
                importOptions.createMissingStops,
                importOptions.allowPartialRouteStops,
                importOptions.validateCoordinates,
                importOptions.continueOnError,
                importOptions.defaultRoadType,
                { file: blob }
            );

            return result;
        } catch (error) {
            console.error('Routes import error:', error);
            throw error;
        }
    }, []);

    const handleImportComplete = useCallback((result: any) => {
        const { successfulImports = 0, failedImports = 0, totalRecords = 0, skippedRecords = 0 } = result;
        
        if (failedImports === 0 && skippedRecords === 0) {
            toast({
                title: 'Import Successful',
                description: `Successfully imported ${successfulImports} routes.`,
                variant: 'default',
            });
        } else if (successfulImports > 0) {
            toast({
                title: 'Import Partially Completed',
                description: `Imported ${successfulImports} routes successfully. ${failedImports} failed, ${skippedRecords} skipped.`,
                variant: 'destructive',
            });
        } else {
            toast({
                title: 'Import Failed',
                description: `No routes were imported. ${failedImports} failed, ${skippedRecords} skipped.`,
                variant: 'destructive',
            });
        }

        // Navigate back to routes list after successful import
        if (successfulImports > 0) {
            setTimeout(() => {
                router.push('/mot/routes');
            }, 2000);
        }
    }, [toast, router]);

    const handleImportError = useCallback((error: string) => {
        toast({
            title: 'Import Failed',
            description: error,
            variant: 'destructive',
        });
    }, [toast]);

    const importOptions = {
        routeGroupDuplicateStrategy: 'REUSE', // REUSE, CREATE_WITH_SUFFIX, SKIP
        routeDuplicateStrategy: 'SKIP', // SKIP, UPDATE, CREATE_WITH_SUFFIX
        validateStopsExist: true,
        createMissingStops: false,
        allowPartialRouteStops: true,
        validateCoordinates: false,
        continueOnError: true,
        defaultRoadType: 'NORMALWAY'
    };

    return (
            <div className="p-0 mx-auto">
                <CSVEditor
                    onImport={handleImport}
                    onImportComplete={handleImportComplete}
                    onImportError={handleImportError}
                    templateDownloadFn={handleTemplateDownload}
                    importOptions={importOptions}
                    validationRules={ROUTE_VALIDATION_RULES}
                    maxRows={5000}
                    maxFileSize={5 * 1024 * 1024} // 5MB
                    title="Upload Routes CSV Data"
                    description="Upload your unified routes CSV file containing route groups, routes, and route stops data. Make sure to include required fields: route_group_name, route_name, stop_name_english, and stop_order."
                />
            </div>
    );
}

export default RoutesImportPage;