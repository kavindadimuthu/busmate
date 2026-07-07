'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Download } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import {
  NotificationStatsCards,
  NotificationTypeTabs,
  NotificationFilterBar,
  NotificationTable,
} from '@/components/admin/notifications';
import { useNotificationsListing } from '@/hooks/admin/notifications/useNotificationsListing';

function NotificationsPageContent() {
  const router = useRouter();

  useSetPageMetadata({
    title: 'Notifications',
    description: 'Browse and filter all notifications',
    activeItem: 'notifications',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Notifications' }],
  });

  useSetPageActions(
    <>
      <button
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border hover:bg-muted rounded-lg transition-colors"
        onClick={() => {/* TODO: export */}}
      >
        <Download className="h-4 w-4" /> Export
      </button>
      <button
        onClick={() => router.push('/admin/notifications/compose')}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-primary hover:bg-primary/90 rounded-lg font-medium transition-colors"
      >
        <Plus className="h-3.5 w-3.5" /> Compose
      </button>
    </>
  );

  const {
    stats,
    activeTab,
    searchTerm,
    filters,
    currentPage,
    sort,
    filterConfig,
    totalCounts,
    sortedNotifications,
    paginatedNotifications,
    pageSize,
    handleTabChange,
    handleSort,
    handleFilterChange,
    handleSearchChange,
    handleViewDetail,
    handleClearAll,
    setCurrentPage,
    handlePageSizeChange,
  } = useNotificationsListing();

  const activeFilterCount = [
    searchTerm && 'search',
    ...Object.entries(filters)
      .filter(([, v]) => v !== '__all__' && v !== 'all' && Boolean(v))
      .map(([k]) => k),
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <NotificationTypeTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        counts={totalCounts}
      />

      <NotificationStatsCards stats={stats} loading={false} />

      <NotificationFilterBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearAll}
        filterConfig={filterConfig}
        activeFilterCount={activeFilterCount}
      />

      <NotificationTable
        notifications={paginatedNotifications}
        totalItems={sortedNotifications.length}
        page={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={handlePageSizeChange}
        sortColumn={sort.field}
        sortDirection={sort.direction}
        onSort={handleSort}
        loading={false}
        onView={handleViewDetail}
      />
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
      <NotificationsPageContent />
    </Suspense>
  );
}

