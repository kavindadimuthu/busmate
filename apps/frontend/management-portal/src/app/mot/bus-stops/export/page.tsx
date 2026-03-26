'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { Badge, Button } from '@busmate/ui';
import { ArrowLeft, FileText, Filter } from 'lucide-react';
import { useBusStopsExport } from '@/components/mot/bus-stops/useBusStopsExport';
import { ExportScopeCard } from '@/components/mot/bus-stops/ExportScopeCard';
import { LocationFiltersCard } from '@/components/mot/bus-stops/LocationFiltersCard';
import { ExportOptionsPanel } from '@/components/mot/bus-stops/ExportOptionsPanel';

function BusStopsExportPage() {
  const router = useRouter();

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
    </Button>,
  );

  const {
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
  } = useBusStopsExport();

  return (
    <div className="mx-auto space-y-6">
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
        <div className="lg:col-span-2 space-y-6">
          <ExportScopeCard exportFilters={exportFilters} onFilterChange={handleFilterChange} />
          <LocationFiltersCard
            filterOptions={filterOptions}
            filterOptionsLoading={filterOptionsLoading}
            exportFilters={exportFilters}
            onMultiSelectChange={handleMultiSelectChange}
          />
        </div>

        <ExportOptionsPanel
          exportFilters={exportFilters}
          exportOptions={exportOptions}
          isExporting={isExporting}
          onOptionsChange={handleOptionsChange}
          onCustomFieldsChange={handleCustomFieldsChange}
          onExport={handleExport}
        />
      </div>
    </div>
  );
}

export default BusStopsExportPage;
