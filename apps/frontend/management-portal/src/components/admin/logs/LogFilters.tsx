'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';

interface LogFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearAll: () => void;
  filterConfig: {
    key: string;
    label: string;
    options: { value: string; label: string }[];
  }[];
  loading?: boolean;
  totalCount?: number;
  filteredCount?: number;
}

export function LogFilters({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  onClearAll,
  filterConfig,
  loading = false,
  totalCount = 0,
  filteredCount = 0,
}: LogFiltersProps) {
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

  // Sync external search changes
  useEffect(() => {
    if (searchTerm !== localSearch) {
      setLocalSearch(searchTerm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const hasActiveFilters =
    searchTerm !== '' ||
    Object.values(filters).some((v) => v !== 'all');

  const activeFilterCount = [
    searchTerm && 'search',
    ...Object.entries(filters)
      .filter(([, v]) => v !== 'all')
      .map(([k]) => k),
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Search bar + toggle */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs by message, user, IP, service..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
            {localSearch && (
              <button
                onClick={() => {
                  setLocalSearch('');
                  onSearchChange('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
              isExpanded || hasActiveFilters
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Clear All */}
          {hasActiveFilters && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* Results count */}
        {(loading || totalCount > 0) && (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {loading ? (
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
                  Loading...
                </span>
              ) : hasActiveFilters ? (
                <>Showing <span className="font-medium text-gray-700">{filteredCount}</span> of {totalCount} results</>
              ) : (
                <>{totalCount} total logs</>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Expandable Filter Dropdowns */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filterConfig.map((config) => (
              <div key={config.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {config.label}
                </label>
                <select
                  value={filters[config.key] || 'all'}
                  onChange={(e) => onFilterChange(config.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {config.options.map((opt) => (
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

      {/* Active Filter Chips */}
      {hasActiveFilters && !isExpanded && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
              Search: &quot;{searchTerm}&quot;
              <button
                onClick={() => {
                  setLocalSearch('');
                  onSearchChange('');
                }}
                className="hover:text-blue-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {Object.entries(filters)
            .filter(([, v]) => v !== 'all')
            .map(([key, value]) => {
              const config = filterConfig.find((c) => c.key === key);
              const optionLabel = config?.options.find((o) => o.value === value)?.label || value;
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                >
                  {config?.label}: {optionLabel}
                  <button
                    onClick={() => onFilterChange(key, 'all')}
                    className="hover:text-gray-900"
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
