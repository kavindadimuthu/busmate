'use client';

import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@busmate/ui';

import { SchedulesStatsCardsNew } from '@/components/mot/schedules/schedules-stats-cards';
import { SchedulesFilterBar } from '@/components/mot/schedules/schedules-filter-bar';
import { SchedulesTableNew } from '@/components/mot/schedules/schedules-table';
import { ScheduleActionButtons } from '@/components/mot/schedules/ScheduleActionButtons';
import { useSchedules } from '@/components/mot/schedules/useSchedules';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';

export default function SchedulesPage() {
  const router = useRouter();

  const {
    schedules, totalItems, isLoading, searchQuery, sortColumn, sortDirection, page, pageSize,
    filters, setPage, setPageSize, setSort, setSearch, setFilters, clearFilters, filterOptions,
    stats, activeFilterCount, deleteDialog, isDeleting, handleDeleteConfirm,
    handleView, handleEdit, handleAssignBuses, handleExportAll,
  } = useSchedules();

  useSetPageMetadata({
    title: 'Schedules',
    description: 'Manage route schedules with advanced filtering and search capabilities',
    activeItem: 'schedules',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Schedules' }],
  });

  useSetPageActions(
    <ScheduleActionButtons
      onAddSchedule={() => router.push('/mot/schedules/workspace')}
      onImportSchedules={() => router.push('/mot/schedules/import')}
      onExportAll={handleExportAll}
      isLoading={isLoading}
    />,
  );

  return (
    <div className="space-y-6">
      <SchedulesStatsCardsNew stats={stats} />

      <SchedulesFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
        onClearAll={clearFilters}
        filterOptions={filterOptions}
        activeFilterCount={activeFilterCount}
      />

      <SchedulesTableNew
        data={schedules}
        loading={isLoading}
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSort={setSort}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={(id) => {
          const s = schedules.find((x) => x.id === id);
          if (s) deleteDialog.open(s);
        }}
        onAssignBuses={handleAssignBuses}
        hasActiveFilters={activeFilterCount > 0}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setOpen}
        title="Delete Schedule"
        description={`Are you sure you want to delete "${deleteDialog.data?.name}"? All associated data will be permanently removed. This action cannot be undone.`}
        confirmLabel="Delete Schedule"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />
    </div>
  );
}
