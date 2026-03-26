'use client';

import { Suspense } from 'react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { useRouter } from 'next/navigation';
import { NotificationFilters, NotificationTable } from '@/components/admin/notifications';
import { Bell, Send, Clock, FileText, Download, Plus } from 'lucide-react';
import { useNotificationsListing, type TabKey } from '@/components/admin/notifications/useNotificationsListing';
import { ColoredTabBar, type ColoredTab } from '@/components/shared/ColoredTabBar';
import { SimplePagination } from '@/components/shared/SimplePagination';

const TABS: ColoredTab<TabKey>[] = [
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
    title: 'Notification Explorer', description: 'Browse and filter all notifications',
    activeItem: 'notifications', showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Notifications', href: '/admin/notifications' }, { label: 'Explorer' }],
  });
  useSetPageActions(
    <>
      <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border hover:bg-muted rounded-lg transition-colors" onClick={() => {/* TODO: export */}}>
        <Download className="h-4 w-4" /> Export
      </button>
      <button onClick={() => router.push('/admin/notifications/compose')} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-primary hover:bg-primary rounded-lg font-medium transition-colors">
        <Plus className="h-3.5 w-3.5" /> Compose
      </button>
    </>
  );
  const {
    activeTab, searchTerm, filters, currentPage, sort, filterConfig,
    totalCounts, filteredNotifications, sortedNotifications, totalPages,
    paginatedNotifications, itemsPerPage, handleTabChange, handleSort,
    handleFilterChange, handleSearchChange, handleViewDetail, setCurrentPage,
  } = useNotificationsListing();

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border">
        <ColoredTabBar tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange}
          colorClass={tabColorClass} counts={totalCounts} />
        <div className="p-4 border-b border-border/50">
          <NotificationFilters searchTerm={searchTerm} onSearchChange={handleSearchChange}
            filters={filters} onFilterChange={handleFilterChange} filterConfig={filterConfig}
            totalCount={totalCounts[activeTab]} filteredCount={filteredNotifications.length} />
        </div>
        <NotificationTable notifications={paginatedNotifications} onView={handleViewDetail}
          currentSort={sort} onSort={handleSort} />
        <SimplePagination currentPage={currentPage} totalPages={totalPages}
          totalItems={sortedNotifications.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
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
