'use client';

import { Suspense } from 'react';
import { useSetPageMetadata } from '@/context/PageContext';
import {
  LogFilters,
  UserActivityTable,
  SecurityLogsTable,
  ApplicationLogsTable,
} from '@/components/admin/logs';
import {
  getUserActivityLogs,
  getSecurityLogs,
  getApplicationLogs,
} from '@/data/admin';
import { Activity, Shield, Terminal, Download } from 'lucide-react';
import { useLogsListing, type TabKey } from '@/components/admin/logs/useLogsListing';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
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
    title: 'Log Explorer',
    description: 'Browse and filter all system logs',
    activeItem: 'logs',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Logs', href: '/admin/logs' }, { label: 'Explorer' }],
  });

  const {
    activeTab,
    searchTerm,
    filters,
    currentPage,
    sort,
    filterConfig,
    totalCounts,
    filteredLogs,
    sortedLogs,
    totalPages,
    paginatedLogs,
    itemsPerPage,
    handleTabChange,
    handleSort,
    handleFilterChange,
    handleSearchChange,
    handleViewDetail,
    handleClearAll,
    setCurrentPage,
  } = useLogsListing();

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border">
        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-border">
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? tabColorClass(tab.key, true)
                    : `border-transparent ${tabColorClass(tab.key, false)}`
                }`}
              >
                {tab.icon}
                {tab.label}
                <span
                  className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key ? 'bg-card/60 font-semibold' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {totalCounts[tab.key]}
                </span>
              </button>
            ))}
          </div>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            onClick={() => {/* TODO: export */}}
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-border/50">
          <LogFilters
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAll}
            filterConfig={filterConfig}
            totalCount={totalCounts[activeTab]}
            filteredCount={filteredLogs.length}
          />
        </div>

        {/* Table */}
        <div>
          {activeTab === 'user-activity' && (
            <UserActivityTable
              logs={paginatedLogs as ReturnType<typeof getUserActivityLogs>}
              onViewDetail={handleViewDetail}
              currentSort={sort}
              onSort={handleSort}
            />
          )}
          {activeTab === 'security' && (
            <SecurityLogsTable
              logs={paginatedLogs as ReturnType<typeof getSecurityLogs>}
              onViewDetail={handleViewDetail}
              currentSort={sort}
              onSort={handleSort}
            />
          )}
          {activeTab === 'application' && (
            <ApplicationLogsTable
              logs={paginatedLogs as ReturnType<typeof getApplicationLogs>}
              onViewDetail={handleViewDetail}
              currentSort={sort}
              onSort={handleSort}
            />
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1}–
              {Math.min(currentPage * itemsPerPage, sortedLogs.length)} of {sortedLogs.length} results
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-muted-foreground/70">…</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === p ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
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

