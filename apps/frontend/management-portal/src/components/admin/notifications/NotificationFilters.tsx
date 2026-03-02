'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface NotificationFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearAll?: () => void;
  filterConfig: {
    key: string;
    label: string;
    options: { value: string; label: string }[];
  }[];
  loading?: boolean;
  totalCount?: number;
  filteredCount?: number;
}

export function NotificationFilters({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  onClearAll,
  filterConfig,
  loading = false,
  totalCount = 0,
  filteredCount = 0,
}: NotificationFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [isExpanded, setIsExpanded] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchTerm) {
        onSearchChange(localSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, searchTerm, onSearchChange]);

  // Sync external changes
  useEffect(() => {
    if (searchTerm !== localSearch) {
      setLocalSearch(searchTerm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const hasActiveFilters =
    searchTerm !== '' || Object.values(filters).some((v) => v !== 'all');

  const activeFilterCount = [
    searchTerm && 'search',
    ...Object.entries(filters)
      .filter(([, v]) => v !== 'all')
      .map(([k]) => k),
  ].filter(Boolean).length;

  const handleClear = useCallback(() => {
    setLocalSearch('');
    onClearAll?.();
  }, [onClearAll]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Search row */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            {localSearch && (
              <button
                onClick={() => { setLocalSearch(''); onSearchChange(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsExpanded((v) => !v)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
              isExpanded || hasActiveFilters
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center h-5 w-5 text-xs font-bold rounded-full bg-blue-600 text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleClear}
              className="text-sm text-red-600 hover:text-red-700 font-medium whitespace-nowrap"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Result count */}
        {(totalCount > 0 || filteredCount > 0) && (
          <div className="mt-2 text-xs text-gray-500">
            Showing {filteredCount} of {totalCount} notifications
          </div>
        )}
      </div>

      {/* Expandable filter dropdowns */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filterConfig.map((cfg) => (
              <div key={cfg.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {cfg.label}
                </label>
                <select
                  value={filters[cfg.key] || 'all'}
                  onChange={(e) => onFilterChange(cfg.key, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={loading}
                >
                  {cfg.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active filter chips (when collapsed) */}
      {hasActiveFilters && !isExpanded && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Search: &quot;{searchTerm}&quot;
              <button
                onClick={() => { setLocalSearch(''); onSearchChange(''); }}
                className="ml-0.5 hover:text-blue-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {Object.entries(filters)
            .filter(([, v]) => v !== 'all')
            .map(([key, value]) => {
              const cfg = filterConfig.find((c) => c.key === key);
              const label = cfg?.options.find((o) => o.value === value)?.label || value;
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 border border-gray-200"
                >
                  {cfg?.label}: {label}
                  <button
                    onClick={() => onFilterChange(key, 'all')}
                    className="ml-0.5 hover:text-gray-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
        </div>
      )}
    </div>
  );
}
