'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  getAllStaff,
  getStaffStats,
  type StaffMember,
  type StaffStats,
  type StaffRole,
  type StaffStatus,
  type ShiftStatus,
} from '@/data/operator/staff';

// ── Types ─────────────────────────────────────────────────────────

export type StaffTab = 'all' | 'drivers' | 'conductors';

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

// ── Hook ──────────────────────────────────────────────────────────

export function useStaffManagement() {
  const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<StaffTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('__all__');
  const [shiftFilter, setShiftFilter] = useState<string>('__all__');
  const [sort, setSort] = useState<SortConfig>({ column: 'fullName', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── Data Loading ────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([getAllStaff(), getStaffStats()]).then(([staffData, statsData]) => {
      if (cancelled) return;
      setAllStaff(staffData);
      setStats(statsData);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  // ── Tab counts ──────────────────────────────────────────────────

  const tabCounts = useMemo(
    () => ({
      all: allStaff.length,
      drivers: allStaff.filter((s) => s.role === 'DRIVER').length,
      conductors: allStaff.filter((s) => s.role === 'CONDUCTOR').length,
    }),
    [allStaff],
  );

  // ── Filtering ───────────────────────────────────────────────────

  const filteredStaff = useMemo(() => {
    let result = [...allStaff];

    // Tab filter
    if (activeTab === 'drivers') result = result.filter((s) => s.role === 'DRIVER');
    else if (activeTab === 'conductors') result = result.filter((s) => s.role === 'CONDUCTOR');

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.fullName.toLowerCase().includes(term) ||
          s.employeeId.toLowerCase().includes(term) ||
          s.phone.includes(term),
      );
    }

    // Status filter
    if (statusFilter !== '__all__') {
      result = result.filter((s) => s.status === statusFilter);
    }

    // Shift filter
    if (shiftFilter !== '__all__') {
      result = result.filter((s) => s.shiftStatus === shiftFilter);
    }

    // Sorting
    if (sort.column) {
      result.sort((a, b) => {
        const aVal = String((a as unknown as Record<string, unknown>)[sort.column] ?? '');
        const bVal = String((b as unknown as Record<string, unknown>)[sort.column] ?? '');
        const cmp = aVal.localeCompare(bVal);
        return sort.direction === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [allStaff, activeTab, searchTerm, statusFilter, shiftFilter, sort]);

  // ── Pagination ──────────────────────────────────────────────────

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredStaff.length / pageSize)),
    [filteredStaff.length, pageSize],
  );

  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStaff.slice(start, start + pageSize);
  }, [filteredStaff, currentPage, pageSize]);

  const tabTotalCount = useMemo(() => {
    if (activeTab === 'drivers') return tabCounts.drivers;
    if (activeTab === 'conductors') return tabCounts.conductors;
    return tabCounts.all;
  }, [activeTab, tabCounts]);

  // ── Handlers ────────────────────────────────────────────────────

  const handleTabChange = useCallback((tab: StaffTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handleShiftChange = useCallback((value: string) => {
    setShiftFilter(value);
    setCurrentPage(1);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('__all__');
    setShiftFilter('__all__');
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((column: string) => {
    setSort((prev) => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const handleExportAll = useCallback(() => {
    // placeholder for CSV/PDF export
    console.log('Export all staff');
  }, []);

  return {
    stats,
    loading,
    activeTab,
    searchTerm,
    statusFilter,
    shiftFilter,
    sort,
    currentPage,
    setCurrentPage,
    pageSize,
    tabCounts,
    filteredStaff,
    paginatedStaff,
    totalPages,
    tabTotalCount,
    handleTabChange,
    handleSearchChange,
    handleStatusChange,
    handleShiftChange,
    handleClearAllFilters,
    handleSort,
    handlePageSizeChange,
    handleExportAll,
  };
}
