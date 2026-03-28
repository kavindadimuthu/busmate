import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSetPageMetadata } from '@/context/PageContext';
import { CSVData } from '@/components/tools/csv-editor/types';
import { useToast } from '@/hooks/use-toast';
import { RouteManagementService } from '@busmate/api-client-route';

export function useRoutesImport() {
  const router = useRouter();
  const { toast } = useToast();

  useSetPageMetadata({
    title: 'Import Routes',
    description: 'Import routes data in bulk',
    activeItem: 'routes',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Routes', href: '/mot/routes' }, { label: 'Import' }],
  });

  const handleTemplateDownload = useCallback(async (format: string) => {
    try {
      const templateContent = await RouteManagementService.downloadUnifiedRouteImportTemplate();

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
    const { successfulImports = 0, failedImports = 0, skippedRecords = 0 } = result;

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
    routeGroupDuplicateStrategy: 'REUSE',
    routeDuplicateStrategy: 'SKIP',
    validateStopsExist: true,
    createMissingStops: false,
    allowPartialRouteStops: true,
    validateCoordinates: false,
    continueOnError: true,
    defaultRoadType: 'NORMALWAY'
  };

  return {
    handleTemplateDownload,
    handleImport,
    handleImportComplete,
    handleImportError,
    importOptions,
  };
}
