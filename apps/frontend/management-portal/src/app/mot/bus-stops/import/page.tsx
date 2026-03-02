'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSetPageMetadata } from '@/context/PageContext';
import { CSVEditor } from '@/components/tools/csv-editor';
import { BUS_STOP_VALIDATION_RULES } from '@/components/tools/csv-editor';
import { CSVData } from '@/components/tools/csv-editor/types';
import { useToast } from '@/hooks/use-toast';
import { BusStopManagementService } from '../../../../../generated/api-clients/route-management';

function BusStopsImportPage() {
    const router = useRouter();
    const { toast } = useToast();

    useSetPageMetadata({
        title: 'Import Bus Stops',
        description: 'Import bus stops in bulk using a CSV file. Download a template to see the expected format.',
        activeItem: 'bus-stops',
        showBreadcrumbs: true,
        breadcrumbs: [{ label: 'Bus Stops', href: '/mot/bus-stops' }, { label: 'Import' }],
    });

    // Handle bus stop template download
    const handleTemplateDownload = useCallback(async (format: string) => {
        try {
            const templateContent = await BusStopManagementService.downloadStopImportTemplate(format);
            
            // Create and download the file
            const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `bus-stops-template-${format}.csv`);
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

    // Handle bus stop data import
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
            
            const defaultCountry = options?.defaultCountry || 'Sri Lanka';
            const result = await BusStopManagementService.importStops(defaultCountry, {
                file: blob
            });

            return result;
        } catch (error) {
            console.error('Bus stops import error:', error);
            throw error;
        }
    }, []);

    const handleImportComplete = useCallback((result: any) => {
        const { successfulImports = 0, failedImports = 0, totalRecords = 0 } = result;
        
        if (failedImports === 0) {
            toast({
                title: 'Import Successful',
                description: `Successfully imported ${successfulImports} bus stops.`,
                variant: 'default',
            });
        } else {
            toast({
                title: 'Import Partially Completed',
                description: `Imported ${successfulImports} bus stops successfully. ${failedImports} failed to import.`,
                variant: 'destructive',
            });
        }

        // Navigate back to bus stops list after successful import
        // if (successfulImports > 0) {
        //     setTimeout(() => {
        //         router.push('/mot/bus-stops');
        //     }, 2000);
        // }
    }, [toast, router]);

    const handleImportError = useCallback((error: string) => {
        toast({
            title: 'Import Failed',
            description: error,
            variant: 'destructive',
        });
    }, [toast]);

    const importOptions = {
        defaultCountry: 'Sri Lanka'
    };

    return (
        <div className="p-0 mx-auto">
            <CSVEditor
                    onImport={handleImport}
                    onImportComplete={handleImportComplete}
                    onImportError={handleImportError}
                    templateDownloadFn={handleTemplateDownload}
                    importOptions={importOptions}
                    validationRules={BUS_STOP_VALIDATION_RULES}
                    maxRows={5000}
                    maxFileSize={5 * 1024 * 1024} // 5MB
                    title="Upload Bus Stops CSV Data"
                    description="Upload your bus stops CSV file or paste CSV data directly. Make sure to include at least one name field (name, name_sinhala, or name_tamil) and location coordinates."
            />
        </div>
    );
}

export default BusStopsImportPage;