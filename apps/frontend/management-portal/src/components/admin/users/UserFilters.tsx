'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { USER_TYPE_CONFIG, USER_STATUS_CONFIG } from '@/data/admin/users';
import type { UserType, UserStatus } from '@/data/admin/users';

interface UserFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  userTypeFilter: UserType | 'all';
  onUserTypeChange: (value: UserType | 'all') => void;
  statusFilter: UserStatus | 'all';
  onStatusChange: (value: UserStatus | 'all') => void;
  onClearAll: () => void;
  loading?: boolean;
  totalCount?: number;
  filteredCount?: number;
}

export function UserFilters({
  searchTerm,
  onSearchChange,
  userTypeFilter,
  onUserTypeChange,
  statusFilter,
  onStatusChange,
  onClearAll,
  loading = false,
  totalCount = 0,
  filteredCount = 0,
}: UserFiltersProps) {
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
    userTypeFilter !== 'all' ||
    statusFilter !== 'all';

  const activeFilterCount = [
    searchTerm && 'search',
    userTypeFilter !== 'all' && 'userType',
    statusFilter !== 'all' && 'status',
  ].filter(Boolean).length;

  const handleClearAll = useCallback(() => {
    setLocalSearch('');
    onClearAll();
  }, [onClearAll]);

  const userTypeOptions: { value: string; label: string }[] = [
    { value: 'all', label: 'All Types' },
    ...Object.entries(USER_TYPE_CONFIG).map(([key, cfg]) => ({
      value: key,
      label: cfg.label,
    })),
  ];

  const statusOptions: { value: string; label: string }[] = [
    { value: 'all', label: 'All Statuses' },
    ...Object.entries(USER_STATUS_CONFIG).map(([key, cfg]) => ({
      value: key,
      label: cfg.label,
    })),
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Search bar + toggle */}
      <div className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, NIC, or ID..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              disabled={loading}
            />
            {localSearch && (
              <button
                onClick={() => { setLocalSearch(''); onSearchChange(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
              hasActiveFilters
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {activeFilterCount}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Results count */}
        {(hasActiveFilters || totalCount > 0) && (
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span>
              {hasActiveFilters
                ? `Showing ${filteredCount} of ${totalCount} users`
                : `${totalCount} total users`}
            </span>
            {hasActiveFilters && (
              <button
                onClick={handleClearAll}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expandable Filter Dropdowns */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* User Type */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">User Type</label>
              <select
                value={userTypeFilter}
                onChange={(e) => onUserTypeChange(e.target.value as UserType | 'all')}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                disabled={loading}
              >
                {userTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => onStatusChange(e.target.value as UserStatus | 'all')}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                disabled={loading}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {hasActiveFilters && !isExpanded && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-200">
              Search: &quot;{searchTerm}&quot;
              <button
                onClick={() => { setLocalSearch(''); onSearchChange(''); }}
                className="p-0.5 hover:bg-blue-100 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {userTypeFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
              Type: {USER_TYPE_CONFIG[userTypeFilter as UserType]?.label || userTypeFilter}
              <button
                onClick={() => onUserTypeChange('all')}
                className="p-0.5 hover:bg-indigo-100 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full border border-green-200">
              Status: {USER_STATUS_CONFIG[statusFilter as UserStatus]?.label || statusFilter}
              <button
                onClick={() => onStatusChange('all')}
                className="p-0.5 hover:bg-green-100 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
