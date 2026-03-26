"use client";

import * as React from "react";
import { Route as RouteIcon, Navigation } from "lucide-react";
import { FilterBar, FilterSelect, Input } from "@busmate/ui";

export interface RouteFilters {
  routeGroupId: string;
  direction: string;
  minDistance: string;
  maxDistance: string;
  minDuration: string;
  maxDuration: string;
}

interface FilterOptions {
  routeGroups: Array<{ id: string; name: string }>;
}

interface RoutesFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: RouteFilters;
  onFiltersChange: (filters: Partial<RouteFilters>) => void;
  onClearAll: () => void;
  filterOptions: FilterOptions;
  activeFilterCount?: number;
}

export function RoutesFilterBar({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearAll,
  filterOptions,
  activeFilterCount = 0,
}: RoutesFilterBarProps) {
  const routeGroupOptions = (filterOptions.routeGroups || []).map((rg) => ({
    value: rg.id,
    label: rg.name,
  }));

  const directionOptions = [
    { value: "OUTBOUND", label: "Outbound" },
    { value: "INBOUND", label: "Inbound" },
  ];

  return (
    <FilterBar
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search routes by name, description, group, or stop names…"
      activeFilterCount={activeFilterCount}
      onClearAll={onClearAll}
    >
      <FilterSelect
        label="Route Group"
        value={filters.routeGroupId ?? "__all__"}
        onChange={(value) => onFiltersChange({ routeGroupId: value })}
        options={routeGroupOptions}
        placeholder="All Groups"
        className="w-44"
      />
      <FilterSelect
        label="Direction"
        value={filters.direction ?? "__all__"}
        onChange={(value) => onFiltersChange({ direction: value })}
        options={directionOptions}
        placeholder="All Directions"
        className="w-40"
      />

      {/* Distance range */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground shrink-0">Dist (km):</span>
        <Input
          type="number"
          placeholder="Min"
          value={filters.minDistance}
          onChange={(e) => onFiltersChange({ minDistance: e.target.value })}
          className="w-16 h-9 text-xs"
        />
        <span className="text-muted-foreground/70 text-xs">–</span>
        <Input
          type="number"
          placeholder="Max"
          value={filters.maxDistance}
          onChange={(e) => onFiltersChange({ maxDistance: e.target.value })}
          className="w-16 h-9 text-xs"
        />
      </div>

      {/* Duration range */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground shrink-0">Dur (min):</span>
        <Input
          type="number"
          placeholder="Min"
          value={filters.minDuration}
          onChange={(e) => onFiltersChange({ minDuration: e.target.value })}
          className="w-16 h-9 text-xs"
        />
        <span className="text-muted-foreground/70 text-xs">–</span>
        <Input
          type="number"
          placeholder="Max"
          value={filters.maxDuration}
          onChange={(e) => onFiltersChange({ maxDuration: e.target.value })}
          className="w-16 h-9 text-xs"
        />
      </div>
    </FilterBar>
  );
}
