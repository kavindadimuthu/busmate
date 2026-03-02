'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { BusStopManagementService } from '../../../../../generated/api-clients/route-management';
import type { StopFilterOptionsResponse } from '../../../../../generated/api-clients/route-management';
import { 
  Download, 
  ArrowLeft, 
  FileText, 
  Settings, 
  Filter, 
  CheckSquare,
  MapPin,
  Building,
  Accessibility,
  Globe,
  Clock,
  User,
  List,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface ExportFilters {
  exportAll: boolean;
  stopIds: string[];
  cities: string[];
  states: string[];
  countries: string[];
  isAccessible?: boolean;
  searchText: string;
}

interface ExportOptions {
  format: 'CSV' | 'JSON';
  includeMultiLanguageFields: boolean;
  includeLocationDetails: boolean;
  includeTimestamps: boolean;
  includeUserInfo: boolean;
  customFields: string[];
}

interface FilterOptions {
  states: string[];
  cities: string[];
  countries: string[];
  accessibilityStatuses: boolean[];
}

const availableCustomFields = [
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
  'updatedBy'
];

function BusStopsExportPage() {
  const router = useRouter();
  const { toast } = useToast();

  useSetPageMetadata({
    title: 'Export Bus Stops',
    description: 'Export bus stops data with customizable filters and options',
    activeItem: 'bus-stops',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Bus Stops', href: '/mot/bus-stops' }, { label: 'Export' }],
  });

  useSetPageActions(
    <Button 
      variant="outline" 
      onClick={() => router.push('/mot/bus-stops')}
      className="flex items-center gap-2"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Bus Stops
    </Button>
  );

  // State management
  const [isExporting, setIsExporting] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    states: [],
    cities: [],
    countries: [],
    accessibilityStatuses: []
  });
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);

  // Export filters state
  const [exportFilters, setExportFilters] = useState<ExportFilters>({
    exportAll: true,
    stopIds: [],
    cities: [],
    states: [],
    countries: [],
    isAccessible: undefined,
    searchText: ''
  });

  // Export options state
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'CSV',
    includeMultiLanguageFields: true,
    includeLocationDetails: true,
    includeTimestamps: false,
    includeUserInfo: false,
    customFields: []
  });

  // Load filter options
  const loadFilterOptions = useCallback(async () => {
    setFilterOptionsLoading(true);
    try {
      const response: StopFilterOptionsResponse = await BusStopManagementService.getFilterOptions();
      setFilterOptions({
        states: response.states || [],
        cities: response.cities || [],
        countries: response.countries || [],
        accessibilityStatuses: response.accessibilityStatuses || []
      });
    } catch (error) {
      console.error('Failed to load filter options:', error);
      toast({
        title: 'Error',
        description: 'Failed to load filter options. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setFilterOptionsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  // Handle export
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const exportParams = {
        exportAll: exportFilters.exportAll,
        stopIds: exportFilters.stopIds.length > 0 ? exportFilters.stopIds : undefined,
        cities: exportFilters.cities.length > 0 ? exportFilters.cities : undefined,
        states: exportFilters.states.length > 0 ? exportFilters.states : undefined,
        countries: exportFilters.countries.length > 0 ? exportFilters.countries : undefined,
        isAccessible: exportFilters.isAccessible,
        searchText: exportFilters.searchText || undefined,
        format: exportOptions.format,
        includeMultiLanguageFields: exportOptions.includeMultiLanguageFields,
        includeLocationDetails: exportOptions.includeLocationDetails,
        includeTimestamps: exportOptions.includeTimestamps,
        includeUserInfo: exportOptions.includeUserInfo,
        customFields: exportOptions.customFields.length > 0 ? exportOptions.customFields : undefined
      };

      const response = await BusStopManagementService.exportStops(
        exportParams.exportAll,
        exportParams.stopIds,
        exportParams.cities,
        exportParams.states,
        exportParams.countries,
        exportParams.isAccessible,
        exportParams.searchText,
        exportParams.format,
        exportParams.includeMultiLanguageFields,
        exportParams.includeLocationDetails,
        exportParams.includeTimestamps,
        exportParams.includeUserInfo,
        exportParams.customFields
      );

      // Create and trigger file download
      const blob = new Blob([response], { type: exportOptions.format === 'CSV' ? 'text/csv' : 'application/json' });
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
        variant: 'default'
      });

    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export bus stops data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  }, [exportFilters, exportOptions, toast]);

  // Handle filter changes
  const handleFilterChange = (key: keyof ExportFilters, value: any) => {
    setExportFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleOptionsChange = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleMultiSelectChange = (key: keyof ExportFilters, value: string, checked: boolean) => {
    setExportFilters(prev => {
      const currentArray = prev[key] as string[];
      if (checked) {
        return { ...prev, [key]: [...currentArray, value] };
      } else {
        return { ...prev, [key]: currentArray.filter(item => item !== value) };
      }
    });
  };

  const handleCustomFieldsChange = (field: string, checked: boolean) => {
    setExportOptions(prev => {
      if (checked) {
        return { ...prev, customFields: [...prev.customFields, field] };
      } else {
        return { ...prev, customFields: prev.customFields.filter(f => f !== field) };
      }
    });
  };

  const hasActiveFilters = !exportFilters.exportAll || 
    exportFilters.stopIds.length > 0 ||
    exportFilters.cities.length > 0 ||
    exportFilters.states.length > 0 ||
    exportFilters.countries.length > 0 ||
    exportFilters.isAccessible !== undefined ||
    exportFilters.searchText.length > 0;

  return (
      <div className="mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {exportOptions.format} Export
            </Badge>
            {hasActiveFilters && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Filter className="h-3 w-3" />
                Filtered
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Export Filters */}
          <div className="lg:col-span-2 space-y-6">
            {/* Export Scope */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Export Scope
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="exportAll" 
                    checked={exportFilters.exportAll}
                    onCheckedChange={(checked) => handleFilterChange('exportAll', checked)}
                  />
                  <Label htmlFor="exportAll" className="text-sm font-medium">
                    Export all bus stops
                  </Label>
                </div>
                
                {!exportFilters.exportAll && (
                  <div className="space-y-3 pt-2 border-t">
                    <Label className="text-sm font-medium text-gray-600">
                      Apply filters to limit export:
                    </Label>
                    
                    {/* Search Text Filter */}
                    <div>
                      <Label htmlFor="searchText" className="text-sm">Search Text</Label>
                      <Input
                        id="searchText"
                        placeholder="Search by name, address, or description..."
                        value={exportFilters.searchText}
                        onChange={(e) => handleFilterChange('searchText', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    {/* Accessibility Filter */}
                    <div>
                      <Label className="text-sm">Accessibility</Label>
                      <Select 
                        value={exportFilters.isAccessible?.toString() || 'all'} 
                        onValueChange={(value) => handleFilterChange('isAccessible', value === 'all' ? undefined : value === 'true')}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="All accessibility types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All accessibility types</SelectItem>
                          <SelectItem value="true">Accessible only</SelectItem>
                          <SelectItem value="false">Non-accessible only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location Filters */}
            {!exportFilters.exportAll && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {filterOptionsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <span className="ml-2">Loading filter options...</span>
                    </div>
                  ) : (
                    <>
                      {/* States */}
                      {filterOptions.states.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium mb-2 block">States</Label>
                          <div className="max-h-32 overflow-y-auto space-y-2 border rounded-md p-2">
                            {filterOptions.states.map((state) => (
                              <div key={state} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`state-${state}`}
                                  checked={exportFilters.states.includes(state)}
                                  onCheckedChange={(checked) => handleMultiSelectChange('states', state, checked as boolean)}
                                />
                                <Label htmlFor={`state-${state}`} className="text-sm">
                                  {state}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cities */}
                      {filterOptions.cities.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Cities</Label>
                          <div className="max-h-32 overflow-y-auto space-y-2 border rounded-md p-2">
                            {filterOptions.cities.map((city) => (
                              <div key={city} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`city-${city}`}
                                  checked={exportFilters.cities.includes(city)}
                                  onCheckedChange={(checked) => handleMultiSelectChange('cities', city, checked as boolean)}
                                />
                                <Label htmlFor={`city-${city}`} className="text-sm">
                                  {city}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Countries */}
                      {filterOptions.countries.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Countries</Label>
                          <div className="max-h-32 overflow-y-auto space-y-2 border rounded-md p-2">
                            {filterOptions.countries.map((country) => (
                              <div key={country} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`country-${country}`}
                                  checked={exportFilters.countries.includes(country)}
                                  onCheckedChange={(checked) => handleMultiSelectChange('countries', country, checked as boolean)}
                                />
                                <Label htmlFor={`country-${country}`} className="text-sm">
                                  {country}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Export Options Sidebar */}
          <div className="space-y-6">
            {/* Export Format */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Export Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Format Selection */}
                <div>
                  <Label className="text-sm font-medium">Format</Label>
                  <Select 
                    value={exportOptions.format} 
                    onValueChange={(value: 'CSV' | 'JSON') => handleOptionsChange('format', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CSV">CSV (Comma Separated)</SelectItem>
                      <SelectItem value="JSON">JSON (JavaScript Object)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Include Options */}
                <div className="space-y-3 pt-2 border-t">
                  <Label className="text-sm font-medium text-gray-600">Include in Export:</Label>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="multiLanguage"
                        checked={exportOptions.includeMultiLanguageFields}
                        onCheckedChange={(checked) => handleOptionsChange('includeMultiLanguageFields', checked)}
                      />
                      <Label htmlFor="multiLanguage" className="text-sm">Multi-language fields</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="locationDetails"
                        checked={exportOptions.includeLocationDetails}
                        onCheckedChange={(checked) => handleOptionsChange('includeLocationDetails', checked)}
                      />
                      <Label htmlFor="locationDetails" className="text-sm">Location details</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="timestamps"
                        checked={exportOptions.includeTimestamps}
                        onCheckedChange={(checked) => handleOptionsChange('includeTimestamps', checked)}
                      />
                      <Label htmlFor="timestamps" className="text-sm">Created/Updated timestamps</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="userInfo"
                        checked={exportOptions.includeUserInfo}
                        onCheckedChange={(checked) => handleOptionsChange('includeUserInfo', checked)}
                      />
                      <Label htmlFor="userInfo" className="text-sm">Created/Updated by user info</Label>
                    </div>
                  </div>
                </div>

                {/* Custom Fields */}
                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-sm font-medium text-gray-600">Custom Fields (optional):</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {availableCustomFields.map((field) => (
                      <div key={field} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`custom-${field}`}
                          checked={exportOptions.customFields.includes(field)}
                          onCheckedChange={(checked) => handleCustomFieldsChange(field, checked as boolean)}
                        />
                        <Label htmlFor={`custom-${field}`} className="text-xs font-mono">
                          {field}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Export Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Scope:</span>
                    <Badge variant="outline" className="text-xs">
                      {exportFilters.exportAll ? 'All stops' : 'Filtered'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Format:</span>
                    <Badge variant="outline" className="text-xs">
                      {exportOptions.format}
                    </Badge>
                  </div>
                  {exportFilters.states.length > 0 && (
                    <div className="flex justify-between">
                      <span>States:</span>
                      <Badge variant="secondary" className="text-xs">
                        {exportFilters.states.length}
                      </Badge>
                    </div>
                  )}
                  {exportFilters.cities.length > 0 && (
                    <div className="flex justify-between">
                      <span>Cities:</span>
                      <Badge variant="secondary" className="text-xs">
                        {exportFilters.cities.length}
                      </Badge>
                    </div>
                  )}
                  {exportOptions.customFields.length > 0 && (
                    <div className="flex justify-between">
                      <span>Custom fields:</span>
                      <Badge variant="secondary" className="text-xs">
                        {exportOptions.customFields.length}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Export Button */}
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Bus Stops
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
  );
}

export default BusStopsExportPage;
