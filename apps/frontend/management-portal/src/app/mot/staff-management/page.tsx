'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import {
  StaffStatsCards,
  StaffActionButtons,
  StaffAdvancedFilters,
  StaffTable,
  StaffTypeTabs,
  DeleteStaffModal,
} from '@/components/mot/staff';
import { DataPagination } from '@/components/shared/DataPagination';
import {
  getStaffMembers,
  getStaffStatistics,
  getStaffFilterOptions,
  StaffMember,
  StaffType,
} from '@/data/mot/staff';

type TabValue = 'all' | StaffType;

export default function StaffManagementPage() {
  const router = useRouter();

  useSetPageMetadata({
    title: 'Staff Management',
    description: 'Manage timekeepers, inspectors, and other staff',
    activeItem: 'staff',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Staff Management' }],
  });

  // Load sample data
  const allStaff = useMemo(() => getStaffMembers(), []);
  const statistics = useMemo(() => getStaffStatistics(), []);
  const filterOptions = useMemo(() => getStaffFilterOptions(), []);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabValue>('all');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [provinceFilter, setProvinceFilter] = useState('all');

  // Sort state
  const [sortBy, setSortBy] = useState('fullName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Tab counts
  const tabCounts = useMemo(
    () => ({
      all: allStaff.length,
      timekeeper: allStaff.filter((s) => s.staffType === 'timekeeper').length,
      inspector: allStaff.filter((s) => s.staffType === 'inspector').length,
    }),
    [allStaff]
  );

  // Stats for cards
  const statsForCards = useMemo(
    () => ({
      totalStaff: { count: statistics.totalStaff },
      activeStaff: { count: statistics.activeStaff },
      inactiveStaff: { count: statistics.inactiveStaff },
      totalTimekeepers: { count: statistics.totalTimekeepers },
      totalInspectors: { count: statistics.totalInspectors },
      provincesCount: { count: statistics.provincesCount },
    }),
    [statistics]
  );

  // Filter + sort + paginate
  const filteredStaff = useMemo(() => {
    let list = allStaff;

    // Tab filter
    if (activeTab !== 'all') {
      list = list.filter((s) => s.staffType === activeTab);
    }

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter((s) => s.status === statusFilter);
    }

    // Province filter
    if (provinceFilter !== 'all') {
      list = list.filter((s) => s.province === provinceFilter);
    }

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(term) ||
          s.email.toLowerCase().includes(term) ||
          s.nic.toLowerCase().includes(term) ||
          s.phone.toLowerCase().includes(term) ||
          s.assignedLocation.toLowerCase().includes(term)
      );
    }

    // Sort
    list = [...list].sort((a, b) => {
      const aVal = (a as any)[sortBy] || '';
      const bVal = (b as any)[sortBy] || '';
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [allStaff, activeTab, statusFilter, provinceFilter, searchTerm, sortBy, sortDir]);

  // Paginated
  const paginatedStaff = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredStaff.slice(start, start + pageSize);
  }, [filteredStaff, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredStaff.length / pageSize) || 1;

  // Transform for table
  const tableData = useMemo(
    () =>
      paginatedStaff.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        phone: s.phone,
        email: s.email,
        assignedLocation: s.assignedLocation,
        province: s.province,
        staffType: s.staffType,
        nic: s.nic,
        status: s.status,
        createdAt: s.createdAt,
      })),
    [paginatedStaff]
  );

  // Handlers
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(0);
  }, []);

  const handleSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSortBy(field);
    setSortDir(direction);
    setCurrentPage(0);
  }, []);

  const handleTabChange = useCallback((tab: TabValue) => {
    setActiveTab(tab);
    setCurrentPage(0);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setProvinceFilter('all');
    setCurrentPage(0);
  }, []);

  const handleAddStaff = () => {
    router.push('/mot/staff-management/add-new');
  };

  const handleExportAll = () => {
    const dataToExport = filteredStaff.map((s) => ({
      ID: s.id,
      'Full Name': s.fullName,
      Phone: s.phone,
      Email: s.email,
      NIC: s.nic,
      'Staff Type': s.staffType,
      Province: s.province,
      'Assigned Location': s.assignedLocation,
      Status: s.status,
      'Created At': s.createdAt,
    }));

    if (dataToExport.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(dataToExport[0]);
    const csvContent = [
      headers.join(','),
      ...dataToExport.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row];
            return typeof value === 'string' && value.includes(',')
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `staff-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleView = (id: string) => {
    router.push(`/mot/staff-management/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/mot/staff-management/${id}/edit`);
  };

  const handleDelete = (id: string, name: string) => {
    const member = allStaff.find((s) => s.id === id);
    if (member) {
      setStaffToDelete(member);
      setShowDeleteModal(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!staffToDelete) return;
    setIsDeleting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsDeleting(false);
    setShowDeleteModal(false);
    setStaffToDelete(null);
    // In real implementation, refresh data from API
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setStaffToDelete(null);
  };

  useSetPageActions(
    <StaffActionButtons
      onAddStaff={handleAddStaff}
      onExportAll={handleExportAll}
    />
  );

  return (
      <div className="space-y-6">
        {/* Statistics Cards */}
        <StaffStatsCards stats={statsForCards} />

        {/* Staff Type Tabs */}
        <StaffTypeTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            counts={tabCounts}
          />

        {/* Advanced Filters */}
        <StaffAdvancedFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            provinceFilter={provinceFilter}
            setProvinceFilter={setProvinceFilter}
            filterOptions={{
              statuses: filterOptions.statuses,
              provinces: filterOptions.provinces,
              locations: filterOptions.locations,
            }}
            loading={false}
            totalCount={
              activeTab === 'all'
                ? allStaff.length
                : allStaff.filter((s) => s.staffType === activeTab).length
            }
            filteredCount={tableData.length}
            onSearch={handleSearch}
            onClearAll={handleClearAllFilters}
          />

        {/* Staff Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <StaffTable
            staff={tableData}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSort={handleSort}
            activeFilters={{
              search: searchTerm,
              status: statusFilter !== 'all' ? statusFilter : undefined,
              province: provinceFilter !== 'all' ? provinceFilter : undefined,
            }}
            loading={false}
            currentSort={{ field: sortBy, direction: sortDir }}
          />

          <DataPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={filteredStaff.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(0);
            }}
          />
        </div>

        {/* Delete Staff Modal */}
        <DeleteStaffModal
          isOpen={showDeleteModal}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          staff={staffToDelete}
          isDeleting={isDeleting}
        />
      </div>
  );
}