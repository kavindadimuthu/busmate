import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSetPageMetadata } from '@/context/PageContext';
import { CSVData } from '@/components/tools/csv-editor/types';
import { useToast } from '@/hooks/use-toast';
import { BusStopManagementService } from '@busmate/api-client-route';

export function useBusStopsImport() {
    const router = useRouter();
    const { toast } = useToast();

    useSetPageMetadata({
        title: 'Import Bus Stops',
        description: 'Import bus stops in bulk using a CSV file. Download a template to see the expected format.',
        activeItem: 'bus-stops',
        showBreadcrumbs: true,
        breadcrumbs: [{ label: 'Bus Stops', href: '/mot/bus-stops' }, { label: 'Import' }],
    });

    const handleTemplateDownload = useCallback(async (format: string) => {
        try {
            const templateContent = await BusStopManagementService.downloadStopImportTemplate(format);
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

    const handleImport = useCallback(async (data: CSVData, options?: any) => {
        try {
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
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const defaultCountry = options?.defaultCountry || 'Sri Lanka';
            return await BusStopManagementService.importStops(defaultCountry, { file: blob });
        } catch (error) {
            console.error('Bus stops import error:', error);
            throw error;
        }
    }, []);

    const handleImportComplete = useCallback((result: any) => {
        const { successfulImports = 0, failedImports = 0 } = result;
        toast({
            title: failedImports === 0 ? 'Import Successful' : 'Import Partially Completed',
            description: failedImports === 0
                ? `Successfully imported ${successfulImports} bus stops.`
                : `Imported ${successfulImports} bus stops successfully. ${failedImports} failed to import.`,
            variant: failedImports === 0 ? 'default' : 'destructive',
        });
    }, [toast, router]);

    const handleImportError = useCallback((error: string) => {
        toast({ title: 'Import Failed', description: error, variant: 'destructive' });
    }, [toast]);

    return { handleImport, handleImportComplete, handleImportError, handleTemplateDownload };
}
