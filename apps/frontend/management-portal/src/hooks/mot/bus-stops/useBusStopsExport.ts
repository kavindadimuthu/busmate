'use client';

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { BusStopManagementService } from '@busmate/api-client-route';
import type { StopFilterOptionsResponse } from '@busmate/api-client-route';

// ── Types ──────────────────────────────────────────────────────────────────

export interface ExportFilters {
  exportAll: boolean;
  stopIds: string[];
  cities: string[];
  states: string[];
  countries: string[];
  isAccessible?: boolean;
  searchText: string;
}

export interface ExportOptions {
  format: 'CSV' | 'JSON';
  includeMultiLanguageFields: boolean;
  includeLocationDetails: boolean;
  includeTimestamps: boolean;
  includeUserInfo: boolean;
  customFields: string[];
}

export interface FilterOptions {
  states: string[];
  cities: string[];
  countries: string[];
  accessibilityStatuses: boolean[];
}

// ── Constants ──────────────────────────────────────────────────────────────

export const AVAILABLE_CUSTOM_FIELDS = [
  'id',
  'name',
  'nameSinhala',
  'nameTamil',
  'description',
  'location',
  'isAccessible',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
];

// ── Hook ───────────────────────────────────────────────────────────────────

export function useBusStopsExport() {
  const { toast } = useToast();

  const [isExporting, setIsExporting] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    states: [],
    cities: [],
    countries: [],
    accessibilityStatuses: [],
  });
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);

  const [exportFilters, setExportFilters] = useState<ExportFilters>({
    exportAll: true,
    stopIds: [],
    cities: [],
    states: [],
    countries: [],
    isAccessible: undefined,
    searchText: '',
  });

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'CSV',
    includeMultiLanguageFields: true,
    includeLocationDetails: true,
    includeTimestamps: false,
    includeUserInfo: false,
    customFields: [],
  });

  // ── Load filter options ────────────────────────────────────────────────

  const loadFilterOptions = useCallback(async () => {
    setFilterOptionsLoading(true);
    try {
      const response: StopFilterOptionsResponse =
        await BusStopManagementService.getStopFilterOptions();
      setFilterOptions({
        states: response.states || [],
        cities: response.cities || [],
        countries: response.countries || [],
        accessibilityStatuses: response.accessibilityStatuses || [],
      });
    } catch (error) {
      console.error('Failed to load filter options:', error);
      toast({
        title: 'Error',
        description: 'Failed to load filter options. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setFilterOptionsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  // ── Export handler ─────────────────────────────────────────────────────

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const response = await BusStopManagementService.exportStops(
        exportFilters.exportAll,
        exportFilters.stopIds.length > 0 ? exportFilters.stopIds : undefined,
        exportFilters.cities.length > 0 ? exportFilters.cities : undefined,
        exportFilters.states.length > 0 ? exportFilters.states : undefined,
        exportFilters.countries.length > 0 ? exportFilters.countries : undefined,
        exportFilters.isAccessible,
        exportFilters.searchText || undefined,
        exportOptions.format,
        exportOptions.includeMultiLanguageFields,
        exportOptions.includeLocationDetails,
        exportOptions.includeTimestamps,
        exportOptions.includeUserInfo,
        exportOptions.customFields.length > 0 ? exportOptions.customFields : undefined,
      );

      const blob = new Blob([response], {
        type: exportOptions.format === 'CSV' ? 'text/csv' : 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `bus_stops_export_${new Date().toISOString().split('T')[0]}.${exportOptions.format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export Successful',
        description: `Bus stops data has been exported as ${exportOptions.format} file.`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export bus stops data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [exportFilters, exportOptions, toast]);

  // ── Filter / option change handlers ────────────────────────────────────

  const handleFilterChange = (key: keyof ExportFilters, value: ExportFilters[keyof ExportFilters]) => {
    setExportFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleOptionsChange = (key: keyof ExportOptions, value: ExportOptions[keyof ExportOptions]) => {
    setExportOptions((prev) => ({ ...prev, [key]: value }));
  };

  const handleMultiSelectChange = (key: keyof ExportFilters, value: string, checked: boolean) => {
    setExportFilters((prev) => {
      const currentArray = prev[key] as string[];
      return {
        ...prev,
        [key]: checked ? [...currentArray, value] : currentArray.filter((item) => item !== value),
      };
    });
  };

  const handleCustomFieldsChange = (field: string, checked: boolean) => {
    setExportOptions((prev) => ({
      ...prev,
      customFields: checked
        ? [...prev.customFields, field]
        : prev.customFields.filter((f) => f !== field),
    }));
  };

  const hasActiveFilters =
    !exportFilters.exportAll ||
    exportFilters.stopIds.length > 0 ||
    exportFilters.cities.length > 0 ||
    exportFilters.states.length > 0 ||
    exportFilters.countries.length > 0 ||
    exportFilters.isAccessible !== undefined ||
    exportFilters.searchText.length > 0;

  return {
    isExporting,
    filterOptions,
    filterOptionsLoading,
    exportFilters,
    exportOptions,
    hasActiveFilters,
    handleExport,
    handleFilterChange,
    handleOptionsChange,
    handleMultiSelectChange,
    handleCustomFieldsChange,
  };
}
