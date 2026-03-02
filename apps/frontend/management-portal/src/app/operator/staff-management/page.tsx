'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import {
  StaffStatsCards,
  StaffTypeTabs,
  StaffAdvancedFilters,
  StaffTable,
  StaffActionButtons,
} from '@/components/operator/staff';
import type { StaffTabValue } from '@/components/operator/staff';
import { DataPagination } from '@/components/shared/DataPagination';
import {
  getAllStaff,
  getStaffStats,
  type StaffMember,
  type StaffStats,
} from '@/data/operator/staff';

// ── Sort state ─────────────────────────────────────────────────────

interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

// ── Component ─────────────────────────────────────────────────────

export default function StaffManagementPage() {
  useSetPageMetadata({
    title: 'Staff Management',
    description: 'View drivers and conductors employed by your organization',
    activeItem: 'staff',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Staff Management' }],
  });

  // ── Data state ──────────────────────────────────────────────────
  const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Tab state ───────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<StaffTabValue>('all');

  // ── Filter state ────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [shiftFilter, setShiftFilter] = useState('all');

  // ── Sort state ──────────────────────────────────────────────────
  const [sort, setSort] = useState<SortState>({ field: 'fullName', direction: 'asc' });

  // ── Pagination state ────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // ── Load data ───────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [staffData, statsData] = await Promise.all([getAllStaff(), getStaffStats()]);
        if (mounted) {
          setAllStaff(staffData);
          setStats(statsData);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ── Tab counts ──────────────────────────────────────────────────
  const tabCounts = useMemo(() => ({
    all:        allStaff.length,
    drivers:    allStaff.filter((s) => s.role === 'DRIVER').length,
    conductors: allStaff.filter((s) => s.role === 'CONDUCTOR').length,
  }), [allStaff]);

  // ── Filter + sort ───────────────────────────────────────────────
  const filteredStaff = useMemo(() => {
    let list = allStaff;

    // Tab filter
    if (activeTab === 'drivers') {
      list = list.filter((s) => s.role === 'DRIVER');
    } else if (activeTab === 'conductors') {
      list = list.filter((s) => s.role === 'CONDUCTOR');
    }

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter((s) => s.status === statusFilter);
    }

    // Shift filter
    if (shiftFilter !== 'all') {
      list = list.filter((s) => s.shiftStatus === shiftFilter);
    }

    // Search
    if (searchTerm) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(term) ||
          s.nic.toLowerCase().includes(term) ||
          s.phone.toLowerCase().includes(term) ||
          s.employeeId.toLowerCase().includes(term),
      );
    }

    // Sort
    if (sort.field) {
      list = [...list].sort((a, b) => {
        const aVal = String((a as unknown as Record<string, unknown>)[sort.field] ?? '');
        const bVal = String((b as unknown as Record<string, unknown>)[sort.field] ?? '');
        const cmp = aVal.localeCompare(bVal);
        return sort.direction === 'asc' ? cmp : -cmp;
      });
    }

    return list;
  }, [allStaff, activeTab, statusFilter, shiftFilter, searchTerm, sort]);

  // ── Paginate ────────────────────────────────────────────────────
  const paginatedStaff = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredStaff.slice(start, start + pageSize);
  }, [filteredStaff, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredStaff.length / pageSize) || 1;

  // ── Tab count for filter bar ─────────────────────────────────────
  const tabTotalCount = useMemo(
    () =>
      activeTab === 'all'
        ? allStaff.length
        : activeTab === 'drivers'
        ? tabCounts.drivers
        : tabCounts.conductors,
    [activeTab, allStaff.length, tabCounts],
  );

  // ── Handlers ────────────────────────────────────────────────────
  const handleTabChange = useCallback((tab: StaffTabValue) => {
    setActiveTab(tab);
    setCurrentPage(0);
  }, []);

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(0);
  }, []);

  const handleStatusChange = useCallback((status: string) => {
    setStatusFilter(status);
    setCurrentPage(0);
  }, []);

  const handleShiftChange = useCallback((shift: string) => {
    setShiftFilter(shift);
    setCurrentPage(0);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setShiftFilter('all');
    setCurrentPage(0);
  }, []);

  const handleSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSort({ field, direction });
    setCurrentPage(0);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(0);
  }, []);

  const handleExportAll = useCallback(() => {
    if (filteredStaff.length === 0) return;

    const headers = [
      'Full Name', 'Employee ID', 'Role', 'NIC', 'Phone',
      'Email', 'Province', 'Assigned Route', 'Status', 'Shift',
    ];
    const rows = filteredStaff.map((s) => [
      s.fullName,
      s.employeeId,
      s.role,
      s.nic,
      s.phone,
      s.email,
      s.province,
      s.assignedRoute ?? '',
      s.status,
      s.shiftStatus,
    ]);

    const escapeCSV = (value: string) =>
      value.includes(',') ? `"${value.replace(/"/g, '""')}"` : value;

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map(String).map(escapeCSV).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `staff-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredStaff]);

  // ── Page actions ─────────────────────────────────────────────────
  useSetPageActions(
    <StaffActionButtons onExportAll={handleExportAll} isLoading={loading} />,
  );

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <StaffStatsCards stats={stats} loading={loading} />

      {/* Staff Type Tabs */}
      <StaffTypeTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        counts={tabCounts}
      />

      {/* Advanced Filters */}
      <StaffAdvancedFilters
        searchTerm={searchTerm}
        setSearchTerm={handleSearchChange}
        statusFilter={statusFilter}
        setStatusFilter={handleStatusChange}
        shiftFilter={shiftFilter}
        setShiftFilter={handleShiftChange}
        loading={loading}
        totalCount={tabTotalCount}
        filteredCount={filteredStaff.length}
        onClearAll={handleClearAllFilters}
      />

      {/* Staff Table + Pagination */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <StaffTable
          staff={paginatedStaff}
          mode={activeTab}
          loading={loading}
          currentSort={sort}
          onSort={handleSort}
        />
        <DataPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalElements={filteredStaff.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
          loading={loading}
        />
      </div>

      {/* Read-only notice */}
      <p className="text-xs text-gray-400 text-center">
        Staff records are managed by BusMate administration. This view is read-only.{' '}
        Contact support if you need to update staff information.
      </p>
    </div>
  );
}
