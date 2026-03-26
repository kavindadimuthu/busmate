'use client';

import { Suspense } from 'react';
import { useSetPageMetadata } from '@/context/PageContext';
import { LogFilters, UserActivityTable, SecurityLogsTable, ApplicationLogsTable } from '@/components/admin/logs';
import { getUserActivityLogs, getSecurityLogs, getApplicationLogs } from '@/data/admin';
import { Activity, Shield, Terminal, Download } from 'lucide-react';
import { useLogsListing, type TabKey } from '@/components/admin/logs/useLogsListing';
import { ColoredTabBar, type ColoredTab } from '@/components/shared/ColoredTabBar';
import { SimplePagination } from '@/components/shared/SimplePagination';

const TABS: ColoredTab<TabKey>[] = [
  { key: 'user-activity', label: 'User Activity', icon: <Activity className="h-4 w-4" /> },
  { key: 'security', label: 'Security', icon: <Shield className="h-4 w-4" /> },
  { key: 'application', label: 'Application', icon: <Terminal className="h-4 w-4" /> },
];

function tabColorClass(tab: TabKey, isActive: boolean): string {
  if (!isActive) return 'text-muted-foreground hover:text-foreground/80 hover:bg-muted';
  switch (tab) {
    case 'user-activity': return 'text-success bg-success/10 border-success';
    case 'security': return 'text-orange-700 bg-warning/10 border-orange-500';
    case 'application': return 'text-primary bg-primary/10 border-primary';
  }
}

function LogsListingContent() {
  useSetPageMetadata({
    title: 'Log Explorer', description: 'Browse and filter all system logs',
    activeItem: 'logs', showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Logs', href: '/admin/logs' }, { label: 'Explorer' }],
  });
  const {
    activeTab, searchTerm, filters, currentPage, sort, filterConfig,
    totalCounts, filteredLogs, sortedLogs, totalPages, paginatedLogs,
    itemsPerPage, handleTabChange, handleSort, handleFilterChange,
    handleSearchChange, handleViewDetail, handleClearAll, setCurrentPage,
  } = useLogsListing();

  const exportBtn = (
    <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors" onClick={() => {/* TODO: export */}}>
      <Download className="h-4 w-4" /> Export
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border">
        <ColoredTabBar tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange}
          colorClass={tabColorClass} counts={totalCounts} trailing={exportBtn} />
        <div className="p-4 border-b border-border/50">
          <LogFilters searchTerm={searchTerm} onSearchChange={handleSearchChange}
            filters={filters} onFilterChange={handleFilterChange} onClearAll={handleClearAll}
            filterConfig={filterConfig} totalCount={totalCounts[activeTab]} filteredCount={filteredLogs.length} />
        </div>
        {activeTab === 'user-activity' && (
          <UserActivityTable logs={paginatedLogs as ReturnType<typeof getUserActivityLogs>}
            onViewDetail={handleViewDetail} currentSort={sort} onSort={handleSort} />
        )}
        {activeTab === 'security' && (
          <SecurityLogsTable logs={paginatedLogs as ReturnType<typeof getSecurityLogs>}
            onViewDetail={handleViewDetail} currentSort={sort} onSort={handleSort} />
        )}
        {activeTab === 'application' && (
          <ApplicationLogsTable logs={paginatedLogs as ReturnType<typeof getApplicationLogs>}
            onViewDetail={handleViewDetail} currentSort={sort} onSort={handleSort} />
        )}
        <SimplePagination currentPage={currentPage} totalPages={totalPages}
          totalItems={sortedLogs.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}

export default function LogsListingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
      <LogsListingContent />
    </Suspense>
  );
}

