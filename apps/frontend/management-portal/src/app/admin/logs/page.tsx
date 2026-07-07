'use client';

import { Suspense } from 'react';
import { useSetPageMetadata } from '@/context/PageContext';
import {
  LogStatsCards,
  LogTypeTabs,
  LogFilterBar,
  UserActivityTable,
  SecurityLogsTable,
  ApplicationLogsTable,
} from '@/components/admin/logs';
import type { UserActivityLog, SecurityLog, ApplicationLog } from '@/data/admin/types';
import { useLogsListing, type TabKey } from '@/hooks/admin/logs/useLogsListing';

function LogsPageContent() {
  useSetPageMetadata({
    title: 'System Logs',
    description: 'Browse and filter all system logs',
    activeItem: 'logs',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Logs' }],
  });

  const {
    stats,
    activeTab,
    searchTerm,
    filters,
    currentPage,
    sort,
    filterConfig,
    totalCounts,
    sortedLogs,
    paginatedLogs,
    pageSize,
    handleTabChange,
    handleSort,
    handleFilterChange,
    handleSearchChange,
    handleViewDetail,
    handleClearAll,
    setCurrentPage,
    handlePageSizeChange,
  } = useLogsListing();

  const activeFilterCount = [
    searchTerm && 'search',
    ...Object.entries(filters)
      .filter(([, v]) => v !== '__all__' && v !== 'all' && Boolean(v))
      .map(([k]) => k),
  ].filter(Boolean).length;

  const commonTableProps = {
    totalItems: sortedLogs.length,
    page: currentPage,
    pageSize,
    onPageChange: setCurrentPage,
    onPageSizeChange: handlePageSizeChange,
    sortColumn: sort.field,
    sortDirection: sort.direction,
    onSort: handleSort,
    loading: false,
    onViewDetail: handleViewDetail,
  };

  return (
    <div className="space-y-6">
      <LogTypeTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        counts={totalCounts}
      />

      <LogStatsCards stats={stats} loading={false} />

      <LogFilterBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearAll}
        filterConfig={filterConfig}
        activeFilterCount={activeFilterCount}
      />

      {activeTab === 'user-activity' && (
        <UserActivityTable
          logs={paginatedLogs as UserActivityLog[]}
          {...commonTableProps}
        />
      )}
      {activeTab === 'security' && (
        <SecurityLogsTable
          logs={paginatedLogs as SecurityLog[]}
          {...commonTableProps}
        />
      )}
      {activeTab === 'application' && (
        <ApplicationLogsTable
          logs={paginatedLogs as ApplicationLog[]}
          {...commonTableProps}
        />
      )}
    </div>
  );
}

export default function LogsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
      <LogsPageContent />
    </Suspense>
  );
}

