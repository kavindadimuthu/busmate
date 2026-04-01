'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@busmate/ui';
import { CheckSquare } from 'lucide-react';
import type { ExportFilters } from '../../../hooks/mot/stops/useBusStopsExport';

interface ExportScopeCardProps {
  exportFilters: ExportFilters;
  onFilterChange: (key: keyof ExportFilters, value: ExportFilters[keyof ExportFilters]) => void;
}

export function ExportScopeCard({ exportFilters, onFilterChange }: ExportScopeCardProps) {
  return (
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
            onCheckedChange={(checked) => onFilterChange('exportAll', checked as boolean)}
          />
          <Label htmlFor="exportAll" className="text-sm font-medium">
            Export all bus stops
          </Label>
        </div>

        {!exportFilters.exportAll && (
          <div className="space-y-3 pt-2 border-t">
            <Label className="text-sm font-medium text-muted-foreground">
              Apply filters to limit export:
            </Label>

            {/* Search Text Filter */}
            <div>
              <Label htmlFor="searchText" className="text-sm">
                Search Text
              </Label>
              <Input
                id="searchText"
                placeholder="Search by name, address, or description..."
                value={exportFilters.searchText}
                onChange={(e) => onFilterChange('searchText', e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Accessibility Filter */}
            <div>
              <Label className="text-sm">Accessibility</Label>
              <Select
                value={exportFilters.isAccessible?.toString() || 'all'}
                onValueChange={(value) =>
                  onFilterChange('isAccessible', value === 'all' ? undefined : value === 'true')
                }
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
  );
}
