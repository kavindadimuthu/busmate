'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
} from '@busmate/ui';
import { MapPin, Loader2 } from 'lucide-react';
import type { ExportFilters, FilterOptions } from '../../../hooks/mot/stops/useBusStopsExport';

interface LocationFiltersCardProps {
  filterOptions: FilterOptions;
  filterOptionsLoading: boolean;
  exportFilters: ExportFilters;
  onMultiSelectChange: (key: keyof ExportFilters, value: string, checked: boolean) => void;
}

function CheckboxListSection({
  label,
  items,
  selectedItems,
  filterKey,
  onMultiSelectChange,
}: {
  label: string;
  items: string[];
  selectedItems: string[];
  filterKey: keyof ExportFilters;
  onMultiSelectChange: (key: keyof ExportFilters, value: string, checked: boolean) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">{label}</Label>
      <div className="max-h-32 overflow-y-auto space-y-2 border rounded-md p-2">
        {items.map((item) => (
          <div key={item} className="flex items-center space-x-2">
            <Checkbox
              id={`${filterKey}-${item}`}
              checked={selectedItems.includes(item)}
              onCheckedChange={(checked) =>
                onMultiSelectChange(filterKey, item, checked as boolean)
              }
            />
            <Label htmlFor={`${filterKey}-${item}`} className="text-sm">
              {item}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LocationFiltersCard({
  filterOptions,
  filterOptionsLoading,
  exportFilters,
  onMultiSelectChange,
}: LocationFiltersCardProps) {
  if (exportFilters.exportAll) return null;

  return (
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
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading filter options...</span>
          </div>
        ) : (
          <>
            <CheckboxListSection
              label="States"
              items={filterOptions.states}
              selectedItems={exportFilters.states}
              filterKey="states"
              onMultiSelectChange={onMultiSelectChange}
            />
            <CheckboxListSection
              label="Cities"
              items={filterOptions.cities}
              selectedItems={exportFilters.cities}
              filterKey="cities"
              onMultiSelectChange={onMultiSelectChange}
            />
            <CheckboxListSection
              label="Countries"
              items={filterOptions.countries}
              selectedItems={exportFilters.countries}
              filterKey="countries"
              onMultiSelectChange={onMultiSelectChange}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
