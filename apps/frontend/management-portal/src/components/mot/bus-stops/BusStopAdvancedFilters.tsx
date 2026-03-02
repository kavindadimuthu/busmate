'use client';

import React, { useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  MapPin,
} from 'lucide-react';
import {
  SearchFilterBar,
  SelectFilter,
  SegmentedControl,
} from '@/components/shared/SearchFilterBar';
import type { FilterChipDescriptor, SegmentOption } from '@/components/shared/SearchFilterBar';

// ── Types ─────────────────────────────────────────────────────────

interface FilterOptions {
  states: string[];
  accessibilityStatuses: boolean[];
}

interface BusStopAdvancedFiltersProps {
  // Search
  searchTerm: string;
  setSearchTerm: (value: string) => void;

  // Filters
  stateFilter: string;
  setStateFilter: (value: string) => void;
  accessibilityFilter: string;
  setAccessibilityFilter: (value: string) => void;

  // Data
  filterOptions: FilterOptions;
  loading: boolean;

  // Stats for display
  totalCount?: number;
  filteredCount?: number;
  /** Number of records loaded on the current page (shown as the primary count). */
  loadedCount?: number;

  // Event handlers
  onClearAll?: () => void;
  onSearch?: (term: string) => void;
}

// ── Accessibility segment options ─────────────────────────────────

const ACCESSIBILITY_SEGMENTS: SegmentOption[] = [
  { value: 'all', label: 'All' },
  { value: 'accessible', label: 'Accessible', icon: <CheckCircle2 className="h-3 w-3" /> },
  { value: 'non-accessible', label: 'Non-Accessible', icon: <XCircle className="h-3 w-3" /> },
];

// ── Component ─────────────────────────────────────────────────────

/**
 * Bus-stop-specific search & filter bar.
 *
 * Wraps the generic `<SearchFilterBar>` with bus-stop filter controls
 * (state dropdown, accessibility segmented control) and derives active
 * filter chips automatically.
 */
export function BusStopAdvancedFilters({
  searchTerm,
  setSearchTerm,
  stateFilter,
  setStateFilter,
  accessibilityFilter,
  setAccessibilityFilter,
  filterOptions,
  loading,
  totalCount = 0,
  filteredCount = 0,
  loadedCount,
  onClearAll,
  onSearch,
}: BusStopAdvancedFiltersProps) {

  // Handle search — delegate to onSearch if provided, otherwise setSearchTerm
  const handleSearchChange = useCallback(
    (value: string) => {
      if (onSearch) {
        onSearch(value);
      } else {
        setSearchTerm(value);
      }
    },
    [onSearch, setSearchTerm],
  );

  const handleClearAll = useCallback(() => {
    setSearchTerm('');
    setStateFilter('all');
    setAccessibilityFilter('all');
    onClearAll?.();
  }, [setSearchTerm, setStateFilter, setAccessibilityFilter, onClearAll]);

  // Build active filter chips
  const chips: FilterChipDescriptor[] = [];

  if (stateFilter !== 'all') {
    chips.push({
      key: 'state',
      label: stateFilter,
      onRemove: () => setStateFilter('all'),
      colorClass: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: <MapPin className="h-3 w-3 opacity-70" />,
    });
  }

  if (accessibilityFilter !== 'all') {
    const label = accessibilityFilter === 'accessible' ? 'Accessible' : 'Non-Accessible';
    chips.push({
      key: 'accessibility',
      label,
      onRemove: () => setAccessibilityFilter('all'),
      colorClass:
        accessibilityFilter === 'accessible'
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-red-50 text-red-700 border-red-200',
      icon:
        accessibilityFilter === 'accessible'
          ? <CheckCircle2 className="h-3 w-3 opacity-70" />
          : <XCircle className="h-3 w-3 opacity-70" />,
    });
  }

  return (
    <SearchFilterBar
      searchValue={searchTerm}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Search bus stops by name, city, or state…"
      totalCount={totalCount}
      filteredCount={filteredCount}
      loadedCount={loadedCount}
      resultLabel="stop"
      loading={loading}
      filters={
        <>
          <SelectFilter
            value={stateFilter}
            onChange={setStateFilter}
            options={filterOptions.states.map((s) => ({ value: s, label: s }))}
            allLabel="All States"
            icon={<MapPin className="h-3.5 w-3.5" />}
          />
          <SegmentedControl
            value={accessibilityFilter}
            onChange={setAccessibilityFilter}
            options={ACCESSIBILITY_SEGMENTS}
          />
        </>
      }
      activeChips={chips}
      onClearAllFilters={handleClearAll}
    />
  );
}