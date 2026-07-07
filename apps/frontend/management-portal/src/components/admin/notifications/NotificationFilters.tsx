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
    <div className="bg-card rounded-xl border border-border shadow-sm">
      {/* Search row */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            {localSearch && (
              <button
                onClick={() => { setLocalSearch(''); onSearchChange(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsExpanded((v) => !v)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
              isExpanded || hasActiveFilters
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-card text-foreground/80 border-border hover:bg-muted'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center h-5 w-5 text-xs font-bold rounded-full bg-primary text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleClear}
              className="text-sm text-destructive hover:text-destructive font-medium whitespace-nowrap"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Result count */}
        {(totalCount > 0 || filteredCount > 0) && (
          <div className="mt-2 text-xs text-muted-foreground">
            Showing {filteredCount} of {totalCount} notifications
          </div>
        )}
      </div>

      {/* Expandable filter dropdowns */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border/50 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filterConfig.map((cfg) => (
              <div key={cfg.key}>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {cfg.label}
                </label>
                <select
                  value={filters[cfg.key] || 'all'}
                  onChange={(e) => onFilterChange(cfg.key, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-card"
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
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
              Search: &quot;{searchTerm}&quot;
              <button
                onClick={() => { setLocalSearch(''); onSearchChange(''); }}
                className="ml-0.5 hover:text-primary"
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
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-muted text-foreground/80 border border-border"
                >
                  {cfg?.label}: {label}
                  <button
                    onClick={() => onFilterChange(key, 'all')}
                    className="ml-0.5 hover:text-foreground"
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
