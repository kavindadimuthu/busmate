'use client';

import React from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@busmate/ui';
import { Download, List, Loader2, Settings } from 'lucide-react';
import type { ExportFilters, ExportOptions } from './useBusStopsExport';
import { AVAILABLE_CUSTOM_FIELDS } from './useBusStopsExport';

interface ExportOptionsPanelProps {
  exportFilters: ExportFilters;
  exportOptions: ExportOptions;
  isExporting: boolean;
  onOptionsChange: (key: keyof ExportOptions, value: ExportOptions[keyof ExportOptions]) => void;
  onCustomFieldsChange: (field: string, checked: boolean) => void;
  onExport: () => void;
}

export function ExportOptionsPanel({
  exportFilters,
  exportOptions,
  isExporting,
  onOptionsChange,
  onCustomFieldsChange,
  onExport,
}: ExportOptionsPanelProps) {
  return (
    <div className="space-y-6">
      {/* Export Format & Include Options */}
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
              onValueChange={(value: 'CSV' | 'JSON') => onOptionsChange('format', value)}
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
            <Label className="text-sm font-medium text-muted-foreground">Include in Export:</Label>
            <div className="space-y-2">
              <IncludeOption
                id="multiLanguage"
                label="Multi-language fields"
                checked={exportOptions.includeMultiLanguageFields}
                onChange={(checked) => onOptionsChange('includeMultiLanguageFields', checked)}
              />
              <IncludeOption
                id="locationDetails"
                label="Location details"
                checked={exportOptions.includeLocationDetails}
                onChange={(checked) => onOptionsChange('includeLocationDetails', checked)}
              />
              <IncludeOption
                id="timestamps"
                label="Created/Updated timestamps"
                checked={exportOptions.includeTimestamps}
                onChange={(checked) => onOptionsChange('includeTimestamps', checked)}
              />
              <IncludeOption
                id="userInfo"
                label="Created/Updated by user info"
                checked={exportOptions.includeUserInfo}
                onChange={(checked) => onOptionsChange('includeUserInfo', checked)}
              />
            </div>
          </div>

          {/* Custom Fields */}
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-sm font-medium text-muted-foreground">
              Custom Fields (optional):
            </Label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {AVAILABLE_CUSTOM_FIELDS.map((field) => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox
                    id={`custom-${field}`}
                    checked={exportOptions.customFields.includes(field)}
                    onCheckedChange={(checked) => onCustomFieldsChange(field, checked as boolean)}
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
            <SummaryRow label="Scope" value={exportFilters.exportAll ? 'All stops' : 'Filtered'} />
            <SummaryRow label="Format" value={exportOptions.format} />
            {exportFilters.states.length > 0 && (
              <SummaryRow label="States" value={String(exportFilters.states.length)} variant="secondary" />
            )}
            {exportFilters.cities.length > 0 && (
              <SummaryRow label="Cities" value={String(exportFilters.cities.length)} variant="secondary" />
            )}
            {exportOptions.customFields.length > 0 && (
              <SummaryRow
                label="Custom fields"
                value={String(exportOptions.customFields.length)}
                variant="secondary"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Button */}
      <Button
        onClick={onExport}
        disabled={isExporting}
        className="w-full bg-primary hover:bg-primary text-white"
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
  );
}

// ── Internal helpers ──────────────────────────────────────────────────────

function IncludeOption({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v as boolean)} />
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  variant = 'outline',
}: {
  label: string;
  value: string;
  variant?: 'outline' | 'secondary';
}) {
  return (
    <div className="flex justify-between">
      <span>{label}:</span>
      <Badge variant={variant} className="text-xs">
        {value}
      </Badge>
    </div>
  );
}
