'use client';

import { Suspense } from 'react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { useRouter } from 'next/navigation';
import {
  NotificationFilters,
  NotificationTable,
} from '@/components/admin/notifications';
import { Bell, Send, Clock, FileText, Download, Plus } from 'lucide-react';
import { useNotificationsListing, type TabKey } from '@/components/admin/notifications/useNotificationsListing';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All', icon: <Bell className="h-4 w-4" /> },
  { key: 'sent', label: 'Sent', icon: <Send className="h-4 w-4" /> },
  { key: 'scheduled', label: 'Scheduled', icon: <Clock className="h-4 w-4" /> },
  { key: 'drafts', label: 'Drafts', icon: <FileText className="h-4 w-4" /> },
];

function tabColorClass(tab: TabKey, isActive: boolean): string {
  if (!isActive) return 'text-muted-foreground hover:text-foreground/80 hover:bg-muted';
  switch (tab) {
    case 'all': return 'text-primary bg-primary/10 border-primary';
    case 'sent': return 'text-success bg-success/10 border-success';
    case 'scheduled': return 'text-warning bg-warning/10 border-warning';
    case 'drafts': return 'text-[hsl(var(--purple-700))] bg-[hsl(var(--purple-50))] border-[hsl(var(--purple-500))]';
  }
}

function NotificationsListingContent() {
  const router = useRouter();

  useSetPageMetadata({
    title: 'Notification Explorer',
    description: 'Browse and filter all notifications',
    activeItem: 'notifications',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Notifications', href: '/admin/notifications' },
      { label: 'Explorer' },
    ],
  });

  useSetPageActions(
    <>
      <button
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border hover:bg-muted rounded-lg transition-colors"
        onClick={() => {/* TODO: export */}}
      >
        <Download className="h-4 w-4" />
        Export
      </button>
      <button
        onClick={() => router.push('/admin/notifications/compose')}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-primary hover:bg-primary rounded-lg font-medium transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Compose
      </button>
    </>
  );

  const {
    activeTab,
    searchTerm,
    filters,
    currentPage,
    sort,
    filterConfig,
    totalCounts,
    filteredNotifications,
    sortedNotifications,
    totalPages,
    paginatedNotifications,
    itemsPerPage,
    handleTabChange,
    handleSort,
    handleFilterChange,
    handleSearchChange,
    handleViewDetail,
    handleClearAll,
    setCurrentPage,
  } = useNotificationsListing();

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
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-border/50">
          <NotificationFilters
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            filters={filters}
            onFilterChange={handleFilterChange}
            filterConfig={filterConfig}
            totalCount={totalCounts[activeTab]}
            filteredCount={filteredNotifications.length}
          />
        </div>

        {/* Table */}
        <NotificationTable
          notifications={paginatedNotifications}
          onView={handleViewDetail}
          currentSort={sort}
          onSort={handleSort}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1}–
              {Math.min(currentPage * itemsPerPage, sortedNotifications.length)} of{' '}
              {sortedNotifications.length} results
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

export default function NotificationsListingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
      <NotificationsListingContent />
    </Suspense>
  );
}
